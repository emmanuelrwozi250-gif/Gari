import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/report-noshow
 * Host reports renter hasn't returned car after 1+ hour.
 * Only allowed after notif1hLateSentAt is set (renter was warned ≥1h).
 * Sets status → DISPUTED, lateReturnReportedAt = now.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { select: { hostId: true, make: true, model: true } },
        renter: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.car.hostId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['ACTIVE', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking is not active' }, { status: 400 });
    }

    // Only allow report-noshow after the 1h-late notification was sent
    if (!booking.notif1hLateSentAt) {
      const now = new Date();
      const minutesLate =
        (now.getTime() - booking.returnDate.getTime()) / 60000;
      const minutesUntilUnlock = 60 - Math.floor(minutesLate);
      return NextResponse.json(
        {
          error: `Report no-show unlocks after 1 hour late. Available in ${minutesUntilUnlock} minute${minutesUntilUnlock === 1 ? '' : 's'}.`,
          minutesUntilUnlock: Math.max(0, minutesUntilUnlock),
        },
        { status: 403 }
      );
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'DISPUTED',
        lateReturnReportedAt: new Date(),
      },
    });

    // Notify admin (internal notification)
    void notifyUser('dispute.opened', (session.user as any).id, {
      bookingId: booking.id,
      renterName: booking.renter.name ?? undefined,
      carMake: booking.car.make,
      carModel: booking.car.model,
    });

    return NextResponse.json({
      success: true,
      message:
        'Gari support has been notified and will contact the renter using their NIDA-verified details. We will update you within 2 hours. Emergency: +250 788 123 000',
    });
  } catch (err) {
    console.error('[report-noshow]', err);
    return NextResponse.json({ error: 'Failed to report no-show' }, { status: 500 });
  }
}
