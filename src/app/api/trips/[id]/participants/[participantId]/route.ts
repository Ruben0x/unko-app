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

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

// ─── PATCH /api/trips/[id]/participants/[participantId] ───────────────────────
// Change participant role

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId, participantId } = await params;

  if (!(await requireAdmin(tripId, session.user.id))) {
    return NextResponse.json({ error: "Solo los administradores pueden cambiar roles" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateRoleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const participant = await prisma.tripParticipant.findFirst({
    where: { id: participantId, tripId },
    select: { id: true, userId: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });
  }

  // Prevent demoting yourself if you're the only admin
  if (participant.userId === session.user.id && result.data.role !== "ADMIN") {
    const adminCount = await prisma.tripParticipant.count({
      where: { tripId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Debe haber al menos un administrador en el viaje" }, { status: 409 });
    }
  }

  const updated = await prisma.tripParticipant.update({
    where: { id: participantId },
    data: { role: result.data.role },
    select: { id: true, name: true, role: true, type: true },
  });

  return NextResponse.json(updated);
}

// ─── DELETE /api/trips/[id]/participants/[participantId] ──────────────────────
// Remove participant from trip

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tripId, participantId } = await params;

  if (!(await requireAdmin(tripId, session.user.id))) {
    return NextResponse.json({ error: "Solo los administradores pueden eliminar participantes" }, { status: 403 });
  }

  const participant = await prisma.tripParticipant.findFirst({
    where: { id: participantId, tripId },
    select: { id: true, userId: true, role: true },
  });

  if (!participant) {
    return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });
  }

  // Prevent removing the last admin
  if (participant.role === "ADMIN") {
    const adminCount = await prisma.tripParticipant.count({
      where: { tripId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "No puedes eliminar al único administrador del viaje" }, { status: 409 });
    }
  }

  await prisma.tripParticipant.delete({ where: { id: participantId } });
  return new NextResponse(null, { status: 204 });
}
