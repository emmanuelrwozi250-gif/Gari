/**
 * Community Trust Circles — SACCO Verification
 *
 * GET  /api/user/trust         → fetch current user's trust profile
 * POST /api/user/trust         → submit SACCO membership for verification
 * PUT  /api/user/trust/verify  → admin approves/rejects a SACCO submission
 *
 * Trust Score (0–100) components:
 *   - Email verified:       +10
 *   - Phone verified:       +10
 *   - NIDA verified:        +20
 *   - License verified:     +15
 *   - SACCO verified:       +20
 *   - Superhost status:     +15
 *   - Completed trips ≥5:  +10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitSchema = z.object({
  saccoName: z.string().min(2).max(120),
  saccoMemberId: z.string().min(2).max(60),
});

/** Recalculate and persist a user's trust score. */
async function recalcTrustScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      phone: true,
      nidaVerified: true,
      licenseVerified: true,
      saccoVerified: true,
      superhostSince: true,
      totalHostTrips: true,
      bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
    },
  });
  if (!user) return 50;

  let score = 0;
  if (user.emailVerified) score += 10;
  if (user.phone) score += 10;
  if (user.nidaVerified) score += 20;
  if (user.licenseVerified) score += 15;
  if (user.saccoVerified) score += 20;
  if (user.superhostSince) score += 15;
  if (user.bookings.length >= 5) score += 10;

  await prisma.user.update({ where: { id: userId }, data: { trustScore: score } });
  return score;
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trustScore: true,
      saccoName: true,
      saccoMemberId: true,
      saccoVerified: true,
      nidaVerified: true,
      licenseVerified: true,
      emailVerified: true,
      phone: true,
      superhostSince: true,
    },
  });

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { saccoName, saccoMemberId } = submitSchema.parse(body);
    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: { saccoName, saccoMemberId, saccoVerified: false },
    });

    return NextResponse.json({ success: true, message: 'SACCO details submitted for review' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, approved } = body as { userId: string; approved: boolean };

  await prisma.user.update({
    where: { id: userId },
    data: { saccoVerified: approved },
  });

  const score = await recalcTrustScore(userId);
  return NextResponse.json({ success: true, trustScore: score });
}
