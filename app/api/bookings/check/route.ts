import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  carId: z.string(),
  pickupDate: z.string(),
  returnDate: z.string(),
});

/**
 * POST /api/bookings/check
 * Check if a car is available for a given date range.
 * Used by BookingWidget before navigating to /bookings/new.
 * Returns { available: boolean, conflictingBookingId?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carId, pickupDate, returnDate } = schema.parse(body);

    const pickup = new Date(pickupDate);
    const ret = new Date(returnDate);

    if (isNaN(pickup.getTime()) || isNaN(ret.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (ret <= pickup) {
      return NextResponse.json({ error: 'Return date must be after pickup date' }, { status: 400 });
    }
    if (pickup < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: 'Pickup date cannot be in the past' }, { status: 400 });
    }

    // Check for overlapping active/confirmed/pending bookings
    const conflicting = await prisma.booking.findFirst({
      where: {
        carId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        AND: [
          { pickupDate: { lt: ret } },
          { returnDate: { gt: pickup } },
        ],
      },
      select: { id: true },
    });

    return NextResponse.json({
      available: !conflicting,
      ...(conflicting ? { conflictingBookingId: conflicting.id } : {}),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: err.errors }, { status: 400 });
    }
    console.error('[bookings/check]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
