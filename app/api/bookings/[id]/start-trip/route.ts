import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      include: { car: { select: { hostId: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Booking must be CONFIRMED to start trip' }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        tripStartedAt: new Date(),
        depositHeldAt: booking.depositAmount > 0 ? new Date() : undefined,
        depositStatus: booking.depositAmount > 0 ? 'HELD' : 'NOT_APPLICABLE',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[start-trip]', err);
    return NextResponse.json({ error: 'Failed to start trip' }, { status: 500 });
  }
}
