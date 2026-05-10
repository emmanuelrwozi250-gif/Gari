/**
 * GET /api/payments/status?bookingId={id}
 * Polls MTN MoMo for payment status and updates the booking.
 * Called every 5s by the checkout UI until SUCCESSFUL or FAILED.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaymentStatus } from '@/lib/payments/momo';
import { notifyUser } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      renterId: true,
      paymentStatus: true,
      paymentRequestId: true,
      paymentCompletedAt: true,
      momoTransactionId: true,
      totalAmount: true,
      totalDays: true,
      pickupDate: true,
      returnDate: true,
      pickupLocation: true,
      car: { select: { hostId: true, make: true, model: true, year: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.renterId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Already paid — return immediately
  if (booking.paymentStatus === 'PAID') {
    return NextResponse.json({ status: 'SUCCESSFUL', bookingId });
  }

  // No request ID yet — payment not initiated
  if (!booking.paymentRequestId) {
    return NextResponse.json({ status: 'PENDING', bookingId });
  }

  // Dev simulation: sim- prefix means auto-approve after 2 polls
  if (booking.paymentRequestId.startsWith('sim-')) {
    const elapsed = booking.paymentRequestId
      ? Date.now() - (new Date(booking.paymentRequestId.split('-')[1] ?? '0').getTime() || 0)
      : 0;
    // In dev, auto-succeed after ~6s (2nd poll)
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        momoTransactionId: `MOMO-SIM-${Date.now()}`,
        paymentCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ status: 'SUCCESSFUL', bookingId });
  }

  // Real MoMo API status check
  try {
    const result = await getPaymentStatus(booking.paymentRequestId);

    if (result.status === 'SUCCESSFUL') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          momoTransactionId: result.financialTransactionId,
          paymentCompletedAt: new Date(),
        },
      });

      // Notify host
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
      }).catch((err) => console.error('[status] notifyUser failed:', err));

      return NextResponse.json({ status: 'SUCCESSFUL', bookingId });
    }

    if (result.status === 'FAILED') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentFailedAt: new Date(),
          paymentFailReason: result.reason ?? 'Payment declined',
          // Reset requestId so a new attempt can be initiated
          paymentRequestId: null,
        },
      });
      return NextResponse.json({
        status: 'FAILED',
        reason: result.reason ?? 'Payment was declined or cancelled',
        bookingId,
      });
    }

    // Still pending
    return NextResponse.json({ status: 'PENDING', bookingId });
  } catch (err) {
    console.error('[payments/status]', err);
    // Return PENDING on transient errors — client will retry
    return NextResponse.json({ status: 'PENDING', bookingId });
  }
}
