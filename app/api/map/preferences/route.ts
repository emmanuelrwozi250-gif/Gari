/**
 * GET  /api/map/preferences — get user's map preferences
 * PUT  /api/map/preferences — save preferences
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  audioEnabled: false,
  categories: ['food', 'landmark', 'healthcare'],
  frequency: 'medium',
  radius: 150,
  language: 'en',
};

export async function GET() {
  const session = await getServerSession(authOptions);
  // Return defaults for unauthenticated users — map works for everyone
  if (!session?.user) return NextResponse.json(DEFAULTS);
  const userId = (session.user as any).id;

  const prefs = await prisma.userMapPreferences.findUnique({ where: { userId } }).catch(() => null);
  return NextResponse.json(prefs || DEFAULTS);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const { audioEnabled, categories, frequency, radius, language } = body;

  const prefs = await prisma.userMapPreferences.upsert({
    where: { userId },
    create: { userId, audioEnabled, categories, frequency, radius, language },
    update: { audioEnabled, categories, frequency, radius, language },
  }).catch(() => null);

  return NextResponse.json(prefs || { ok: true });
}
