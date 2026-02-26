"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateActivityForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setError(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const body: Record<string, string | undefined> = {
      title: (fd.get("title") as string).trim(),
    };

    const description = (fd.get("description") as string).trim();
    const location = (fd.get("location") as string).trim();
    const activityDate = fd.get("activityDate") as string;
    const activityTime = fd.get("activityTime") as string;
    const notes = (fd.get("notes") as string).trim();

    if (description) body.description = description;
    if (location) body.location = location;
    if (activityDate) body.activityDate = activityDate;
    if (activityTime) body.activityTime = activityTime;
    if (notes) body.notes = notes;

    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al crear la actividad");
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        + Nueva actividad
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Nueva actividad</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600" aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="title" className="text-xs font-medium text-zinc-700">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="title" name="title" type="text" required
                  placeholder="Ej: Visita al Templo Sensoji"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-xs font-medium text-zinc-700">Descripción</label>
                <textarea
                  id="description" name="description" rows={2}
                  placeholder="Descripción breve (opcional)"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="location" className="text-xs font-medium text-zinc-700">Ubicación</label>
                <input
                  id="location" name="location" type="text"
                  placeholder="Ej: Asakusa, Tokyo"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="activityDate" className="text-xs font-medium text-zinc-700">Fecha</label>
                  <input
                    id="activityDate" name="activityDate" type="date"
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="activityTime" className="text-xs font-medium text-zinc-700">Hora</label>
                  <input
                    id="activityTime" name="activityTime" type="time"
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="notes" className="text-xs font-medium text-zinc-700">Notas</label>
                <textarea
                  id="notes" name="notes" rows={2}
                  placeholder="Notas adicionales (opcional)"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button" onClick={closeModal} disabled={loading}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
