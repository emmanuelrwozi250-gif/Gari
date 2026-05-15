import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>> | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session && (session as any).user && (session as any).user.role === 'ADMIN';
}

// PATCH /api/admin/pricing-rules/[id] — toggle enabled or update fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (typeof body.enabled === 'boolean') updateData.enabled = body.enabled;
  if (typeof body.multiplier === 'number') updateData.multiplier = body.multiplier;
  if (typeof body.name === 'string') updateData.name = body.name;
  if (typeof body.priority === 'number') updateData.priority = body.priority;
  if (typeof body.description === 'string') updateData.description = body.description;
  if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
  if (Array.isArray(body.dayOfWeek)) updateData.dayOfWeek = body.dayOfWeek;
  if (body.minDays !== undefined) updateData.minDays = body.minDays ?? null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const rule = await prisma.pricingRule.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ rule });
  } catch {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }
}

// DELETE /api/admin/pricing-rules/[id] — delete a rule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.pricingRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }
}
