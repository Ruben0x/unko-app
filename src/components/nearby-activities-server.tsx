import { prisma } from "@/lib/prisma";
import { NearbyActivities } from "@/components/nearby-activities";

export async function NearbyActivitiesServer({
  tripId,
  alwaysOpen = false,
  itemsHref,
}: {
  tripId: string;
  alwaysOpen?: boolean;
  itemsHref?: string;
}) {
  const items = await prisma.item.findMany({
    where: { tripId },
    select: {
      id: true,
      title: true,
      type: true,
      location: true,
      locationLat: true,
      locationLng: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <NearbyActivities items={items} alwaysOpen={alwaysOpen} itemsHref={itemsHref} />;
}
