/**
 * GET /api/map/pois?lat=&lng=&radius=&categories=food,hotel,...
 *
 * 1. Check DB cache (POICache) — valid if not expired
 * 2. On cache miss: fetch from Overpass API, store in DB
 * 3. Return filtered + basic sorted list
 *
 * Cache TTL: 24h (POIs don't change often)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPOIsFromOverpass } from '@/lib/overpass';
import { boundingBox } from '@/lib/rwandaCoords';

const CACHE_TTL_HOURS = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '-1.9441');
  const lng = parseFloat(searchParams.get('lng') || '30.0619');
  const radius = parseInt(searchParams.get('radius') || '200');
  const catParam = searchParams.get('categories');
  const categories = catParam
    ? catParam.split(',')
    : ['food', 'hotel', 'landmark', 'religious', 'healthcare', 'transport', 'shopping', 'finance'];

  try {
    const bbox = boundingBox(lat, lng, radius / 1000);

    // Try DB cache first
    const cached = await prisma.pOICache.findMany({
      where: {
        expiresAt: { gte: new Date() },
        category: { in: categories },
        lat: { gte: bbox.minLat, lte: bbox.maxLat },
        lng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      take: 50,
    }).catch(() => []);

    if (cached.length > 0) {
      return NextResponse.json({ pois: cached, source: 'cache' }, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    // Cache miss — fetch from Overpass
    const fresh = await fetchPOIsFromOverpass(lat, lng, radius);
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000);

    // Upsert into DB cache (ignore conflicts on osmId)
    const upserted = await Promise.allSettled(
      fresh.map(poi =>
        prisma.pOICache.upsert({
          where: { osmId: poi.osmId },
          create: { ...poi, expiresAt },
          update: { name: poi.name, lat: poi.lat, lng: poi.lng, tags: poi.tags, expiresAt },
        })
      )
    );

    const stored = upserted
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
      .filter(p => categories.includes(p.category));

    return NextResponse.json({ pois: stored, source: 'fresh' }, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    });
  } catch {
    return NextResponse.json({ pois: [], source: 'error' });
  }
}
