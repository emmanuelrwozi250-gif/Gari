import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReferralCode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/referral
 * Returns the signed-in user's referral code (auto-creates if missing)
 * and their referral stats: total bookings, total commission earned.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, referralEarnings: true, name: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Auto-generate code on first access
    if (!user.referralCode) {
      let code = generateReferralCode(userId);
      // Retry once on collision (extremely rare)
      const existing = await prisma.user.findUnique({ where: { referralCode: code } });
      if (existing) code = generateReferralCode(userId + Date.now());

      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { id: true, referralCode: true, referralEarnings: true, name: true },
      });
    }

    // Count referred bookings
    const referredBookings = await prisma.booking.count({
      where: { referralCode: user.referralCode! },
    });

    const pendingCommission = await prisma.booking.aggregate({
      where: {
        referralCode: user.referralCode!,
        status: { notIn: ['CANCELLED'] },
        paymentStatus: 'PAID',
      },
      _sum: { referralCommission: true },
    });

    return NextResponse.json({
      code: user.referralCode,
      totalReferrals: referredBookings,
      totalEarningsRwf: user.referralEarnings,
      pendingRwf: (pendingCommission._sum.referralCommission ?? 0) - user.referralEarnings,
      shareUrl: `${process.env.NEXTAUTH_URL || 'https://gari.rw'}/?ref=${user.referralCode}`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load referral data' }, { status: 500 });
  }
}
