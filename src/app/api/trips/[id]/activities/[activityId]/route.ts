import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId },
    select: { role: true },
  });
}

// ─── DELETE /api/trips/[id]/activities/[activityId] ───────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId, activityId } = await params;
  const membership = await requireMember(tripId, session.user.id);
  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, tripId },
    select: { id: true },
  });
  if (!activity) {
    return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id: activityId } });
  return new NextResponse(null, { status: 204 });
}
