import type { TransactionClient } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Recalculates the status of every PENDING item using the registered active
 * participant count of each item's trip as the threshold.
 *
 * Called inside a $transaction whenever a user is deactivated. Past votes are
 * immutable and count regardless of the voter's current status.
 *
 * Returns the number of items whose status changed.
 */
export async function recalculatePendingItems(
  tx: TransactionClient,
): Promise<number> {
  // 1. Fetch all pending items with their tripId.
  const pendingItems = await tx.item.findMany({
    where: { status: "PENDING" },
    select: { id: true, tripId: true },
  });

  if (pendingItems.length === 0) return 0;

  const pendingIds = pendingItems.map((i) => i.id);

  // 2. Compute the majority threshold for each unique trip involved.
  const tripIds = [...new Set(pendingItems.map((i) => i.tripId))];

  const thresholdByTrip = new Map<string, number>();
  for (const tripId of tripIds) {
    const count = await tx.tripParticipant.count({
      where: { tripId, type: "REGISTERED", user: { status: "ACTIVE" } },
    });
    // If no active participants remain, use Infinity so no item auto-resolves.
    thresholdByTrip.set(tripId, count === 0 ? Infinity : Math.floor(count / 2) + 1);
  }

  // 3. Aggregate vote counts per item in a single query.
  const voteCounts = await tx.vote.groupBy({
    by: ["itemId", "value"],
    where: { itemId: { in: pendingIds } },
    _count: { value: true },
  });

  // Build a lookup: itemId → { approvals, rejections }
  const counts = new Map<string, { approvals: number; rejections: number }>();
  for (const vc of voteCounts) {
    if (!counts.has(vc.itemId)) {
      counts.set(vc.itemId, { approvals: 0, rejections: 0 });
    }
    const entry = counts.get(vc.itemId)!;
    if (vc.value === "APPROVE") entry.approvals = vc._count.value;
    else entry.rejections = vc._count.value;
  }

  const toApprove: string[] = [];
  const toReject: string[] = [];

  for (const { id: itemId, tripId } of pendingItems) {
    const threshold = thresholdByTrip.get(tripId) ?? Infinity;
    const { approvals = 0, rejections = 0 } = counts.get(itemId) ?? {};
    if (approvals >= threshold) toApprove.push(itemId);
    else if (rejections >= threshold) toReject.push(itemId);
  }

  let updated = 0;

  if (toApprove.length > 0) {
    const r = await tx.item.updateMany({
      where: { id: { in: toApprove }, status: "PENDING" },
      data: { status: "APPROVED" },
    });
    updated += r.count;
  }

  if (toReject.length > 0) {
    const r = await tx.item.updateMany({
      where: { id: { in: toReject }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    updated += r.count;
  }

  logger.info("recalculate.done", {
    tripsAffected: tripIds.length,
    pendingChecked: pendingIds.length,
    approved: toApprove.length,
    rejected: toReject.length,
  });

  return updated;
}
