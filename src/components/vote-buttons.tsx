"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VoteButtonsProps {
  itemId: string;
  myVote: "APPROVE" | "REJECT" | null;
  approvals: number;
  rejections: number;
  required: number;
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
  const [error, setError] = useState<string | null>(null);

  async function vote(value: "APPROVE" | "REJECT") {
    setLoading(value);
    setError(null);

    try {
      const res = await fetch(`/api/items/${itemId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al votar");
        return;
      }

      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  const isApproved = myVote === "APPROVE";
  const isRejected = myVote === "REJECT";
  const busy = loading !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => vote("APPROVE")}
          disabled={busy}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            isApproved
              ? "bg-green-600 text-white"
              : "border border-green-300 text-green-700 hover:bg-green-50"
          }`}
        >
          {loading === "APPROVE"
            ? "…"
            : `✓ Aprobar${approvals > 0 ? ` (${approvals})` : ""}`}
        </button>

        <button
          onClick={() => vote("REJECT")}
          disabled={busy}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            isRejected
              ? "bg-red-600 text-white"
              : "border border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          {loading === "REJECT"
            ? "…"
            : `✗ Rechazar${rejections > 0 ? ` (${rejections})` : ""}`}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Se necesitan {required} voto{required !== 1 ? "s" : ""} para decidir
        {myVote && (
          <span className="ml-1">
            · Tu voto:{" "}
            <span
              className={
                isApproved ? "font-medium text-green-600" : "font-medium text-red-600"
              }
            >
              {isApproved ? "aprobación" : "rechazo"}
            </span>
          </span>
        )}
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
