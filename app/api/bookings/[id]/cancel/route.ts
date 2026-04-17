import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CANCELLATION_POLICY } from '@/config/cancellation';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Cancelled by user';

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { car: { select: { hostId: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const isHost = booking.car.hostId === userId;
    const isRenter = booking.renterId === userId;
    const isAdmin = (session.user as any).role === 'ADMIN';

    if (!isHost && !isRenter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot cancel booking in current status' }, { status: 400 });
    }

    // Determine refund amount based on cancellation policy
    let refundPct = 0;
    if (isHost) {
      // Host cancels → full refund to renter
      refundPct = CANCELLATION_POLICY.HOST_CANCEL_RENTER_REFUND;
    } else {
      // Renter cancels — check free window
      const bookingAgeHours =
        (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);
      if (bookingAgeHours <= CANCELLATION_POLICY.RENTER_FREE_WINDOW_HOURS) {
        refundPct = 100;
      } else {
        refundPct = CANCELLATION_POLICY.RENTER_PARTIAL_REFUND_PERCENT;
      }
    }

    const refundAmount = Math.round((booking.totalAmount * refundPct) / 100);

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          refundAmount,
          ...(booking.depositAmount > 0
            ? {
                depositStatus: 'REFUNDED',
                depositRefundAmount: booking.depositAmount,
                depositRefundedAt: new Date(),
              }
            : {}),
        },
      }),
      ...(refundAmount > 0
        ? [
            prisma.refund.create({
              data: {
                bookingId: params.id,
                amount: refundAmount,
                reason: isHost ? 'Host cancelled booking' : 'Renter cancelled booking',
                description: reason,
                initiatedBy: userId,
                status: 'PENDING',
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true, refundAmount, refundPct });
  } catch (err) {
    console.error('[cancel]', err);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
