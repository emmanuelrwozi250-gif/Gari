import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateExtensionFee, RENTAL_POLICY } from '@/config/rental-policy';
import { logAndSend } from '@/lib/notifications/log';
import {
  msg_extensionConfirmed,
  msg_extensionHostNotif,
} from '@/lib/notifications/late-return-messages';
import { NotifType } from '@prisma/client';
import { addHours } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/extend
 * Renter extends an active/confirmed booking by N hours.
 * Checks for conflicts, calculates fee, saves extension record,
 * resets notification sentAt flags so reminders fire again at new time.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const hoursAdded = Number(body.hoursAdded);
  const paymentMethod = body.paymentMethod || 'MTN_MOMO';

  if (
    !hoursAdded ||
    hoursAdded < RENTAL_POLICY.EXTENSION_MIN_HOURS ||
    hoursAdded > RENTAL_POLICY.EXTENSION_MAX_HOURS
  ) {
    return NextResponse.json(
      { error: `Hours must be between ${RENTAL_POLICY.EXTENSION_MIN_HOURS} and ${RENTAL_POLICY.EXTENSION_MAX_HOURS}` },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        renter: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
        car: {
          include: {
            host: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only confirmed or active bookings can be extended' },
        { status: 400 }
      );
    }

    const newReturnDate = addHours(booking.returnDate, hoursAdded);
    const extensionFee = calculateExtensionFee(hoursAdded, booking.car.pricePerDay);

    // Check for conflicts in the extended time window
    const conflict = await prisma.booking.findFirst({
      where: {
        carId: booking.carId,
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        pickupDate: { lt: newReturnDate },
        returnDate: { gt: booking.returnDate },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Car is already booked for those extended hours' },
        { status: 409 }
      );
    }

    // Save extension + update booking in a transaction
    await prisma.$transaction([
      prisma.bookingExtension.create({
        data: {
          bookingId: booking.id,
          requestedBy: (session.user as any).id,
          hoursAdded,
          newReturnDate,
          feeCharged: extensionFee,
          paymentMethod,
          status: 'CONFIRMED',
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          returnDate: newReturnDate,
          // Store original return date only on first extension
          originalReturnDate: booking.originalReturnDate ?? booking.returnDate,
          // Reset notification flags so reminders fire again at the new time
          notif2hSentAt: null,
          notif30mSentAt: null,
          notifAtReturnSentAt: null,
          notif30mLateSentAt: null,
          notif1hLateSentAt: null,
          lateFeeAccrued: 0,
        },
      }),
    ]);

    // Send notifications (non-blocking)
    const renter = booking.renter;
    const host = booking.car.host;
    const carName = `${booking.car.make} ${booking.car.model}`;

    void Promise.allSettled([
      logAndSend({
        bookingId: booking.id,
        userId: renter.id,
        userPhone: renter.whatsappNumber ?? renter.phone ?? undefined,
        type: NotifType.EXTENSION_CONFIRMED,
        message: msg_extensionConfirmed(
          renter.name ?? 'Renter', carName, hoursAdded, newReturnDate, extensionFee
        ),
      }),
      logAndSend({
        bookingId: booking.id,
        userId: host.id,
        userPhone: host.whatsappNumber ?? host.phone ?? undefined,
        type: NotifType.EXTENSION_HOST_NOTIF,
        message: msg_extensionHostNotif(
          host.name ?? 'Host', renter.name ?? 'Renter', carName, hoursAdded, newReturnDate
        ),
      }),
    ]);

    return NextResponse.json({
      success: true,
      newReturnDate: newReturnDate.toISOString(),
      extensionFee,
      hoursAdded,
    });
  } catch (err) {
    console.error('[extend]', err);
    return NextResponse.json({ error: 'Failed to extend booking' }, { status: 500 });
  }
}
