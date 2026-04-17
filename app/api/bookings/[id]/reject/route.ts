import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const reason = body.reason || 'Host declined this booking request';

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { car: { select: { hostId: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Cannot reject booking in current status' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          hostId: userId,
          hostResponseAt: new Date(),
          hostRejectionReason: reason,
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      }),
      prisma.refund.create({
        data: {
          bookingId: params.id,
          amount: booking.totalAmount,
          reason: 'Host rejected booking',
          description: reason,
          initiatedBy: userId,
          status: 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reject]', err);
    return NextResponse.json({ error: 'Failed to reject booking' }, { status: 500 });
  }
}
