import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/disputes/[id]/respond
 * Renter responds to a damage dispute raised by the host.
 * Body: { accept: boolean, renterResponse?: string, responseUrls?: string[] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { accept, renterResponse, responseUrls = [] } = body;

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { booking: { select: { renterId: true, depositAmount: true } } },
    });

    if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    if (dispute.booking.renterId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (dispute.status !== 'OPEN') {
      return NextResponse.json({ error: 'Dispute is not open' }, { status: 400 });
    }

    if (accept) {
      // Renter accepts the damage claim — deposit withheld
      await prisma.$transaction([
        prisma.dispute.update({
          where: { id: params.id },
          data: {
            renterResponse: renterResponse || 'Renter accepted the claim',
            responseUrls,
            status: 'RESOLVED',
            depositDecision: 'WITHHELD',
            resolvedBy: 'RENTER_ACCEPTED',
            resolvedAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: dispute.bookingId },
          data: { depositStatus: 'WITHHELD' },
        }),
      ]);
      return NextResponse.json({ success: true, resolution: 'WITHHELD' });
    } else {
      // Renter disputes the claim — goes to admin for review
      await prisma.dispute.update({
        where: { id: params.id },
        data: {
          renterResponse: renterResponse || 'Renter disputes the damage claim',
          responseUrls,
          status: 'UNDER_REVIEW',
        },
      });
      return NextResponse.json({ success: true, resolution: 'UNDER_REVIEW' });
    }
  } catch (err) {
    console.error('[dispute-respond]', err);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
