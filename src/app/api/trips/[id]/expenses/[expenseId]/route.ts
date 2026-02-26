import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId },
    select: { role: true },
  });
}

// ─── DELETE /api/trips/[id]/expenses/[expenseId] ──────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId, expenseId } = await params;
  const membership = await requireMember(tripId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId },
    select: { id: true, createdById: true },
  });
  if (!expense) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  // Only creator or ADMIN can delete
  if (expense.createdById !== session.user.id && membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return new NextResponse(null, { status: 204 });
}
