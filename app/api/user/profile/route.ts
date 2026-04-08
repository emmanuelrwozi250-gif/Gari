/**
 * GET  /api/user/profile — return the current user's full profile
 * PUT  /api/user/profile — update editable profile fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      nidaNumber: true,
      nidaVerified: true,
      licenseVerified: true,
      whatsappNumber: true,
      preferredLanguage: true,
      saccoName: true,
      saccoMemberId: true,
      saccoVerified: true,
      trustScore: true,
      communityVerified: true,
      trustCircleId: true,
      isSeller: true,
      isInvestor: true,
      superhostSince: true,
      totalHostTrips: true,
      responseRate: true,
      avgResponseHours: true,
      stripeOnboarded: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Only allow updating safe fields — never role, nidaVerified, trustScore, etc.
  const allowedFields = ['name', 'phone', 'avatar', 'whatsappNumber', 'preferredLanguage', 'saccoName', 'saccoMemberId'];
  const data: Record<string, string> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: (session.user as any).id },
    data,
    select: { id: true, name: true, phone: true, avatar: true, whatsappNumber: true, preferredLanguage: true },
  });

  return NextResponse.json(updated);
}
