import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ─── Validation ────────────────────────────────────────────────────────────────

const voteSchema = z.object({
  value: z.enum(["APPROVE", "REJECT"], {
    error: "value must be APPROVE or REJECT",
  }),
});

// ─── POST /api/items/[id]/vote ─────────────────────────────────────────────────
//
// Race condition strategy: SELECT ... FOR UPDATE on the Item row.
//
// When two votes arrive simultaneously for the same item:
//   T1: SELECT id, status FROM "Item" WHERE id = ? FOR UPDATE  ← acquires lock
//   T2: SELECT id, status FROM "Item" WHERE id = ? FOR UPDATE  ← blocks here
//   T1: upsert vote → count → update status → COMMIT          ← releases lock
//   T2: unblocks, reads counts that already include T1's vote  ← correct result
//
// Double-submit: upsert is idempotent — voting the same value twice or retrying
// a failed request returns the same result without side effects.

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

  // ── Input validation ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = voteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { value } = result.data;
  const userId = session.user.id;

  // ── Atomic transaction ───────────────────────────────────────────────────────
  try {
    const output = await prisma.$transaction(async (tx) => {
      // 1. Lock the Item row exclusively.
      const locked = await tx.$queryRaw<
        Array<{ id: string; status: string; createdById: string; tripId: string }>
      >`SELECT id, status::text AS status, "createdById", "tripId" FROM "Item" WHERE id = ${itemId} FOR UPDATE`;

      if (locked.length === 0) {
        throw { code: "NOT_FOUND" };
      }

      if (locked[0].createdById === userId) {
        throw { code: "OWN_ITEM" };
      }

      if (locked[0].status !== "PENDING") {
        throw { code: "NOT_PENDING", status: locked[0].status };
      }

      // 2. Upsert the vote — idempotent, handles retries and double-submits.
      const vote = await tx.vote.upsert({
        where: { userId_itemId: { userId, itemId } },
        create: { userId, itemId, value },
        update: { value },
        select: { id: true, value: true },
      });

      // 3. Count votes and trip registered participants inside the lock boundary.
      const tripId = locked[0].tripId;
      const [approvals, rejections, registeredParticipants] = await Promise.all([
        tx.vote.count({ where: { itemId, value: "APPROVE" } }),
        tx.vote.count({ where: { itemId, value: "REJECT" } }),
        tx.tripParticipant.count({
          where: { tripId, type: "REGISTERED", user: { status: "ACTIVE" } },
        }),
      ]);

      // 4. Simple majority: floor(registered_participants / 2) + 1
      const required = Math.floor(registeredParticipants / 2) + 1;

      let newStatus: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
      if (approvals >= required) newStatus = "APPROVED";
      else if (rejections >= required) newStatus = "REJECTED";

      // 5. Update item status.
      const item = await tx.item.update({
        where: { id: itemId },
        data: { status: newStatus },
        select: { id: true, status: true, title: true },
      });

      return {
        item,
        vote,
        summary: { approvals, rejections, required, registeredParticipants },
      };
    });

    if (output.item.status !== "PENDING") {
      logger.info("item.status.changed", {
        itemId,
        status: output.item.status,
        triggeredBy: userId,
        value,
        summary: output.summary,
      });
    }

    logger.info("vote.cast", {
      itemId,
      userId,
      value,
      itemStatus: output.item.status,
    });

    return NextResponse.json(output);
  } catch (err: unknown) {
    const e = err as { code?: string; status?: string };

    if (e?.code === "NOT_FOUND") {
      logger.warn("vote.item_not_found", { itemId, userId });
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (e?.code === "OWN_ITEM") {
      logger.warn("vote.own_item", { itemId, userId });
      return NextResponse.json(
        { error: "No puedes votar por tu propio ítem" },
        { status: 403 },
      );
    }
    if (e?.code === "NOT_PENDING") {
      logger.warn("vote.item_not_pending", {
        itemId,
        userId,
        currentStatus: e.status,
      });
      return NextResponse.json(
        { error: `Item is already ${e.status?.toLowerCase()}` },
        { status: 409 },
      );
    }
    throw err;
  }
}
