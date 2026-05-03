import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/cohost/[id]/accept — co-host accepts invite
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  const relation = await prisma.coHostRelation.findUnique({ where: { id } });
  if (!relation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  if (relation.coHostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (relation.active) return NextResponse.json({ error: 'Already accepted' }, { status: 409 });

  const updated = await prisma.coHostRelation.update({
    where: { id },
    data: { active: true, acceptedAt: new Date() },
  });

  return NextResponse.json({ id: updated.id, active: updated.active });
}

// DELETE /api/cohost/[id] — owner removes co-host (or co-host removes self)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  const relation = await prisma.coHostRelation.findUnique({ where: { id } });
  if (!relation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Allow owner or co-host to remove
  if (relation.ownerId !== userId && relation.coHostId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.coHostRelation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
