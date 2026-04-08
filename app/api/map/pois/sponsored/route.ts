/**
 * GET /api/map/pois/sponsored?lat=&lng=&radius=
 * Returns sponsored POIs for monetization.
 * Currently returns sponsored=true POIs from the cache.
 * Future: integrate with ad platform / billing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { boundingBox } from '@/lib/rwandaCoords';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '-1.9441');
  const lng = parseFloat(searchParams.get('lng') || '30.0619');
  const radius = parseInt(searchParams.get('radius') || '500');

  try {
    const bbox = boundingBox(lat, lng, radius / 1000);

    const sponsored = await prisma.pOICache.findMany({
      where: {
        isSponsored: true,
        expiresAt: { gte: new Date() },
        lat: { gte: bbox.minLat, lte: bbox.maxLat },
        lng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      orderBy: { sponsorPriority: 'desc' },
      take: 3,
    });

    return NextResponse.json({ sponsored });
  } catch {
    return NextResponse.json({ sponsored: [] });
  }
}
