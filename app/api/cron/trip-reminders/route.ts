/**
 * Trip reminder cron — fires notifications for trips starting or ending within 24 hours.
 *
 * Schedule via Vercel Cron (vercel.json) or any cron service:
 *   "0 7 * * *"  → runs daily at 07:00 UTC
 *
 * Secure with CRON_SECRET env var:
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret === 'placeholder') return true; // dev bypass
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Bookings starting in the next 24 hours (CONFIRMED + PAID)
    const starting = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        pickupDate: { gte: now, lte: in24h },
      },
      include: {
        car: { select: { hostId: true, make: true, model: true, year: true } },
        renter: { select: { id: true } },
      },
    });

    // Bookings ending in the next 24 hours
    const ending = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        returnDate: { gte: now, lte: in24h },
      },
      include: {
        car: { select: { hostId: true, make: true, model: true, year: true } },
        renter: { select: { id: true } },
      },
    });

    const notifications: Promise<void>[] = [];

    for (const b of starting) {
      const data = {
        bookingId: b.id,
        carMake: b.car.make,
        carModel: b.car.model,
        carYear: b.car.year,
        pickupDate: b.pickupDate,
        returnDate: b.returnDate,
        totalDays: b.totalDays,
        totalAmount: b.totalAmount,
        pickupLocation: b.pickupLocation,
      };
      // Notify both renter and host
      notifications.push(notifyUser('trip.starting', b.renter.id, data));
      notifications.push(notifyUser('trip.starting', b.car.hostId, data));
    }

    for (const b of ending) {
      const data = {
        bookingId: b.id,
        carMake: b.car.make,
        carModel: b.car.model,
        carYear: b.car.year,
        pickupDate: b.pickupDate,
        returnDate: b.returnDate,
        totalDays: b.totalDays,
        totalAmount: b.totalAmount,
        pickupLocation: b.pickupLocation,
      };
      notifications.push(notifyUser('trip.ending', b.renter.id, data));
      notifications.push(notifyUser('trip.ending', b.car.hostId, data));
    }

    await Promise.allSettled(notifications);

    return NextResponse.json({
      ok: true,
      startingReminders: starting.length,
      endingReminders: ending.length,
    });
  } catch (err) {
    console.error('[Cron] trip-reminders failed:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
