import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Cron: auto-reject-expired — runs daily at 09:00 CAT
 * Auto-rejects PENDING bookings where hostResponseDeadline has passed.
 * Creates a full-refund Refund record for each.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expired = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        hostResponseDeadline: { lt: new Date() },
      },
      select: { id: true, totalAmount: true },
    });

    if (expired.length === 0) {
      return NextResponse.json({ rejected: 0, message: 'No expired bookings' });
    }

    for (const booking of expired) {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'REJECTED',
            hostRejectionReason: 'Host did not respond in time',
            cancelledAt: new Date(),
          },
        }),
        prisma.refund.create({
          data: {
            bookingId: booking.id,
            amount: booking.totalAmount,
            reason: 'Host did not respond — auto-rejected',
            initiatedBy: 'SYSTEM',
            status: 'PENDING',
          },
        }),
      ]);
    }

    return NextResponse.json({ rejected: expired.length });
  } catch (err) {
    console.error('[auto-reject-expired]', err);
    return NextResponse.json({ error: 'Failed to auto-reject bookings' }, { status: 500 });
  }
}
