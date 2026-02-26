import { prisma } from "@/lib/prisma";
import { DeleteHotelButton } from "@/components/delete-hotel-button";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { Currency } from "@/lib/constants";

export async function HotelList({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const hotels = await prisma.hotel.findMany({
    where: { tripId },
    select: {
      id: true,
      name: true,
      link: true,
      checkInDate: true,
      checkOutDate: true,
      pricePerNight: true,
      totalPrice: true,
      numberOfNights: true,
      currency: true,
      notes: true,
    },
    orderBy: { checkInDate: "asc" },
  });

  if (hotels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
        No hay hoteles todavía. ¡Agrega el primero!
      </div>
    );
  }

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-3">
      {hotels.map((hotel) => {
        const symbol = CURRENCY_SYMBOLS[hotel.currency as Currency] ?? hotel.currency;
        return (
          <div
            key={hotel.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {hotel.link ? (
                    <a
                      href={hotel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-zinc-900 hover:underline"
                    >
                      {hotel.name}
                    </a>
                  ) : (
                    <p className="font-semibold text-zinc-900">{hotel.name}</p>
                  )}
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                    {hotel.numberOfNights} noche{hotel.numberOfNights !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  {fmtDate(hotel.checkInDate)} → {fmtDate(hotel.checkOutDate)}
                </p>

                {(hotel.pricePerNight != null || hotel.totalPrice != null) && (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {hotel.pricePerNight != null && (
                      <span className="text-zinc-600">
                        {symbol}{hotel.pricePerNight.toLocaleString("es-CL")} / noche
                      </span>
                    )}
                    {hotel.totalPrice != null && (
                      <span className="font-medium text-zinc-900">
                        Total: {symbol}{hotel.totalPrice.toLocaleString("es-CL")} {hotel.currency}
                      </span>
                    )}
                  </div>
                )}

                {hotel.notes && (
                  <p className="mt-2 text-xs text-zinc-400 italic">{hotel.notes}</p>
                )}
              </div>

              {canEdit && (
                <DeleteHotelButton tripId={tripId} hotelId={hotel.id} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
