import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId },
    select: { role: true },
  });
}

const createExpenseSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.number().positive(),
  currency: z.enum(["CLP", "JPY", "USD", "EUR", "GBP", "KRW", "CNY", "THB"]),
  paidByParticipantId: z.string().cuid().optional(),
  expenseDate: z.string().optional(),
  // EQUAL split: list of participantIds to split among
  participantIds: z.array(z.string().cuid()).min(1),
});

// ─── GET /api/trips/[id]/expenses ─────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId } = await params;
  if (!(await requireMember(tripId, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expenses = await prisma.expense.findMany({
    where: { tripId },
    select: {
      id: true, description: true, amount: true, currency: true,
      expenseDate: true, splitType: true, createdAt: true,
      paidBy: { select: { id: true, name: true } },
      participants: {
        select: {
          amount: true,
          participant: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { expenseDate: "desc" },
  });

  return NextResponse.json({ expenses });
}

// ─── POST /api/trips/[id]/expenses ────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId } = await params;
  const membership = await requireMember(tripId, session.user.id);
  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createExpenseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { description, amount, currency, paidByParticipantId, expenseDate, participantIds } = result.data;

  // Validate that all participantIds belong to this trip
  const participantCount = await prisma.tripParticipant.count({
    where: { id: { in: participantIds }, tripId },
  });
  if (participantCount !== participantIds.length) {
    return NextResponse.json({ error: "Uno o más participantes no pertenecen al viaje" }, { status: 400 });
  }

  // Compute equal split (round to 2 decimal places, give remainder to first participant)
  const perPerson = Math.floor((amount / participantIds.length) * 100) / 100;
  const remainder = Math.round((amount - perPerson * participantIds.length) * 100) / 100;

  const expense = await prisma.expense.create({
    data: {
      tripId,
      createdById: session.user.id,
      paidByParticipantId: paidByParticipantId ?? null,
      description,
      amount,
      currency,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      splitType: "EQUAL",
      participants: {
        create: participantIds.map((pid, i) => ({
          participantId: pid,
          amount: i === 0 ? perPerson + remainder : perPerson,
        })),
      },
    },
    select: {
      id: true, description: true, amount: true, currency: true,
      expenseDate: true, splitType: true, createdAt: true,
      paidBy: { select: { id: true, name: true } },
      participants: {
        select: {
          amount: true,
          participant: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
