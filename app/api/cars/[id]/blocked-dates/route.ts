import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/cars/[id]/blocked-dates — public, returns blocked + booked dates */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [blocked, bookings] = await Promise.all([
      prisma.blockedDate.findMany({
        where: { carId: params.id },
        orderBy: { date: 'asc' },
      }),
      prisma.booking.findMany({
        where: {
          carId: params.id,
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        },
        select: { pickupDate: true, returnDate: true, status: true },
      }),
    ]);

    return NextResponse.json({ blocked, bookings });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 });
  }
}

/** POST /api/cars/[id]/blocked-dates — host adds a blocked date */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { date, reason } = await req.json();
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

    // Check it's not already a confirmed booking date
    const dt = new Date(date);
    const overlap = await prisma.booking.count({
      where: {
        carId: params.id,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        AND: [{ pickupDate: { lte: dt } }, { returnDate: { gte: dt } }],
      },
    });
    if (overlap > 0) {
      return NextResponse.json({ error: 'Date is part of a confirmed booking' }, { status: 409 });
    }

    const blocked = await prisma.blockedDate.create({
      data: { carId: params.id, date: dt, reason: reason || null },
    });
    return NextResponse.json(blocked, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to block date' }, { status: 500 });
  }
}

/** DELETE /api/cars/[id]/blocked-dates — host removes a blocked date */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { date } = await req.json();
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

    await prisma.blockedDate.deleteMany({
      where: { carId: params.id, date: new Date(date) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to unblock date' }, { status: 500 });
  }
}
