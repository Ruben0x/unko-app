import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(tripId: string, userId: string) {
  return prisma.tripParticipant.findFirst({
    where: { tripId, userId },
    select: { role: true },
  });
}

// ─── DELETE /api/trips/[id]/payments/[paymentId] ──────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: tripId, paymentId } = await params;
  const membership = await requireMember(tripId, session.user.id);
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — solo ADMIN puede eliminar pagos" }, { status: 403 });
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tripId },
    select: { id: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  await prisma.payment.delete({ where: { id: paymentId } });
  return new NextResponse(null, { status: 204 });
}
