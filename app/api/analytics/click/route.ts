import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/analytics/click
 * Body: { carId: string, event: 'view' | 'click' }
 *
 * Fire-and-forget from CarCard / car detail page.
 * 1. Increments the Car.viewCount or Car.clickCount scalar counter.
 * 2. Upserts a CarAnalytics daily row for today's date.
 *
 * No auth required — callers should rate-limit on the client side.
 */
export async function POST(req: Request) {
  try {
    const { carId, event } = await req.json();

    if (!carId || !['view', 'click'].includes(event)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isClick = event === 'click';

    // Run both operations in parallel — neither blocks the other
    await Promise.all([
      // 1. Increment lifetime counters on Car
      prisma.car.update({
        where: { id: carId },
        data: isClick
          ? { clickCount: { increment: 1 } }
          : { viewCount:  { increment: 1 } },
      }),
      // 2. Upsert daily analytics row
      prisma.carAnalytics.upsert({
        where: { carId_date: { carId, date: today } },
        update: isClick
          ? { clicks: { increment: 1 }, updatedAt: new Date() }
          : { views:  { increment: 1 }, updatedAt: new Date() },
        create: {
          carId,
          date:   today,
          clicks: isClick ? 1 : 0,
          views:  isClick ? 0 : 1,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Silently fail — analytics must never break the UI
    console.error('[analytics/click]', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
