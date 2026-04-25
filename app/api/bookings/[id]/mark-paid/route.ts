import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { renterId: true, paymentStatus: true },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.renterId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    await prisma.booking.update({
      where: { id },
      data: { paymentStatus: 'PAID' },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[mark-paid]', err);
    return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
  }
}
