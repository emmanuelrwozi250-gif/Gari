import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Cron: process-refunds — runs daily at 06:00 CAT
 * Marks PENDING Refund records as PROCESSED if:
 *   - The linked booking's carReturnedSafelyAt was > 48h ago, OR
 *   - The booking is CANCELLED or REJECTED (refund should be immediate)
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorised calls
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const eligible = await prisma.refund.findMany({
      where: { status: 'PENDING' },
      include: {
        booking: {
          select: {
            status: true,
            carReturnedSafelyAt: true,
          },
        },
      },
    });

    const toProcess = eligible.filter(r => {
      if (['CANCELLED', 'REJECTED'].includes(r.booking.status)) return true;
      if (r.booking.carReturnedSafelyAt && r.booking.carReturnedSafelyAt < cutoff) return true;
      return false;
    });

    if (toProcess.length === 0) {
      return NextResponse.json({ processed: 0, message: 'Nothing to process' });
    }

    await prisma.refund.updateMany({
      where: { id: { in: toProcess.map(r => r.id) } },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });

    return NextResponse.json({ processed: toProcess.length });
  } catch (err) {
    console.error('[process-refunds]', err);
    return NextResponse.json({ error: 'Failed to process refunds' }, { status: 500 });
  }
}
