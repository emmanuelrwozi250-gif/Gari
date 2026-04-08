/**
 * POST /api/map/routing
 * Body: { origin: {lat, lng}, destination: {lat, lng} }
 *
 * Uses OSRM (free) for routing.
 * Enhances result by checking active MapReports along the route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { haversineKm } from '@/lib/rwandaCoords';

const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const INCIDENT_WARN_RADIUS_KM = 0.5; // warn if incident within 500m of route

export async function POST(req: NextRequest) {
  try {
    const { origin, destination } = await req.json();

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json({ error: 'origin and destination required' }, { status: 400 });
    }

    // OSRM uses lng,lat order
    const osrmUrl = `${OSRM_BASE}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const osrmRes = await fetch(osrmUrl, { next: { revalidate: 0 } });

    if (!osrmRes.ok) {
      return NextResponse.json({ error: 'Routing service unavailable' }, { status: 503 });
    }

    const osrmData = await osrmRes.json();

    if (!osrmData.routes?.[0]) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    const route = osrmData.routes[0];
    const routeCoords: [number, number][] = route.geometry.coordinates; // [lng, lat]

    // Get active reports in bounding box around the route
    const lats = routeCoords.map(c => c[1]);
    const lngs = routeCoords.map(c => c[0]);
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;
    const minLng = Math.min(...lngs) - 0.01;
    const maxLng = Math.max(...lngs) + 0.01;

    const activeReports = await prisma.mapReport.findMany({
      where: {
        expiresAt: { gte: new Date() },
        lat: { gte: minLat, lte: maxLat },
        lng: { gte: minLng, lte: maxLng },
      },
      select: { id: true, type: true, lat: true, lng: true, message: true },
    }).catch(() => []);

    // Check which reports are actually close to the route
    const warnings: { type: string; message: string; lat: number; lng: number }[] = [];

    for (const report of activeReports) {
      // Check if report is within INCIDENT_WARN_RADIUS_KM of any route coordinate
      const isNearRoute = routeCoords.some(([rLng, rLat]) =>
        haversineKm(rLat, rLng, report.lat, report.lng) < INCIDENT_WARN_RADIUS_KM
      );

      if (isNearRoute) {
        const labels: Record<string, string> = {
          TRAFFIC: 'Heavy traffic',
          ACCIDENT: 'Accident reported',
          POLICE: 'Police checkpoint',
          ROADBLOCK: 'Road blocked',
          FLOOD: 'Flooding on road',
          POTHOLE: 'Road hazard',
        };
        warnings.push({
          type: report.type,
          message: labels[report.type] || report.type,
          lat: report.lat,
          lng: report.lng,
        });
      }
    }

    const steps = (route.legs[0]?.steps || [])
      .filter((s: any) => s.maneuver?.type !== 'depart' || s.name)
      .map((s: any) => {
        const type = s.maneuver?.type || '';
        const mod = s.maneuver?.modifier || '';
        const name = s.name || 'the road';
        let instruction = '';
        if (type === 'depart') instruction = `Head ${mod} on ${name}`;
        else if (type === 'arrive') instruction = 'Arrive at destination';
        else if (type === 'turn') instruction = `Turn ${mod} onto ${name}`;
        else if (type === 'roundabout' || type === 'rotary') instruction = `Take the roundabout onto ${name}`;
        else if (type === 'continue' || type === 'new name') instruction = `Continue on ${name}`;
        else if (type === 'merge') instruction = `Merge onto ${name}`;
        else instruction = `${type} ${mod} ${name}`.trim();
        return { instruction, distance: Math.round(s.distance), duration: Math.round(s.duration) };
      });

    return NextResponse.json({
      route: route.geometry,
      distance: route.distance,
      duration: route.duration,
      distanceKm: (route.distance / 1000).toFixed(1),
      durationMin: Math.ceil(route.duration / 60),
      warnings,
      steps,
    });
  } catch (err: any) {
    console.error('[routing]', err);
    return NextResponse.json({ error: 'Routing failed' }, { status: 500 });
  }
}
