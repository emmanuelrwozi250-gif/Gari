import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>> | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session && (session as any).user && (session as any).user.role === 'ADMIN';
}

// GET /api/admin/pricing-rules — list all rules (no cache, admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rules = await prisma.pricingRule.findMany({
    orderBy: [{ priority: 'desc' }, { type: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ rules });
}

// POST /api/admin/pricing-rules — create a new rule
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, type, multiplier, priority, startDate, endDate, dayOfWeek, minDays, description } = body;

  if (!name || !type || typeof multiplier !== 'number') {
    return NextResponse.json({ error: 'name, type, and multiplier are required' }, { status: 400 });
  }

  if (!['season', 'holiday', 'day_of_week', 'long_stay'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (multiplier < 0.5 || multiplier > 2.0) {
    return NextResponse.json({ error: 'multiplier must be between 0.5 and 2.0' }, { status: 400 });
  }

  const rule = await prisma.pricingRule.create({
    data: {
      name,
      type,
      multiplier,
      priority: priority ?? 5,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      dayOfWeek: Array.isArray(dayOfWeek) ? dayOfWeek : [],
      minDays: minDays ?? null,
      description: description ?? null,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
