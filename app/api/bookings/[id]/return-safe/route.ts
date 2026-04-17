import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordLateReturn } from '@/lib/reputation';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { select: { hostId: true, make: true, model: true, year: true } },
        renter: { select: { name: true, phone: true, whatsappNumber: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Booking must be ACTIVE to mark as returned' }, { status: 400 });
    }

    const now = new Date();
    const updateBooking = prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        carReturnedSafelyAt: now,
        carReturnedSafelyBy: userId,
        completedAt: now,
        depositStatus: booking.depositAmount > 0 ? 'REFUNDED' : 'NOT_APPLICABLE',
        depositRefundedAt: booking.depositAmount > 0 ? now : undefined,
        depositRefundAmount: booking.depositAmount > 0 ? booking.depositAmount : undefined,
      },
    });

    if (booking.depositAmount > 0) {
      await prisma.$transaction([
        updateBooking,
        prisma.refund.create({
          data: {
            bookingId: params.id,
            amount: booking.depositAmount,
            reason: 'Security deposit — car returned safely',
            initiatedBy: userId,
            status: 'PENDING',
          },
        }),
      ]);
    } else {
      await updateBooking;
    }

    // Record late return against renter reputation (non-blocking)
    if ((booking as any).lateFeeAccrued > 0) {
      void recordLateReturn(booking.renterId).catch(e =>
        console.error('[return-safe] recordLateReturn failed:', e)
      );
    }

    // WhatsApp link to thank the renter
    const renterWA = (booking.renter.whatsappNumber || booking.renter.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hi ${booking.renter.name}, thanks for returning the ${booking.car.year} ${booking.car.make} ${booking.car.model} safely ✅. ` +
      (booking.depositAmount > 0
        ? `Your deposit of RWF ${booking.depositAmount.toLocaleString()} will be refunded within 48 hours. `
        : '') +
      `Please leave a review on Gari — it means a lot! 🌟`
    );
    const waLink = renterWA ? `https://wa.me/${renterWA}?text=${msg}` : null;

    return NextResponse.json({ success: true, waLink });
  } catch (err) {
    console.error('[return-safe]', err);
    return NextResponse.json({ error: 'Failed to mark trip as returned' }, { status: 500 });
  }
}
