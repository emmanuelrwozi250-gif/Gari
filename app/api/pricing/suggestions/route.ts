/**
 * GET  /api/pricing/suggestions          — host gets their pending suggestions
 * POST /api/pricing/suggestions          — cron/admin creates suggestions
 * PUT  /api/pricing/suggestions/:id/apply — host applies a suggestion (their own car only)
 * PUT  /api/pricing/suggestions/:id/ignore
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const suggestions = await prisma.pricingSuggestion.findMany({
    where: {
      status: 'pending',
      car: { hostId: userId },
    },
    include: { car: { select: { make: true, model: true, year: true, pricePerDay: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(suggestions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const suggestion = await prisma.pricingSuggestion.create({ data: body });
  return NextResponse.json(suggestion, { status: 201 });
}
