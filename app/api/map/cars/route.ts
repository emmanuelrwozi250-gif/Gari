/**
 * GET /api/map/cars
 * Query params: lat, lng, radius (km, default 15), type?, maxPrice?
 * Returns available cars with their locations (uses district coords as fallback if no lat/lng)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { boundingBox, haversineKm, getDistrictCoords } from '@/lib/rwandaCoords';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '-1.9441');
  const lng = parseFloat(searchParams.get('lng') || '30.0619');
  const radius = parseFloat(searchParams.get('radius') || '15');
  const type = searchParams.get('type') as any;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  try {
    const bbox = boundingBox(lat, lng, radius);

    // First, fetch cars with explicit lat/lng within bounding box
    const cars = await prisma.car.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        ...(type && { type }),
        ...(maxPrice && { pricePerDay: { lte: maxPrice } }),
      },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        type: true,
        pricePerDay: true,
        photos: true,
        district: true,
        lat: true,
        lng: true,
        rating: true,
        totalTrips: true,
        instantBooking: true,
        host: { select: { name: true, avatar: true } },
      },
      take: 100,
    });

    // Resolve coordinates: use car's lat/lng if set, else use district center
    const withCoords = cars
      .map(car => {
        let carLat = car.lat;
        let carLng = car.lng;
        if (!carLat || !carLng) {
          const fallback = getDistrictCoords(car.district);
          if (!fallback) return null;
          // Add a small random jitter so cars in same district don't stack exactly
          carLat = fallback.lat + (Math.random() - 0.5) * 0.03;
          carLng = fallback.lng + (Math.random() - 0.5) * 0.03;
        }
        return { ...car, lat: carLat, lng: carLng };
      })
      .filter(Boolean)
      .filter(car => {
        // Filter by bounding box
        return car!.lat >= bbox.minLat && car!.lat <= bbox.maxLat &&
               car!.lng >= bbox.minLng && car!.lng <= bbox.maxLng;
      })
      .sort((a, b) => haversineKm(lat, lng, a!.lat, a!.lng) - haversineKm(lat, lng, b!.lat, b!.lng))
      .slice(0, 50);

    return NextResponse.json({ cars: withCoords }, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ cars: [] });
  }
}
