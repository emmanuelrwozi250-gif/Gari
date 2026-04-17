import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateLateFee, calculateExtensionFee } from '@/config/rental-policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]/status
 * Lightweight polling endpoint for the active trip page.
 * Returns current returnDate, lateFeeAccrued, status, and extension options.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        returnDate: true,
        pickupDate: true,
        lateFeeAccrued: true,
        lateFeePerHour: true,
        gracePeriodMinutes: true,
        notif1hLateSentAt: true,
        lateReturnReportedAt: true,
        renterOnMyWayAt: true,
        renterId: true,
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            pricePerDay: true,
            hostId: true,
            host: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const isRenter = booking.renterId === userId;
    const isHost = booking.car.hostId === userId;
    if (!isRenter && !isHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const minutesLate = Math.max(
      0,
      (now.getTime() - booking.returnDate.getTime()) / 60000
    );
    const currentLateFee = calculateLateFee(minutesLate, booking.car.pricePerDay);

    // Extension fee options
    const extensionOptions = [1, 2, 4, 24].map(h => ({
      hours: h,
      fee: calculateExtensionFee(h, booking.car.pricePerDay),
    }));

    // Minutes until host can report no-show (1h past returnDate)
    const minutesPastReturn =
      (now.getTime() - booking.returnDate.getTime()) / 60000;
    const minutesUntilNoShowUnlock = Math.max(0, 60 - minutesPastReturn);

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      returnDate: booking.returnDate.toISOString(),
      pickupDate: booking.pickupDate.toISOString(),
      lateFeeAccrued: currentLateFee,
      isLate: minutesLate > booking.gracePeriodMinutes,
      minutesLate: Math.round(minutesLate),
      noShowUnlocked: !!booking.notif1hLateSentAt,
      minutesUntilNoShowUnlock: Math.round(minutesUntilNoShowUnlock),
      renterOnMyWay: !!booking.renterOnMyWayAt,
      extensionOptions,
      host: isRenter
        ? {
            name: booking.car.host.name,
            phone: booking.car.host.whatsappNumber || booking.car.host.phone,
          }
        : undefined,
      car: `${booking.car.year} ${booking.car.make} ${booking.car.model}`,
    });
  } catch (err) {
    console.error('[booking-status]', err);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
