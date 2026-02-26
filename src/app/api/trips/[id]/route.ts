import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId, role: "ADMIN" },
    select: { id: true },
  });
}

const updateTripSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  destination: z.string().trim().max(500).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  defaultCurrency: z
    .enum(["CLP", "JPY", "USD", "EUR", "GBP", "KRW", "CNY", "THB"])
    .optional(),
});

// ─── PATCH /api/trips/[id] ────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;

  if (!(await requireAdmin(tripId, session.user.id))) {
    return NextResponse.json({ error: "Solo los administradores pueden editar el viaje" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateTripSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, description, destination, startDate, endDate, defaultCurrency } = result.data;

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(destination !== undefined && { destination: destination || null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(defaultCurrency !== undefined && { defaultCurrency }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      destination: true,
      startDate: true,
      endDate: true,
      defaultCurrency: true,
    },
  });

  return NextResponse.json(trip);
}

// ─── DELETE /api/trips/[id] ───────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId } = await params;

  if (!(await requireAdmin(tripId, session.user.id))) {
    return NextResponse.json({ error: "Solo el administrador puede eliminar el viaje" }, { status: 403 });
  }

  await prisma.trip.delete({ where: { id: tripId } });
  return new NextResponse(null, { status: 204 });
}
