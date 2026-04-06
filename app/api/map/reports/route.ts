/**
 * GET  /api/map/reports — active reports within radius
 * POST /api/map/reports — submit a new road report
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { boundingBox } from '@/lib/rwandaCoords';

const EXPIRY_HOURS: Record<string, number> = {
  TRAFFIC: 2,
  ACCIDENT: 4,
  POLICE: 2,
  ROADBLOCK: 6,
  FLOOD: 12,
  POTHOLE: 48,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '-1.9441');
  const lng = parseFloat(searchParams.get('lng') || '30.0619');
  const radius = parseFloat(searchParams.get('radius') || '20');

  try {
    const bbox = boundingBox(lat, lng, radius);
    const reports = await prisma.mapReport.findMany({
      where: {
        expiresAt: { gte: new Date() },
        lat: { gte: bbox.minLat, lte: bbox.maxLat },
        lng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      select: {
        id: true,
        type: true,
        lat: true,
        lng: true,
        message: true,
        upvotes: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, lat, lng, message } = body;

    if (!type || !lat || !lng) {
      return NextResponse.json({ error: 'type, lat, lng required' }, { status: 400 });
    }

    const validTypes = ['TRAFFIC', 'ACCIDENT', 'POLICE', 'ROADBLOCK', 'FLOOD', 'POTHOLE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const expiryHours = EXPIRY_HOURS[type] ?? 4;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const report = await prisma.mapReport.create({
      data: {
        type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        message: message?.slice(0, 200),
        expiresAt,
        ...(userId && { userId }),
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/map/reports — upvote a report
export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updated = await prisma.mapReport.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    return NextResponse.json({ upvotes: updated.upvotes });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
