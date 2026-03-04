"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface VoteButtonsProps {
  itemId: string;
  myVote: "APPROVE" | "REJECT" | null;
  approvals: number;
  rejections: number;
  required: number;
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

export function VoteButtons({
  itemId,
  myVote,
  approvals,
  rejections,
  required,
}: VoteButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);

  async function vote(value: "APPROVE" | "REJECT") {
    setLoading(value);
    try {
      const res = await fetch(`/api/items/${itemId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Error al votar");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  const isApproved = myVote === "APPROVE";
  const isRejected = myVote === "REJECT";
  const busy = loading !== null;
  const total = approvals + rejections;
  const approvalPct = total > 0 ? Math.round((approvals / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
          {total > 0 ? (
            <>
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${approvalPct}%` }}
              />
              <div
                className="h-full bg-red-400 transition-all duration-300"
                style={{ width: `${100 - approvalPct}%` }}
              />
            </>
          ) : (
            <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-600" />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <span className="text-green-600 dark:text-green-500">{approvals} a favor</span>
          <span>
            {required} necesario{required !== 1 ? "s" : ""}
          </span>
          <span className="text-red-500 dark:text-red-400">{rejections} en contra</span>
        </div>
      </div>

      {/* Thumb buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => vote("APPROVE")}
          disabled={busy}
          aria-label="Aprobar"
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all disabled:opacity-50 ${
            isApproved
              ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/40"
              : "border-zinc-200 text-zinc-400 hover:border-green-400 hover:bg-green-50 hover:text-green-600 dark:border-zinc-600 dark:text-zinc-500 dark:hover:border-green-500 dark:hover:bg-green-900/20 dark:hover:text-green-400"
          }`}
        >
          {loading === "APPROVE" ? (
            <span className="text-xs">…</span>
          ) : (
            <ThumbUpIcon />
          )}
        </button>

        <button
          onClick={() => vote("REJECT")}
          disabled={busy}
          aria-label="Rechazar"
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all disabled:opacity-50 ${
            isRejected
              ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/40"
              : "border-zinc-200 text-zinc-400 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-zinc-600 dark:text-zinc-500 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          }`}
        >
          {loading === "REJECT" ? (
            <span className="text-xs">…</span>
          ) : (
            <ThumbDownIcon />
          )}
        </button>
      </div>

      {myVote && (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Votaste{" "}
          <span className={isApproved ? "font-medium text-green-600 dark:text-green-500" : "font-medium text-red-500 dark:text-red-400"}>
            {isApproved ? "a favor" : "en contra"}
          </span>
          {" · toca de nuevo para cambiar"}
        </p>
      )}
    </div>
  );
}
