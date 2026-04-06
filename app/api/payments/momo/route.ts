import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initiateMoMoPayment, formatMoMoPhone } from '@/lib/payments/momo';
import { notifyUser } from '@/lib/notifications';
import { z } from 'zod';

const schema = z.object({
  bookingId: z.string().min(1),
  phoneNumber: z.string().min(9),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { bookingId, phoneNumber } = schema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        totalAmount: true,
        renterId: true,
        status: true,
        paymentStatus: true,
        pickupDate: true,
        returnDate: true,
        totalDays: true,
        pickupLocation: true,
        car: { select: { hostId: true, make: true, model: true, year: true } },
      },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
    }

    const formattedPhone = formatMoMoPhone(phoneNumber);
    const result = await initiateMoMoPayment({
      phoneNumber: formattedPhone,
      amount: booking.totalAmount,
      bookingId,
      description: `Gari car rental booking ${bookingId}`,
    });

    if (result.success) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          momoTransactionId: result.transactionId,
        },
      });

      // Notify host that payment was received
      void notifyUser('booking.paid', booking.car.hostId, {
        bookingId,
        renterName: (session.user as any).name || 'A renter',
        carMake: booking.car.make,
        carModel: booking.car.model,
        carYear: booking.car.year,
        pickupDate: booking.pickupDate,
        returnDate: booking.returnDate,
        totalDays: booking.totalDays,
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
      });

      return NextResponse.json({ success: true, transactionId: result.transactionId });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
