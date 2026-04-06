/**
 * GET /api/map/heatmap
 * Returns weighted lat/lng points for demand heatmap
 * Derived from: completed bookings (by car location) + search patterns
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDistrictCoords } from '@/lib/rwandaCoords';

export async function GET(_req: NextRequest) {
  try {
    // Aggregate completed bookings by car
    const bookingStats = await prisma.booking.groupBy({
      by: ['carId'],
      where: { status: 'COMPLETED' },
      _count: { id: true },
    });

    if (bookingStats.length === 0) {
      return NextResponse.json({ points: [] });
    }

    // Fetch the cars referenced
    const carIds = bookingStats.map(b => b.carId);
    const cars = await prisma.car.findMany({
      where: { id: { in: carIds } },
      select: { id: true, lat: true, lng: true, district: true },
    });

    const carMap = new Map(cars.map(c => [c.id, c]));

    const points: { lat: number; lng: number; weight: number }[] = [];

    for (const stat of bookingStats) {
      const car = carMap.get(stat.carId);
      if (!car) continue;

      let pointLat = car.lat;
      let pointLng = car.lng;

      if (!pointLat || !pointLng) {
        const dc = getDistrictCoords(car.district);
        if (!dc) continue;
        pointLat = dc.lat;
        pointLng = dc.lng;
      }

      points.push({
        lat: pointLat,
        lng: pointLng,
        weight: stat._count.id,
      });
    }

    return NextResponse.json({ points }, {
      headers: { 'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800' }, // 15 min cache
    });
  } catch {
    return NextResponse.json({ points: [] });
  }
}
