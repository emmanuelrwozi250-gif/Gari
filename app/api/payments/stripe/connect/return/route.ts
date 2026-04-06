import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/payments/stripe';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.redirect(new URL('/dashboard/host', req.url));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });

  if (user?.stripeAccountId) {
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    if (account.details_submitted && account.charges_enabled) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeOnboarded: true },
      });
    }
  }

  return NextResponse.redirect(new URL('/dashboard/host?stripe=success', req.url));
}
