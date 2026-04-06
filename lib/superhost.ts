// Superhost qualification thresholds
export const SUPERHOST_THRESHOLDS = {
  minRating: 4.8,
  minTrips: 10,
  minResponseRate: 90, // percent
  maxResponseHours: 4,
};

export function isEligibleSuperhost(host: {
  rating?: number;
  totalTrips?: number;
  responseRate?: number;
  avgResponseHours?: number;
  totalHostTrips?: number;
}) {
  const trips = host.totalHostTrips ?? host.totalTrips ?? 0;
  const rate = host.responseRate ?? 100;
  const hours = host.avgResponseHours ?? 2;
  const rating = host.rating ?? 0;

  return (
    rating >= SUPERHOST_THRESHOLDS.minRating &&
    trips >= SUPERHOST_THRESHOLDS.minTrips &&
    rate >= SUPERHOST_THRESHOLDS.minResponseRate &&
    hours <= SUPERHOST_THRESHOLDS.maxResponseHours
  );
}

// Calculate aggregate host rating from their cars' ratings
export async function recalcSuperhostStatus(prisma: any, hostId: string) {
  const cars = await prisma.car.findMany({
    where: { hostId },
    select: { rating: true, totalTrips: true },
  });

  if (cars.length === 0) return;

  const totalTrips = cars.reduce((s: number, c: any) => s + c.totalTrips, 0);
  const avgRating =
    cars.filter((c: any) => c.totalTrips > 0).reduce((s: number, c: any) => s + c.rating, 0) /
    Math.max(1, cars.filter((c: any) => c.totalTrips > 0).length);

  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { responseRate: true, avgResponseHours: true, superhostSince: true },
  });

  const eligible = isEligibleSuperhost({
    rating: avgRating,
    totalHostTrips: totalTrips,
    responseRate: host?.responseRate ?? 100,
    avgResponseHours: host?.avgResponseHours ?? 2,
  });

  await prisma.user.update({
    where: { id: hostId },
    data: {
      totalHostTrips: totalTrips,
      superhostSince: eligible
        ? (host?.superhostSince ?? new Date())
        : null,
    },
  });
}
