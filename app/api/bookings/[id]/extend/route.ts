import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateExtensionFee, RENTAL_POLICY } from '@/config/rental-policy';
import { calculateVAT } from '@/config/vat';
import { logAndSend } from '@/lib/notifications/log';
import {
  msg_extensionConfirmed,
  msg_extensionHostNotif,
} from '@/lib/notifications/late-return-messages';
import { NotifType } from '@prisma/client';
import { addHours, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/extend
 * Renter extends an active/confirmed booking by N days (or hours).
 * Checks for conflicts, calculates fee + 18% VAT, saves extension record,
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
  const paymentMethod = body.paymentMethod || 'MTN_MOMO';

  // Accept either daysAdded (preferred) or hoursAdded (legacy)
  const daysAdded = Number(body.daysAdded ?? 0);
  const hoursAdded = daysAdded > 0
    ? daysAdded * 24
    : Number(body.hoursAdded ?? 0);

  if (
    !hoursAdded ||
    hoursAdded < RENTAL_POLICY.EXTENSION_MIN_HOURS ||
    hoursAdded > RENTAL_POLICY.EXTENSION_MAX_HOURS
  ) {
    const minDays = RENTAL_POLICY.EXTENSION_MIN_HOURS / 24;
    const maxDays = RENTAL_POLICY.EXTENSION_MAX_HOURS / 24;
    return NextResponse.json(
      { error: `Extension must be between ${minDays} and ${maxDays} days` },
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

    const newReturnDate = daysAdded > 0
      ? addDays(booking.returnDate, daysAdded)
      : addHours(booking.returnDate, hoursAdded);

    const extensionFee = calculateExtensionFee(hoursAdded, booking.car.pricePerDay);
    const vatAmount = calculateVAT(extensionFee);
    const totalCharged = extensionFee + vatAmount;

    // Check for conflicts in the extended window
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
        { error: 'Car is already booked for those dates — try a shorter extension' },
        { status: 409 }
      );
    }

    // Save extension + update booking atomically
    await prisma.$transaction([
      prisma.bookingExtension.create({
        data: {
          bookingId: booking.id,
          requestedBy: (session.user as any).id,
          hoursAdded,
          newReturnDate,
          feeCharged: extensionFee,
          vatAmount,
          paymentMethod,
          status: 'CONFIRMED',
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          returnDate: newReturnDate,
          originalReturnDate: booking.originalReturnDate ?? booking.returnDate,
          // Reset notification flags so reminders fire again at the new return time
          notif2hSentAt: null,
          notif30mSentAt: null,
          notifAtReturnSentAt: null,
          notif30mLateSentAt: null,
          notif1hLateSentAt: null,
          lateFeeAccrued: 0,
        },
      }),
    ]);

    // Notifications (non-blocking)
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
          renter.name ?? 'Renter', carName, hoursAdded, newReturnDate, totalCharged
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
      vatAmount,
      totalCharged,
      daysAdded: daysAdded || Math.round(hoursAdded / 24),
    });
  } catch (err) {
    console.error('[extend]', err);
    return NextResponse.json({ error: 'Failed to extend booking' }, { status: 500 });
  }
}
