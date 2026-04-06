import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initiateAirtelPayment } from '@/lib/payments/airtel';
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
      select: { totalAmount: true, renterId: true, paymentStatus: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
    }

    const result = await initiateAirtelPayment({
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      amount: booking.totalAmount,
      bookingId,
      description: `Gari car rental booking ${bookingId}`,
    });

    if (result.success) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
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
