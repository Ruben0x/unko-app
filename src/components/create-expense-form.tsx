"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_OPTIONS } from "@/lib/constants";
import { DatePicker } from "@/components/date-picker";
import { toast } from "sonner";

type Participant = { id: string; name: string };

export function CreateExpenseForm({
  tripId,
  participants,
  defaultCurrency,
}: {
  tripId: string;
  participants: Participant[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // All participants selected by default for split
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    participants.map((p) => p.id),
  );

  function openModal() {
    setSelectedParticipants(participants.map((p) => p.id));
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedParticipants.length === 0) {
      toast.error("Debes seleccionar al menos un participante");
      return;
    }

    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const body = {
      description: (fd.get("description") as string).trim(),
      amount: parseFloat(fd.get("amount") as string),
      currency: fd.get("currency") as string,
      paidByParticipantId: (fd.get("paidBy") as string) || undefined,
      expenseDate: (fd.get("expenseDate") as string) || undefined,
      participantIds: selectedParticipants,
    };

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar el gasto");
        return;
      }

      closeModal();
      router.refresh();
      toast.success("Gasto registrado");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        + Nuevo gasto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto dark:bg-zinc-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nuevo gasto</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300" aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="expense-desc" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <input
                  id="expense-desc" name="description" type="text" required
                  placeholder="Ej: Cena en Shibuya"
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="expense-amount" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="expense-amount" name="amount" type="number" min="0.01" step="0.01" required
                    placeholder="0.00"
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-zinc-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="expense-currency" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Moneda</label>
                  <select
                    id="expense-currency" name="currency" defaultValue={defaultCurrency}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-500"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="paidBy" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Pagado por</label>
                <select
                  id="paidBy" name="paidBy"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-zinc-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="expense-date" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Fecha</label>
                <DatePicker
                  id="expense-date"
                  name="expenseDate"
                  placeholder="Seleccionar fecha (opcional)"
                />
              </div>

              {/* Participants to split among */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Dividir entre <span className="text-zinc-400 dark:text-zinc-500">(división equitativa)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParticipant(p.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedParticipants.includes(p.id)
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button" onClick={closeModal} disabled={loading}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
