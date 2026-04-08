/**
 * GET  /api/trust-circles/:id/members — list members (circle admin or ADMIN)
 * PUT  /api/trust-circles/:id/members — approve/suspend a member (circle admin or ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const circle = await prisma.trustCircle.findUnique({ where: { id: params.id } });
  if (!circle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (circle.adminUserId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const members = await prisma.trustCircleMember.findMany({
    where: { circleId: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          trustScore: true, totalHostTrips: true, nidaVerified: true,
          bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return NextResponse.json(members);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const circle = await prisma.trustCircle.findUnique({ where: { id: params.id } });
  if (!circle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (circle.adminUserId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { memberId, status } = await req.json() as { memberId: string; status: string };

  const member = await prisma.trustCircleMember.update({
    where: { id: memberId },
    data: { status },
  });

  // If verified, set communityVerified on user and recalc trust score
  if (status === 'verified') {
    await prisma.user.update({
      where: { id: member.userId },
      data: { communityVerified: true, trustCircleId: params.id },
    });
  } else if (status === 'suspended') {
    await prisma.user.update({
      where: { id: member.userId },
      data: { communityVerified: false, trustCircleId: null },
    });
  }

  return NextResponse.json({ success: true });
}
