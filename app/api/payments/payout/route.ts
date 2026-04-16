import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/payments/stripe';

// POST — request a payout (transfer to host's Stripe account or MoMo)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { amount, method, accountRef } = await req.json();

  if (!amount || amount < 1000) {
    return NextResponse.json({ error: 'Minimum payout is RWF 1,000' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripeOnboarded: true, role: true },
  });

  if (!user || !['HOST', 'BOTH', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Only hosts can request payouts' }, { status: 403 });
  }

  // Calculate available balance: sum of completed paid bookings - platform fee + tips - already-paid payouts
  const earnings = await prisma.booking.aggregate({
    where: {
      car: { hostId: userId },
      paymentStatus: 'PAID',
      status: 'COMPLETED',
    },
    _sum: { totalAmount: true, platformFee: true, tipAmount: true },
  });

  const grossEarnings =
    (earnings._sum.totalAmount || 0) -
    (earnings._sum.platformFee || 0) +
    (earnings._sum.tipAmount || 0);
  const previousPayouts = await prisma.payoutRequest.aggregate({
    where: { hostId: userId, status: { in: ['PAID', 'PROCESSING'] } },
    _sum: { amount: true },
  });
  const available = grossEarnings - (previousPayouts._sum.amount || 0);

  if (amount > available) {
    return NextResponse.json({
      error: `Insufficient balance. Available: RWF ${available.toLocaleString()}`,
    }, { status: 400 });
  }

  // For Stripe method — initiate transfer to connected account
  if (method === 'STRIPE' && user.stripeAccountId && user.stripeOnboarded) {
    try {
      await stripe.transfers.create({
        amount: Math.round(amount), // RWF has no subunits
        currency: 'rwf',
        destination: user.stripeAccountId,
        description: `Gari host payout for user ${userId}`,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Stripe transfer failed' }, { status: 500 });
    }
  }

  const payout = await prisma.payoutRequest.create({
    data: {
      hostId: userId,
      amount,
      method: method || 'MOMO',
      accountRef: accountRef || null,
      status: method === 'STRIPE' ? 'PROCESSING' : 'PENDING',
    },
  });

  return NextResponse.json(payout, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const [payouts, earnings, previousPayouts] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.booking.aggregate({
      where: { car: { hostId: userId }, paymentStatus: 'PAID', status: 'COMPLETED' },
      _sum: { totalAmount: true, platformFee: true, tipAmount: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { hostId: userId, status: { in: ['PAID', 'PROCESSING'] } },
      _sum: { amount: true },
    }),
  ]);

  const gross =
    (earnings._sum.totalAmount || 0) -
    (earnings._sum.platformFee || 0) +
    (earnings._sum.tipAmount || 0);
  const available = gross - (previousPayouts._sum.amount || 0);

  return NextResponse.json({ payouts, available, gross });
}
