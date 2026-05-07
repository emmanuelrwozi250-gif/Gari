import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/flags/[key]
 * Body: { enabled: boolean }
 * Auth: ADMIN role required.
 *
 * Toggles a FeatureFlag by key. Creates it if it doesn't exist.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await params;
  const { enabled } = await req.json();

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
  }

  const flag = await prisma.featureFlag.upsert({
    where:  { key },
    update: { enabled, updatedBy: (session.user as { id?: string }).id },
    create: { key, enabled, updatedBy: (session.user as { id?: string }).id },
  });

  return NextResponse.json({ ok: true, flag });
}

/**
 * GET /api/admin/flags/[key]
 * Auth: ADMIN role required.
 * Returns a single flag's current state.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await params;
  const flag = await prisma.featureFlag.findUnique({ where: { key } });

  return NextResponse.json({ flag });
}
