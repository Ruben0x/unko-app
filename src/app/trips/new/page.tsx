"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = [
  { value: "CLP", label: "CLP — Peso Chileno" },
  { value: "JPY", label: "JPY — Yen Japonés" },
  { value: "USD", label: "USD — Dólar Americano" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Libra Esterlina" },
  { value: "KRW", label: "KRW — Won Coreano" },
  { value: "CNY", label: "CNY — Yuan Chino" },
  { value: "THB", label: "THB — Baht Tailandés" },
];

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const body: Record<string, string | undefined> = {
      name: (fd.get("name") as string).trim(),
      defaultCurrency: fd.get("defaultCurrency") as string,
    };

    const description = (fd.get("description") as string).trim();
    const destination = (fd.get("destination") as string).trim();
    const startDate = fd.get("startDate") as string;
    const endDate = fd.get("endDate") as string;

    if (description) body.description = description;
    if (destination) body.destination = destination;
    if (startDate) body.startDate = new Date(startDate).toISOString();
    if (endDate) body.endDate = new Date(endDate).toISOString();

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al crear el viaje");
        return;
      }

      router.push(`/trips/${data.id}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Mis viajes
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">Nuevo viaje</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-5"
        >
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-xs font-medium text-zinc-700">
              Nombre del viaje <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Japón 2025"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {/* Destination */}
          <div className="flex flex-col gap-1">
            <label htmlFor="destination" className="text-xs font-medium text-zinc-700">
              Destino
            </label>
            <input
              id="destination"
              name="destination"
              type="text"
              placeholder="Ej: Tokyo, Osaka, Kyoto"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-xs font-medium text-zinc-700">
                Fecha de inicio
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-xs font-medium text-zinc-700">
                Fecha de término
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1">
            <label htmlFor="defaultCurrency" className="text-xs font-medium text-zinc-700">
              Moneda principal
            </label>
            <select
              id="defaultCurrency"
              name="defaultCurrency"
              defaultValue="CLP"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-xs font-medium text-zinc-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Notas sobre el viaje (opcional)"
              className="resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear viaje"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
