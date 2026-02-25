import type { TransactionClient } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Recalculates the status of every PENDING item using the current active-user
 * count as the threshold.
 *
 * Called inside a $transaction whenever the number of ACTIVE users changes
 * (user deactivated). Past votes are immutable and count regardless of the
 * voter's current status.
 *
 * Returns the number of items whose status changed.
 */
export async function recalculatePendingItems(
  tx: TransactionClient,
): Promise<number> {
  const totalActiveUsers = await tx.user.count({ where: { status: "ACTIVE" } });
  const threshold = Math.floor(totalActiveUsers / 2) + 1;

  // Edge case: if there are no active users, skip recalculation.
  if (totalActiveUsers === 0) {
    logger.warn("recalculate.skipped", { reason: "no_active_users" });
    return 0;
  }

  // Fetch IDs of all PENDING items
  const pendingItems = await tx.item.findMany({
    where: { status: "PENDING" },
    select: { id: true },
  });

  if (pendingItems.length === 0) return 0;

  const pendingIds = pendingItems.map((i) => i.id);

  // Aggregate vote counts per item and value in a single query
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

  for (const [itemId, { approvals, rejections }] of counts) {
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
    totalActiveUsers,
    threshold,
    pendingChecked: pendingIds.length,
    approved: toApprove.length,
    rejected: toReject.length,
  });

  return updated;
}
