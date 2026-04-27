import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      speaksEnglish: true,
      speaksFrench: true,
      airportPickup: true,
      internationalReady: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const { speaksEnglish, speaksFrench, airportPickup, internationalReady } = body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      speaksEnglish: Boolean(speaksEnglish),
      speaksFrench: Boolean(speaksFrench),
      airportPickup: Boolean(airportPickup),
      internationalReady: Boolean(internationalReady),
    },
    select: {
      speaksEnglish: true,
      speaksFrench: true,
      airportPickup: true,
      internationalReady: true,
    },
  });

  return NextResponse.json(updated);
}
