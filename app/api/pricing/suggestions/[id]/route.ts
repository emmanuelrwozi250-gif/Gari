/**
 * PUT /api/pricing/suggestions/:id
 * Host applies or ignores a pricing suggestion — explicit action required.
 * Body: { action: 'apply' | 'ignore' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json() as { action: 'apply' | 'ignore' };
  if (!['apply', 'ignore'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const suggestion = await prisma.pricingSuggestion.findUnique({
    where: { id: params.id },
    include: { car: { select: { hostId: true } } },
  });

  if (!suggestion) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (suggestion.car.hostId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (action === 'apply') {
    // Update car price for the date range — we record it but let the pricing API handle date-specific rates
    await prisma.pricingSuggestion.update({
      where: { id: params.id },
      data: { status: 'applied', appliedAt: new Date() },
    });
    // Never auto-apply without explicit host action — this is the host's explicit action
    await prisma.car.update({
      where: { id: suggestion.carId },
      data: { pricePerDay: suggestion.suggestedPrice },
    });
    return NextResponse.json({ success: true, newPrice: suggestion.suggestedPrice });
  } else {
    await prisma.pricingSuggestion.update({
      where: { id: params.id },
      data: { status: 'ignored' },
    });
    return NextResponse.json({ success: true });
  }
}
