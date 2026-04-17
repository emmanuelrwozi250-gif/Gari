import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAndSend } from '@/lib/notifications/log';
import { msg_host_onMyWay } from '@/lib/notifications/late-return-messages';
import { NotifType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/on-my-way
 * Renter signals they are on their way back.
 * Notifies host and reduces urgency of subsequent notifications.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const message: string | undefined = body.message;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        renter: { select: { id: true, name: true } },
        car: {
          include: {
            host: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
      return NextResponse.json({ error: 'Booking is not active' }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        renterOnMyWayAt: new Date(),
        renterOnMyWayMessage: message || null,
      },
    });

    // Notify host
    const host = booking.car.host;
    const carName = `${booking.car.make} ${booking.car.model}`;

    void logAndSend({
      bookingId: booking.id,
      userId: host.id,
      userPhone: host.whatsappNumber || host.phone,
      type: NotifType.HOST_LATE_WARNING,
      message: msg_host_onMyWay(host.name ?? 'Host', booking.renter.name ?? 'Renter', carName, message),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[on-my-way]', err);
    return NextResponse.json({ error: 'Failed to record on-my-way' }, { status: 500 });
  }
}
