import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/payments/stripe';
import { initiateMoMoPayment, formatMoMoPhone } from '@/lib/payments/momo';
import { initiateAirtelPayment } from '@/lib/payments/airtel';

// POST — send a tip to the host
// Body: { bookingId, amount, paymentMethod, phoneNumber? }
// Body with ?action=confirm: { bookingId, amount } — marks tip as paid (Stripe webhook / client-side confirm)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const action = req.nextUrl.searchParams.get('action');
  const body = await req.json();
  const { bookingId, amount } = body;

  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      renterId: true,
      paymentStatus: true,
      tipAmount: true,
      paymentMethod: true,
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.renterId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (booking.paymentStatus !== 'PAID') {
    return NextResponse.json({ error: 'Booking must be paid before tipping' }, { status: 400 });
  }

  // --- Confirm action: called after Stripe payment completes client-side ---
  if (action === 'confirm') {
    if (!amount || amount < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { tipAmount: amount },
    });
    return NextResponse.json({ success: true, tipAmount: updated.tipAmount });
  }

  // --- Standard tip initiation ---
  if (booking.tipAmount > 0) {
    return NextResponse.json({ error: 'You have already tipped for this booking' }, { status: 400 });
  }

  if (!amount || amount < 1000 || amount > 100000) {
    return NextResponse.json({ error: 'Tip must be between RWF 1,000 and RWF 100,000' }, { status: 400 });
  }

  const { paymentMethod, phoneNumber } = body;
  const method = paymentMethod || booking.paymentMethod;

  // --- Card (Stripe) ---
  if (method === 'CARD') {
    let intent;
    try {
      intent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // RWF has no subunits
        currency: 'rwf',
        metadata: { bookingId, type: 'tip', userId },
        automatic_payment_methods: { enabled: true },
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to create payment intent' }, { status: 500 });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { tipPaymentIntentId: intent.id },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  }

  // --- MTN MoMo ---
  if (method === 'MTN_MOMO') {
    if (!phoneNumber) return NextResponse.json({ error: 'Phone number required for MoMo' }, { status: 400 });
    const result = await initiateMoMoPayment({
      phoneNumber: formatMoMoPhone(phoneNumber),
      amount,
      bookingId,
      description: `Gari tip for booking ${bookingId.slice(0, 8)}`,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { tipAmount: amount },
    });
    return NextResponse.json({ success: true, tipAmount: amount });
  }

  // --- Airtel Money ---
  if (method === 'AIRTEL_MONEY') {
    if (!phoneNumber) return NextResponse.json({ error: 'Phone number required for Airtel' }, { status: 400 });
    const result = await initiateAirtelPayment({
      phoneNumber: formatMoMoPhone(phoneNumber), // same Rwanda number format
      amount,
      bookingId,
      description: `Gari tip for booking ${bookingId.slice(0, 8)}`,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { tipAmount: amount },
    });
    return NextResponse.json({ success: true, tipAmount: amount });
  }

  return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
}
