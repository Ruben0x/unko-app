"use client";

import { useState } from "react";

type Props = {
  totalSum: number;
  avgPricePerNight: number | null;
  totalNights: number;
  participantCount: number;
  currencySymbol: string;
};

export function HotelSummaryPanel({
  totalSum,
  avgPricePerNight,
  totalNights,
  participantCount,
  currencySymbol,
}: Props) {
  const [open, setOpen] = useState(false);

  const totalPerParticipant = participantCount > 0 ? totalSum / participantCount : null;
  const totalPerParticipantPerNight =
    totalPerParticipant != null && totalNights > 0
      ? totalPerParticipant / totalNights
      : null;

  const fmt = (n: number) =>
    n.toLocaleString("es-CL", { maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm ring-1 ring-black/3 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Resumen de costos
          </span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {open ? "▲ Ocultar" : "▼ Ver resumen"}
        </span>
      </button>

      {open && (
        <>
          <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-700" />
          <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
            {avgPricePerNight != null && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Promedio / noche
                </p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {currencySymbol}{fmt(avgPricePerNight)}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Total alojamientos
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {currencySymbol}{fmt(totalSum)}
              </p>
            </div>
            {totalPerParticipant != null && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Total / persona
                </p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {currencySymbol}{fmt(totalPerParticipant)}
                </p>
              </div>
            )}
            {totalPerParticipantPerNight != null && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Total / persona / noche
                </p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {currencySymbol}{fmt(totalPerParticipantPerNight)}
                </p>
              </div>
            )}
          </div>
          <div className="px-5 pb-3">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
              * Los montos de distintas monedas se suman sin conversión.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
