"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteHotelButton({
  tripId,
  hotelId,
}: {
  tripId: string;
  hotelId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este hotel?")) return;
    setLoading(true);
    try {
      await fetch(`/api/trips/${tripId}/hotels/${hotelId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="shrink-0 text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50 transition-colors"
      aria-label="Eliminar hotel"
    >
      ✕
    </button>
  );
}
