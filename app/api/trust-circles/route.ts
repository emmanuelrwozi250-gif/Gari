/**
 * GET  /api/trust-circles — list circles (admin) or your own membership
 * POST /api/trust-circles — create a new circle (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['sacco', 'employer', 'university', 'church']),
  payoutAccount: z.string().optional(),
});

function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role === 'ADMIN') {
    const circles = await prisma.trustCircle.findMany({
      include: { members: { include: { user: { select: { name: true, email: true, trustScore: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(circles);
  }

  const memberships = await prisma.trustCircleMember.findMany({
    where: { userId },
    include: { circle: true },
  });

  return NextResponse.json(memberships);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data = createSchema.parse(body);
  const adminId = (session.user as any).id;

  // Ensure unique referral code
  let code = genCode();
  while (await prisma.trustCircle.findUnique({ where: { referralCode: code } })) {
    code = genCode();
  }

  const circle = await prisma.trustCircle.create({
    data: { ...data, adminUserId: adminId, referralCode: code },
  });

  return NextResponse.json(circle, { status: 201 });
}
