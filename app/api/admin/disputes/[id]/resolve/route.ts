import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/disputes/[id]/resolve
 * Admin resolves a dispute.
 * Body: { decision: 'REFUND' | 'WITHHOLD' | 'PARTIAL', partialAmount?: number, resolution?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminId = (session.user as any).id;

  try {
    const body = await req.json();
    const { decision, partialAmount, resolution } = body;

    if (!['REFUND', 'WITHHOLD', 'PARTIAL'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { booking: { select: { id: true, depositAmount: true } } },
    });

    if (!dispute) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });

    const depositDecision =
      decision === 'REFUND' ? 'REFUNDED' :
      decision === 'WITHHOLD' ? 'WITHHELD' :
      'PARTIAL';

    const depositStatus =
      decision === 'REFUND' ? 'REFUNDED' :
      decision === 'WITHHOLD' ? 'WITHHELD' :
      'PARTIALLY_HELD';

    const refundAmt =
      decision === 'REFUND' ? dispute.booking.depositAmount :
      decision === 'PARTIAL' ? (partialAmount ?? 0) :
      0;

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: params.id },
        data: {
          status: 'RESOLVED',
          depositDecision,
          partialAmount: decision === 'PARTIAL' ? partialAmount : undefined,
          resolution: resolution || `Admin decision: ${decision}`,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: dispute.bookingId },
        data: {
          status: 'COMPLETED',
          depositStatus,
          depositWithheldAmount: decision !== 'REFUND' ? (dispute.booking.depositAmount - refundAmt) : 0,
          depositRefundAmount: refundAmt,
          depositRefundedAt: refundAmt > 0 ? new Date() : undefined,
        },
      }),
      ...(refundAmt > 0
        ? [prisma.refund.create({
            data: {
              bookingId: dispute.bookingId,
              amount: refundAmt,
              reason: `Admin resolved dispute — ${decision}`,
              initiatedBy: adminId,
              status: 'PENDING',
            },
          })]
        : []),
    ]);

    return NextResponse.json({ success: true, depositDecision, refundAmt });
  } catch (err) {
    console.error('[admin-resolve]', err);
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
  }
}
