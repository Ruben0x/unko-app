import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Validation ────────────────────────────────────────────────────────────────

const checkSchema = z.object({
  photoUrl: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (url) => url.startsWith("https://res.cloudinary.com/"),
      "photoUrl must be a Cloudinary URL",
    )
    .optional(),
});

// ─── Shared select shape ───────────────────────────────────────────────────────

const checkSelect = {
  id: true,
  photoUrl: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, image: true } },
  item: { select: { id: true, title: true, status: true } },
} as const;

// ─── POST /api/items/[id]/check ────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Auth guard ───────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id || session.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: itemId } = await params;
  const userId = session.user.id;

  // ── Input validation ─────────────────────────────────────────────────────────
  let body: unknown = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = checkSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { photoUrl } = result.data;

  // ── Business rule: item must exist and be APPROVED ───────────────────────────
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { status: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "APPROVED") {
    return NextResponse.json(
      { error: `Cannot check an item with status ${item.status.toLowerCase()}` },
      { status: 409 },
    );
  }

  // ── Upsert: create check or update photoUrl ───────────────────────────────────
  const existing = await prisma.check.findUnique({
    where: { userId_itemId: { userId, itemId } },
    select: { id: true },
  });

  if (existing) {
    const check = await prisma.check.update({
      where: { userId_itemId: { userId, itemId } },
      data: { photoUrl: photoUrl ?? null },
      select: checkSelect,
    });
    return NextResponse.json(check, { status: 200 });
  }

  const check = await prisma.check.create({
    data: {
      userId,
      itemId,
      photoUrl: photoUrl ?? null,
    },
    select: checkSelect,
  });

  return NextResponse.json(check, { status: 201 });
}
