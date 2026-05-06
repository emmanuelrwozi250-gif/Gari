import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Cron: expire-boosts — runs daily at 05:00 CAT
 * Finds cars whose boost has expired (featuredUntil < now)
 * and sets isFeatured = false.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Expire boosts whose featuredUntil has passed
    const result = await prisma.car.updateMany({
      where: {
        isFeatured: true,
        featuredUntil: { lt: now },
      },
      data: { isFeatured: false },
    });

    // Mark corresponding BoostSubscription records as EXPIRED
    await prisma.boostSubscription.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    return NextResponse.json({
      expiredCars: result.count,
      message: `Expired ${result.count} boost(s)`,
    });
  } catch (err) {
    console.error('[expire-boosts]', err);
    return NextResponse.json({ error: 'Failed to expire boosts' }, { status: 500 });
  }
}
