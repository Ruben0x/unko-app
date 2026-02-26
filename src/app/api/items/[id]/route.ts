import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── DELETE /api/items/[id] ────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, tripId: true, createdById: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
  }

  // Check membership in trip
  const membership = await prisma.tripParticipant.findFirst({
    where: { tripId: item.tripId, userId: session.user.id },
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only creator or ADMIN can delete
  const isCreator = item.createdById === session.user.id;
  const isAdmin = membership.role === "ADMIN";

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Solo el creador o un admin puede eliminar este ítem" }, { status: 403 });
  }

  await prisma.item.delete({ where: { id: itemId } });
  return new NextResponse(null, { status: 204 });
}
