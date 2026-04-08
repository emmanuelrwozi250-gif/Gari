import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyUser } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const bookingSchema = z.object({
  carId: z.string().min(1),
  pickupDate: z.string(),
  returnDate: z.string(),
  withDriver: z.boolean().default(false),
  pickupLocation: z.string().min(1),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  totalDays: z.number().min(1),
  subtotal: z.number().min(0),
  platformFee: z.number().min(0),
  driverFee: z.number().default(0),
  totalAmount: z.number().min(0),
  paymentMethod: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'CARD']),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const where: any = {};
    if (role === 'ADMIN') {
      if (status) where.status = status;
    } else {
      where.renterId = userId;
      if (status) where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        car: { include: { host: { select: { name: true, avatar: true } } } },
        renter: { select: { name: true, avatar: true, email: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    // Verify car is available
    const car = await prisma.car.findUnique({
      where: { id: data.carId },
      select: {
        isAvailable: true,
        pricePerDay: true,
        driverPricePerDay: true,
        make: true,
        model: true,
        year: true,
        hostId: true,
      },
    });
    if (!car?.isAvailable) {
      return NextResponse.json({ error: 'This car is not available' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        carId: data.carId,
        renterId: (session.user as any).id,
        pickupDate: new Date(data.pickupDate),
        returnDate: new Date(data.returnDate),
        withDriver: data.withDriver,
        pickupLocation: data.pickupLocation,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        totalDays: data.totalDays,
        subtotal: data.subtotal,
        platformFee: data.platformFee,
        driverFee: data.driverFee,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    });

    // Notify host of new booking request
    void notifyUser('booking.created', car.hostId, {
      bookingId: booking.id,
      renterName: (session.user as any).name || 'A renter',
      carMake: car.make,
      carModel: car.model,
      carYear: car.year,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      totalDays: booking.totalDays,
      totalAmount: booking.totalAmount,
      pickupLocation: booking.pickupLocation,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
