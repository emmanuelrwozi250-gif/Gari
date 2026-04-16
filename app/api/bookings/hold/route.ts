import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// POST /api/bookings/hold
// Creates a 10-minute slot lock to prevent double-bookings.
// Body: { carId, pickupDate, returnDate, sessionId }
// Returns: { holdId, expiresAt } or { error } with 409
export async function POST(req: NextRequest) {
  try {
    const { carId, pickupDate, returnDate, sessionId } = await req.json();

    if (!carId || !pickupDate || !returnDate || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const now = new Date();

    if (isNaN(pickup.getTime()) || isNaN(returnD.getTime()) || pickup >= returnD) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    // 1. Purge all expired holds (housekeeping)
    await prisma.bookingHold.deleteMany({ where: { expiresAt: { lt: now } } });

    // 2. Check for overlapping confirmed/active bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        carId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        pickupDate: { lt: returnD },
        returnDate: { gt: pickup },
      },
      select: { id: true },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'These dates are already booked. Please choose different dates.' },
        { status: 409 }
      );
    }

    // 3. Check for active holds from OTHER sessions
    const competingHold = await prisma.bookingHold.findFirst({
      where: {
        carId,
        sessionId: { not: sessionId },
        expiresAt: { gt: now },
        pickupDate: { lt: returnD },
        returnDate: { gt: pickup },
      },
      select: { expiresAt: true },
    });

    if (competingHold) {
      const waitSeconds = Math.ceil((competingHold.expiresAt.getTime() - now.getTime()) / 1000);
      return NextResponse.json(
        {
          error: 'Someone else is currently booking this car. Please try again shortly.',
          retryAfterSeconds: waitSeconds,
        },
        { status: 409 }
      );
    }

    // 4. Release any existing hold this session has for this car (re-selecting dates)
    await prisma.bookingHold.deleteMany({ where: { carId, sessionId } });

    // 5. Create the hold
    const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS);
    const hold = await prisma.bookingHold.create({
      data: { carId, sessionId, pickupDate: pickup, returnDate: returnD, expiresAt },
      select: { id: true, expiresAt: true },
    });

    return NextResponse.json({ holdId: hold.id, expiresAt: hold.expiresAt });
  } catch (err) {
    console.error('[bookings/hold POST]', err);
    return NextResponse.json({ error: 'Failed to hold dates.' }, { status: 500 });
  }
}

// DELETE /api/bookings/hold
// Releases a hold when the user navigates away or cancels.
// Body: { holdId, sessionId }
export async function DELETE(req: NextRequest) {
  try {
    const { holdId, sessionId } = await req.json();
    if (!holdId || !sessionId) {
      return NextResponse.json({ error: 'Missing holdId or sessionId.' }, { status: 400 });
    }
    await prisma.bookingHold.deleteMany({ where: { id: holdId, sessionId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[bookings/hold DELETE]', err);
    return NextResponse.json({ error: 'Failed to release hold.' }, { status: 500 });
  }
}
