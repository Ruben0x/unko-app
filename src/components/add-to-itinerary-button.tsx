"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toDateInput(date: Date | null | undefined): string {
  if (!date) return "";
  return date instanceof Date
    ? date.toISOString().slice(0, 10)
    : String(date).slice(0, 10);
}

export function AddToItineraryButton({
  tripId,
  itemId,
  title,
  tripStartDate,
  tripEndDate,
}: {
  tripId: string;
  itemId: string;
  title: string;
  tripStartDate?: Date | null;
  tripEndDate?: Date | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = toDateInput(tripStartDate);
  const maxDate = toDateInput(tripEndDate);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { title, itemId };
      if (date) body.activityDate = new Date(date).toISOString();
      if (time) body.activityTime = time;

      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDone(true);
        setOpen(false);
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Error al agregar al itinerario");
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="text-xs text-green-600 font-medium dark:text-green-400">
        ✓ Agregado al itinerario
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        + Itinerario
      </button>

      {open && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Fecha (opcional)
            </label>
            <input
              type="date"
              value={date}
              min={minDate || undefined}
              max={maxDate || undefined}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Hora (opcional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Agregando..." : "Agregar"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={loading}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-white disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
