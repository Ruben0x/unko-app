import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CheckInButton } from "@/components/check-in-button";
import { VoteButtons } from "@/components/vote-buttons";
import type { ItemSummary } from "@/types/item";

// ─── Labels / colors ───────────────────────────────────────────────────────────

const TYPE_LABELS = { PLACE: "Lugar", FOOD: "Comida" } as const;
const TYPE_COLORS = {
  PLACE: "bg-blue-100 text-blue-700",
  FOOD: "bg-orange-100 text-orange-700",
} as const;
const STATUS_COLORS = {
  PENDING: "bg-zinc-100 text-zinc-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
} as const;
const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
} as const;

// ─── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  required,
  isOwner,
}: {
  item: ItemSummary;
  required: number;
  isOwner: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col overflow-hidden">
      {/* Cover image */}
      {item.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-0">
        {/* Title + badges */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-semibold text-zinc-900 leading-snug">
            {item.title}
          </h3>
          <div className="flex shrink-0 gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}
            >
              {TYPE_LABELS[item.type]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}
            >
              {STATUS_LABELS[item.status]}
            </span>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="mb-3 text-sm text-zinc-500 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Location */}
        {item.location && (
          <p className="mb-3 text-xs text-zinc-400">📍 {item.location}</p>
        )}

        {/* External link */}
        {item.externalUrl && (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 block text-xs text-blue-600 underline underline-offset-2 truncate"
          >
            {item.externalUrl}
          </a>
        )}

        {/* Stats row */}
        <div className="mt-auto flex items-center gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          {item.status !== "PENDING" && (
            <span>
              ✓ {item.approvals} · ✗ {item.rejections}
            </span>
          )}
          {item.status === "APPROVED" && (
            <span>
              · {item._count.checks} visita
              {item._count.checks !== 1 ? "s" : ""}
            </span>
          )}
          <span className="ml-auto">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Author */}
        <div className="mt-2 flex items-center gap-2">
          {item.createdBy.image && (
            <Image
              src={item.createdBy.image}
              alt={item.createdBy.name ?? ""}
              width={18}
              height={18}
              className="rounded-full"
            />
          )}
          <span className="text-xs text-zinc-400">
            {item.createdBy.name ?? item.createdBy.id}
          </span>
        </div>

        {/* Vote buttons — only for PENDING items that the user didn't create */}
        {item.status === "PENDING" && (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            {isOwner ? (
              <p className="text-center text-xs text-zinc-400">
                ✓ Tu voto de aprobación se registró al crear el ítem
              </p>
            ) : (
              <VoteButtons
                itemId={item.id}
                myVote={item.myVote}
                approvals={item.approvals}
                rejections={item.rejections}
                required={required}
              />
            )}
          </div>
        )}

        {/* Check-in — only for APPROVED items */}
        {item.status === "APPROVED" && (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <CheckInButton itemId={item.id} myCheck={item.myCheck} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Item List (Server Component) ─────────────────────────────────────────────

export async function ItemList({ currentUserId }: { currentUserId: string }) {
  const [rawItems, totalActiveUsers] = await Promise.all([
    prisma.item.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        description: true,
        location: true,
        externalUrl: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { checks: true },
        },
        // All votes — used to compute approvals, rejections, and myVote
        votes: {
          select: { userId: true, value: true },
        },
        // Current user's check, if any
        checks: {
          where: { userId: currentUserId },
          select: { id: true, photoUrl: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  const required = Math.floor(totalActiveUsers / 2) + 1;

  const items: ItemSummary[] = rawItems.map((item) => ({
    ...item,
    approvals: item.votes.filter((v) => v.value === "APPROVE").length,
    rejections: item.votes.filter((v) => v.value === "REJECT").length,
    myVote:
      (item.votes.find((v) => v.userId === currentUserId)?.value as
        | "APPROVE"
        | "REJECT"
        | undefined) ?? null,
    myCheck: item.checks[0] ?? null,
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
        No hay items todavía. ¡Agrega el primero!
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          required={required}
          isOwner={item.createdBy.id === currentUserId}
        />
      ))}
    </div>
  );
}
