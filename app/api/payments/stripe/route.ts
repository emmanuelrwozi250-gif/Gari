import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPaymentIntent } from '@/lib/payments/stripe';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookingId } = await req.json();
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

    const intent = await createPaymentIntent(booking.totalAmount, bookingId);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { stripePaymentIntentId: intent.id },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
