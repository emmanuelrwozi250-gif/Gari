/**
 * POST /api/map/pois/interaction
 * Log a user interaction (announced, viewed, clicked, dismissed)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { poiId, type, lat, lng } = body;

    if (!poiId || !type) {
      return NextResponse.json({ error: 'poiId and type required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    await prisma.pOIInteraction.create({
      data: {
        poiId,
        type,
        ...(lat && { lat: parseFloat(lat) }),
        ...(lng && { lng: parseFloat(lng) }),
        ...(userId && { userId }),
      },
    });

    // Increment viewCount on POI
    if (type === 'viewed' || type === 'announced') {
      await prisma.pOICache.update({
        where: { id: poiId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
