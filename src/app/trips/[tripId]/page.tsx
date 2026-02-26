import { Suspense } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ItemList } from "@/components/item-list";
import { CreateItemForm } from "@/components/create-item-form";
import { ManageParticipantsPanel } from "@/components/manage-participants-panel";
import { EditTripForm } from "@/components/edit-trip-form";
import { ActivityList } from "@/components/activity-list";
import { CreateActivityForm } from "@/components/create-activity-form";
import { HotelList } from "@/components/hotel-list";
import { CreateHotelForm } from "@/components/create-hotel-form";
import { ExpenseList } from "@/components/expense-list";
import { CreateExpenseForm } from "@/components/create-expense-form";
import type { ParticipantSummary } from "@/types/trip";

// ─── Tab config ────────────────────────────────────────────────────────────────

type Tab = "propuestas" | "itinerario" | "hoteles" | "gastos";
const TABS: { id: Tab; label: string }[] = [
  { id: "propuestas", label: "Propuestas" },
  { id: "itinerario", label: "Itinerario" },
  { id: "hoteles", label: "Hoteles" },
  { id: "gastos", label: "Gastos" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const { tripId } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: Tab =
    TABS.find((t) => t.id === tabParam)?.id ?? "propuestas";

  // ── Fetch trip + verify membership ──────────────────────────────────────────
  const [trip, myParticipant] = await Promise.all([
    prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        name: true,
        description: true,
        destination: true,
        startDate: true,
        endDate: true,
        defaultCurrency: true,
        createdById: true,
      },
    }),
    prisma.tripParticipant.findFirst({
      where: { tripId, userId: session.user.id },
      select: { role: true },
    }),
  ]);

  if (!trip) notFound();
  if (!myParticipant) redirect("/dashboard"); // not a member

  const isAdmin = myParticipant.role === "ADMIN";
  const canEdit = myParticipant.role !== "VIEWER";

  // ── Participants ─────────────────────────────────────────────────────────────
  const rawParticipants = await prisma.tripParticipant.findMany({
    where: { tripId },
    select: {
      id: true,
      name: true,
      type: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, image: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
  const participants = rawParticipants as ParticipantSummary[];

  // Simplified participant list for expense/payment forms
  const participantOptions = rawParticipants.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="shrink-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              ← <span className="hidden sm:inline">Mis viajes</span>
            </Link>
            <span className="text-zinc-200">/</span>
            <h1 className="text-base font-semibold text-zinc-900 truncate">
              {trip.name}
            </h1>
            {trip.destination && (
              <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 sm:inline">
                📍 {trip.destination}
              </span>
            )}
            {(trip.startDate || trip.endDate) && (
              <span className="hidden shrink-0 text-xs text-zinc-400 lg:inline">
                {trip.startDate && fmt(trip.startDate)}
                {trip.startDate && trip.endDate && " – "}
                {trip.endDate && fmt(trip.endDate)}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && <EditTripForm trip={trip} />}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/api/auth/signin" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* Tab navigation — pill style */}
        <div className="mx-auto max-w-5xl px-6 pb-3">
          <nav className="flex gap-1" aria-label="Pestañas del viaje">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={`/trips/${tripId}?tab=${tab.id}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* ── Propuestas ──────────────────────────────────────────────────── */}
        {activeTab === "propuestas" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Items column */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900">
                  Propuestas del grupo
                </h2>
                <CreateItemForm tripId={tripId} />
              </div>

              <Suspense
                fallback={
                  <div className="text-sm text-zinc-400">Cargando propuestas...</div>
                }
              >
                <ItemList
                  currentUserId={session.user.id}
                  tripId={tripId}
                  isAdmin={isAdmin}
                />
              </Suspense>
            </div>

            {/* Participants sidebar */}
            <div>
              <ManageParticipantsPanel
                tripId={tripId}
                participants={participants}
                currentUserId={session.user.id}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        )}

        {/* ── Itinerario ──────────────────────────────────────────────────── */}
        {activeTab === "itinerario" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Itinerario</h2>
              {canEdit && <CreateActivityForm tripId={tripId} />}
            </div>
            <Suspense fallback={<div className="text-sm text-zinc-400">Cargando itinerario...</div>}>
              <ActivityList
                tripId={tripId}
                canEdit={canEdit}
                startDate={trip.startDate}
                endDate={trip.endDate}
              />
            </Suspense>
          </div>
        )}

        {/* ── Hoteles ─────────────────────────────────────────────────────── */}
        {activeTab === "hoteles" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Hoteles</h2>
              {canEdit && (
                <CreateHotelForm
                  tripId={tripId}
                  defaultCurrency={trip.defaultCurrency}
                />
              )}
            </div>
            <Suspense fallback={<div className="text-sm text-zinc-400">Cargando hoteles...</div>}>
              <HotelList tripId={tripId} canEdit={canEdit} />
            </Suspense>
          </div>
        )}

        {/* ── Gastos ──────────────────────────────────────────────────────── */}
        {activeTab === "gastos" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Gastos</h2>
              {canEdit && (
                <CreateExpenseForm
                  tripId={tripId}
                  participants={participantOptions}
                  defaultCurrency={trip.defaultCurrency}
                />
              )}
            </div>
            <Suspense fallback={<div className="text-sm text-zinc-400">Cargando gastos...</div>}>
              <ExpenseList
                tripId={tripId}
                participants={participantOptions}
                defaultCurrency={trip.defaultCurrency}
                canEdit={canEdit}
              />
            </Suspense>
          </div>
        )}

      </main>
    </div>
  );
}
