/**
 * POST /api/trust-circles/join
 * Join a trust circle via referral code.
 * Status starts as "pending" until circle admin approves.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({ referralCode: z.string().length(6) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { referralCode } = schema.parse(body);
  const userId = (session.user as any).id;

  const circle = await prisma.trustCircle.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
  if (!circle) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });

  // Check already a member
  const existing = await prisma.trustCircleMember.findUnique({
    where: { circleId_userId: { circleId: circle.id, userId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Already a member of this circle', status: existing.status });
  }

  const member = await prisma.trustCircleMember.create({
    data: { circleId: circle.id, userId, status: 'pending' },
  });

  return NextResponse.json({ success: true, circleName: circle.name, status: member.status });
}
