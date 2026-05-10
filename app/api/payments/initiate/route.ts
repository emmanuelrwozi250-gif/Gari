/**
 * POST /api/payments/initiate
 * Triggers MTN MoMo requesttopay for a booking.
 * Returns { requestId } — client polls /api/payments/status until SUCCESSFUL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requestPayment, initiateMoMoPayment, formatMoMoPhone } from '@/lib/payments/momo';
import { z } from 'zod';

const schema = z.object({
  bookingId: z.string().min(1),
  phoneNumber: z.string().min(9),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, phoneNumber } = schema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        renterId: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        paymentRequestId: true,
        car: { select: { make: true, model: true, year: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
    }

    // If a pending request already exists, return it (idempotent)
    if (booking.paymentRequestId) {
      return NextResponse.json({ requestId: booking.paymentRequestId, bookingId });
    }

    const formattedPhone = formatMoMoPhone(phoneNumber);
    const description = `Gari rental: ${booking.car.year} ${booking.car.make} ${booking.car.model}`;

    let requestId: string;

    if (process.env.MTN_MOMO_SUBSCRIPTION_KEY) {
      // Real MoMo API
      const result = await requestPayment({
        phoneNumber: formattedPhone,
        amount: booking.totalAmount,
        bookingId,
        description,
      });
      requestId = result.requestId;
    } else {
      // Dev simulation — generate a fake requestId
      const sim = await initiateMoMoPayment({
        phoneNumber: formattedPhone,
        amount: booking.totalAmount,
        bookingId,
        description,
      });
      if (!sim.success || !sim.requestId) {
        return NextResponse.json({ error: sim.error ?? 'Payment initiation failed' }, { status: 500 });
      }
      requestId = sim.requestId;
    }

    // Persist requestId and timestamp
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentRequestId: requestId,
        paymentInitiatedAt: new Date(),
      },
    });

    return NextResponse.json({ requestId, bookingId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[payments/initiate]', err);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
