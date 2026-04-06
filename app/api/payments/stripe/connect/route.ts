import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/payments/stripe';

// POST — create or retrieve Stripe Connect onboarding link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeAccountId: true, stripeOnboarded: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let accountId = user.stripeAccountId;

  // Create Stripe Express account if doesn't exist
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'RW',
      email: user.email!,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: 'Car rental host on Gari',
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId },
    });
  }

  // Create onboarding link
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/host?stripe=refresh`,
    return_url: `${origin}/api/payments/stripe/connect/return?userId=${userId}`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}

// GET — check onboarding status
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripeOnboarded: true },
  });

  if (!user?.stripeAccountId) {
    return NextResponse.json({ onboarded: false, accountId: null });
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  const onboarded = account.details_submitted && account.charges_enabled;

  if (onboarded && !user.stripeOnboarded) {
    await prisma.user.update({ where: { id: userId }, data: { stripeOnboarded: true } });
  }

  return NextResponse.json({ onboarded, accountId: user.stripeAccountId });
}
