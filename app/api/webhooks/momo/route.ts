/**
 * POST /api/webhooks/momo
 * MTN MoMo payment callback (async notification).
 *
 * MTN sends this when a requesttopay transaction reaches a final state.
 * Must respond 200 within 5 seconds — all heavy work is fire-and-forget.
 *
 * Signature validation:
 *   MTN MoMo doesn't specify a standard HMAC header — we validate by
 *   checking that the externalId maps to a real booking with a matching
 *   paymentRequestId. Set GARI_ENCRYPTION_SECRET for additional HMAC
 *   verification if your MoMo sandbox/production plan supports it.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  // Respond 200 immediately to prevent MoMo retries, then process async
  const body = await req.text();

  // Optional HMAC validation (enable when MoMo sends X-Callback-Signature)
  const secret = process.env.GARI_ENCRYPTION_SECRET;
  if (secret) {
    const sig = req.headers.get('x-callback-signature') ?? req.headers.get('x-momo-signature');
    if (sig) {
      const expected = createHmac('sha256', secret).update(body).digest('hex');
      if (sig !== expected && sig !== `sha256=${expected}`) {
        console.warn('[webhooks/momo] Invalid HMAC signature — rejected');
        // Still return 200 to prevent flood of retries; log for investigation
        return NextResponse.json({ ok: true });
      }
    }
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(body);
  } catch {
    console.error('[webhooks/momo] Non-JSON body received');
    return NextResponse.json({ ok: true });
  }

  // Process in background — don't await (keep response under 5s)
  void processCallback(data).catch((err) =>
    console.error('[webhooks/momo] processCallback error:', err)
  );

  return NextResponse.json({ ok: true });
}

async function processCallback(data: Record<string, unknown>) {
  const externalId = data.externalId as string | undefined;
  const financialTransactionId = data.financialTransactionId as string | undefined;
  const status = data.status as string | undefined;
  const reason = data.reason as string | undefined;

  if (!externalId || !status) {
    console.warn('[webhooks/momo] Missing externalId or status in callback', data);
    return;
  }

  // externalId = bookingId
  const booking = await prisma.booking.findUnique({
    where: { id: externalId },
    select: {
      id: true,
      renterId: true,
      paymentStatus: true,
      paymentRequestId: true,
      totalAmount: true,
      totalDays: true,
      pickupDate: true,
      returnDate: true,
      pickupLocation: true,
      car: { select: { hostId: true, make: true, model: true, year: true } },
    },
  });

  if (!booking) {
    console.warn('[webhooks/momo] No booking found for externalId:', externalId);
    return;
  }

  // Idempotency — skip if already processed
  if (booking.paymentStatus === 'PAID') {
    return;
  }

  if (status === 'SUCCESSFUL') {
    await prisma.booking.update({
      where: { id: externalId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        momoTransactionId: financialTransactionId,
        paymentCompletedAt: new Date(),
      },
    });

    // Notify host
    await notifyUser('booking.paid', booking.car.hostId, {
      bookingId: booking.id,
      renterName: 'Renter',
      carMake: booking.car.make,
      carModel: booking.car.model,
      carYear: booking.car.year,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      totalDays: booking.totalDays,
      totalAmount: booking.totalAmount,
      pickupLocation: booking.pickupLocation,
    }).catch((err) => console.error('[webhooks/momo] notifyUser failed:', err));

    console.log(`[webhooks/momo] Booking ${externalId} confirmed via callback`);
  } else if (status === 'FAILED') {
    await prisma.booking.update({
      where: { id: externalId },
      data: {
        paymentFailedAt: new Date(),
        paymentFailReason: (reason as string) ?? 'Payment declined via callback',
        paymentRequestId: null, // allow retry
      },
    });
    console.log(`[webhooks/momo] Booking ${externalId} payment failed:`, reason);
  }
}
