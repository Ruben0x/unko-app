"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToItineraryButton({
  tripId,
  itemId,
  title,
}: {
  tripId: string;
  itemId: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, itemId }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="text-xs text-green-600 font-medium">✓ Agregado al itinerario</span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "Agregando..." : "+ Itinerario"}
    </button>
  );
}
