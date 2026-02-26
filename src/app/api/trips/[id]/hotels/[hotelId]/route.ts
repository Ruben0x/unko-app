import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId },
    select: { role: true },
  });
}

// ─── DELETE /api/trips/[id]/hotels/[hotelId] ─────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; hotelId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId, hotelId } = await params;
  const membership = await requireMember(tripId, session.user.id);
  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, tripId },
    select: { id: true },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel no encontrado" }, { status: 404 });
  }

  await prisma.hotel.delete({ where: { id: hotelId } });
  return new NextResponse(null, { status: 204 });
}
