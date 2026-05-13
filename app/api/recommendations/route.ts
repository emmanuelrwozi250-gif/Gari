import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MAX_RECOMMENDATIONS = 6;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    // Also accept sessionId from cookie for anonymous users
    const sessionId = req.cookies.get('gari_sid')?.value ?? null;

    let carIds: string[] = [];

    if (userId) {
      carIds = await getPersonalisedForUser(userId);
    } else if (sessionId) {
      carIds = await getPersonalisedForSession(sessionId);
    }

    // Fallback: popular cars
    if (carIds.length < MAX_RECOMMENDATIONS) {
      const fallback = await prisma.car.findMany({
        where: {
          isAvailable: true,
          vehicleType: 'COMMERCIAL',
          complianceStatus: 'APPROVED',
          id: carIds.length > 0 ? { notIn: carIds } : undefined,
        },
        orderBy: [{ totalTrips: 'desc' }, { rating: 'desc' }],
        take: MAX_RECOMMENDATIONS - carIds.length,
        select: { id: true },
      });
      carIds = [...carIds, ...fallback.map((c) => c.id)];
    }

    if (carIds.length === 0) {
      return NextResponse.json({ cars: [] });
    }

    // Fetch full car data for the recommended IDs
    const cars = await prisma.car.findMany({
      where: { id: { in: carIds }, isAvailable: true },
      include: {
        host: { select: { name: true, avatar: true, superhostSince: true } },
      },
      take: MAX_RECOMMENDATIONS,
    });

    // Preserve the ranking order
    const ordered = carIds
      .map((id) => cars.find((c) => c.id === id))
      .filter(Boolean);

    return NextResponse.json({ cars: ordered });
  } catch {
    return NextResponse.json({ cars: [] });
  }
}

/** Returns recommended car IDs for an authenticated user based on preferences + recent events. */
async function getPersonalisedForUser(userId: string): Promise<string[]> {
  const [pref, recentEvents] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.userEvent.findMany({
      where: {
        userId,
        eventType: { in: ['car_view', 'car_click', 'booking_start'] },
        carId: { not: null },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { carId: true },
    }),
  ]);

  // Cars the user already interacted with — don't re-recommend
  const seenCarIds = Array.from(new Set(recentEvents.map((e) => e.carId!)));

  const where: Record<string, unknown> = {
    isAvailable: true,
    vehicleType: 'COMMERCIAL',
    complianceStatus: 'APPROVED',
    id: seenCarIds.length > 0 ? { notIn: seenCarIds } : undefined,
  };

  if (pref?.preferredTypes && pref.preferredTypes.length > 0) {
    where.type = { in: pref.preferredTypes };
  }
  if (pref?.preferredDistricts && pref.preferredDistricts.length > 0) {
    where.district = { in: pref.preferredDistricts };
  }

  const recommended = await prisma.car.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { totalTrips: 'desc' }, { rating: 'desc' }],
    take: MAX_RECOMMENDATIONS,
    select: { id: true },
  });

  return recommended.map((c) => c.id);
}

/** Returns recommended car IDs for an anonymous session based on recent events. */
async function getPersonalisedForSession(sessionId: string): Promise<string[]> {
  const recentEvents = await prisma.userEvent.findMany({
    where: {
      sessionId,
      eventType: { in: ['car_view', 'car_click'] },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { carType: true, district: true, carId: true },
  });

  if (recentEvents.length === 0) return [];

  const seenCarIds = Array.from(new Set(recentEvents.map((e) => e.carId).filter(Boolean))) as string[];
  const types = Array.from(new Set(recentEvents.map((e) => e.carType).filter(Boolean))) as string[];
  const districts = Array.from(new Set(recentEvents.map((e) => e.district).filter(Boolean))) as string[];

  const where: Record<string, unknown> = {
    isAvailable: true,
    vehicleType: 'COMMERCIAL',
    complianceStatus: 'APPROVED',
    id: seenCarIds.length > 0 ? { notIn: seenCarIds } : undefined,
  };
  if (types.length > 0) where.type = { in: types };
  if (districts.length > 0) where.district = { in: districts };

  const recommended = await prisma.car.findMany({
    where,
    orderBy: [{ totalTrips: 'desc' }, { rating: 'desc' }],
    take: MAX_RECOMMENDATIONS,
    select: { id: true },
  });

  return recommended.map((c) => c.id);
}
