import { prisma } from "@/lib/prisma";
import { DeleteActivityButton } from "@/components/delete-activity-button";

export async function ActivityList({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const activities = await prisma.activity.findMany({
    where: { tripId },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      activityDate: true,
      activityTime: true,
      notes: true,
      createdAt: true,
      item: { select: { id: true, title: true } },
    },
    orderBy: [{ activityDate: "asc" }, { createdAt: "asc" }],
  });

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
        No hay actividades todavía. ¡Agrega la primera!
      </div>
    );
  }

  // Group by date (or "Sin fecha")
  const groups = new Map<string, typeof activities>();
  for (const act of activities) {
    const key = act.activityDate
      ? new Date(act.activityDate).toLocaleDateString("es-CL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "Sin fecha";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(act);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([dateLabel, acts]) => (
        <div key={dateLabel}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {dateLabel}
          </h3>
          <div className="flex flex-col gap-3">
            {acts.map((act) => (
              <div
                key={act.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex items-start gap-4"
              >
                {/* Time */}
                <div className="w-12 shrink-0 text-center">
                  {act.activityTime ? (
                    <span className="text-sm font-medium text-zinc-700">{act.activityTime}</span>
                  ) : (
                    <span className="text-xs text-zinc-300">—</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">{act.title}</p>
                      {act.item && (
                        <span className="text-xs text-zinc-400">
                          Desde propuesta: {act.item.title}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <DeleteActivityButton
                        tripId={tripId}
                        activityId={act.id}
                      />
                    )}
                  </div>
                  {act.description && (
                    <p className="mt-1 text-sm text-zinc-500">{act.description}</p>
                  )}
                  {act.location && (
                    <p className="mt-1 text-xs text-zinc-400">📍 {act.location}</p>
                  )}
                  {act.notes && (
                    <p className="mt-1 text-xs text-zinc-500 italic">{act.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
