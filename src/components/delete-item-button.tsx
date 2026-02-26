"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta propuesta? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-full px-2 py-0.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
      aria-label="Eliminar ítem"
    >
      {loading ? "..." : "Eliminar"}
    </button>
  );
}
