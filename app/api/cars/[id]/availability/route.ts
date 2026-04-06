import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cars/[id]/availability — public, returns blocked date ranges
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const blocked = await prisma.carAvailability.findMany({
      where: { carId: params.id, endDate: { gte: new Date() } },
      select: { id: true, startDate: true, endDate: true, reason: true },
      orderBy: { startDate: 'asc' },
    });

    // Also include dates from confirmed/active bookings
    const bookings = await prisma.booking.findMany({
      where: {
        carId: params.id,
        status: { in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
        returnDate: { gte: new Date() },
      },
      select: { pickupDate: true, returnDate: true },
    });

    return NextResponse.json({ blocked, bookings });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

// POST /api/cars/[id]/availability — host only, block a date range
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  if (car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { startDate, endDate, reason } = await req.json();
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
  }

  const availability = await prisma.carAvailability.create({
    data: {
      carId: params.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
    },
  });

  return NextResponse.json(availability, { status: 201 });
}

// DELETE /api/cars/[id]/availability?blockId=xxx — host only, remove a block
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const blockId = req.nextUrl.searchParams.get('blockId');
  if (!blockId) return NextResponse.json({ error: 'blockId required' }, { status: 400 });

  const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
  if (!car || car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.carAvailability.delete({ where: { id: blockId } });
  return NextResponse.json({ success: true });
}
