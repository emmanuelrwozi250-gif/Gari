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
    const body = await req.json();
    const { description, evidenceUrls = [], estimatedCost, reason = 'Vehicle damage' } = body;

    if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { car: { select: { hostId: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['ACTIVE', 'COMPLETED'].includes(booking.status)) {
      return NextResponse.json({ error: 'Can only dispute active or completed bookings' }, { status: 400 });
    }

    // Check if dispute already exists
    const existing = await prisma.dispute.findUnique({ where: { bookingId: params.id } });
    if (existing) return NextResponse.json({ error: 'Dispute already exists for this booking' }, { status: 409 });

    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          bookingId: params.id,
          raisedBy: userId,
          reason,
          description,
          evidenceUrls,
          status: 'OPEN',
          ...(estimatedCost ? { partialAmount: Number(estimatedCost) } : {}),
        },
      }),
      prisma.booking.update({
        where: { id: params.id },
        data: {
          status: 'DISPUTED',
          depositStatus: booking.depositAmount > 0 ? 'DISPUTED' : 'NOT_APPLICABLE',
          depositDisputeReason: description,
        },
      }),
    ]);

    return NextResponse.json({ success: true, disputeId: dispute.id });
  } catch (err) {
    console.error('[dispute]', err);
    return NextResponse.json({ error: 'Failed to raise dispute' }, { status: 500 });
  }
}
