import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { include: { host: true } },
        renter: true,
        review: true,
      },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (booking.renterId !== userId && booking.car.hostId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { status, paymentStatus, momoTransactionId } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { select: { hostId: true, make: true, model: true, year: true } },
        renter: { select: { id: true, name: true } },
      },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isHost = booking.car.hostId === userId;
    const isRenter = booking.renterId === userId;

    if (!isHost && !isRenter && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(momoTransactionId && { momoTransactionId }),
      },
    });

    // Notify renter when host changes booking status
    const notifData = {
      bookingId: booking.id,
      hostName: (session.user as any).name || 'Your host',
      renterName: booking.renter.name || 'Renter',
      carMake: booking.car.make,
      carModel: booking.car.model,
      carYear: booking.car.year,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      totalDays: booking.totalDays,
      totalAmount: booking.totalAmount,
      pickupLocation: booking.pickupLocation,
    };
    if (status === 'CONFIRMED' && isHost) {
      void notifyUser('booking.confirmed', booking.renter.id, notifData);
    } else if (status === 'CANCELLED' && isHost) {
      void notifyUser('booking.declined', booking.renter.id, notifData);
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
