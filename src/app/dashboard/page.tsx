import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InviteUserForm } from "@/components/invite-user-form";
import type { TripSummary } from "@/types/trip";

const ROLE_LABELS = { ADMIN: "Admin", EDITOR: "Editor", VIEWER: "Invitado" } as const;
const CURRENCY_SYMBOLS: Record<string, string> = {
  CLP: "CLP", JPY: "¥", USD: "$", EUR: "€", GBP: "£", KRW: "₩", CNY: "¥", THB: "฿",
};

async function getTripSummaries(userId: string): Promise<TripSummary[]> {
  const participations = await prisma.tripParticipant.findMany({
    where: { userId },
    select: {
      role: true,
      trip: {
        select: {
          id: true,
          name: true,
          description: true,
          destination: true,
          startDate: true,
          endDate: true,
          defaultCurrency: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: true, items: true } },
        },
      },
    },
    orderBy: { trip: { createdAt: "desc" } },
  });

  return participations.map(({ role, trip }) => ({ ...trip, myRole: role }));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const trips = await getTripSummaries(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">
            Planificador de viaje
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{session.user.email}</span>
            <InviteUserForm />
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
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Mis viajes</h2>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            + Nuevo viaje
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-14 text-center">
            <p className="text-sm text-zinc-400">
              No tienes viajes todavía.{" "}
              <Link
                href="/trips/new"
                className="text-zinc-900 underline underline-offset-2"
              >
                Crea el primero
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip }: { trip: TripSummary }) {
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const start = trip.startDate ? fmt(trip.startDate) : null;
  const end = trip.endDate ? fmt(trip.endDate) : null;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-zinc-700">
          {trip.name}
        </h3>
        <span className="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">
          {ROLE_LABELS[trip.myRole]}
        </span>
      </div>

      {trip.destination && (
        <p className="text-sm text-zinc-500">📍 {trip.destination}</p>
      )}

      {(start || end) && (
        <p className="text-xs text-zinc-400">
          {start && end ? `${start} – ${end}` : (start ?? end)}
        </p>
      )}

      {trip.description && (
        <p className="line-clamp-2 text-sm text-zinc-500">{trip.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
        <span>
          {trip._count.participants} participante
          {trip._count.participants !== 1 ? "s" : ""}
        </span>
        <span>
          {trip._count.items} propuesta{trip._count.items !== 1 ? "s" : ""}
        </span>
        <span className="font-medium text-zinc-500">
          {CURRENCY_SYMBOLS[trip.defaultCurrency] ?? trip.defaultCurrency}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {trip.createdBy.image && (
          <Image
            src={trip.createdBy.image}
            alt={trip.createdBy.name ?? ""}
            width={16}
            height={16}
            className="rounded-full"
          />
        )}
        <span className="text-xs text-zinc-400">
          Creado por {trip.createdBy.name ?? "—"}
        </span>
      </div>
    </Link>
  );
}
