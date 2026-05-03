import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cars/[id]/extras — list extras for a car
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const extras = await prisma.carExtra.findMany({
    where: { carId: id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ extras });
}

// POST /api/cars/[id]/extras — add a new extra (host only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

  const userId = (session.user as { id?: string }).id;
  if (car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, description, icon, pricePerDay } = body;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const extra = await prisma.carExtra.create({
    data: {
      carId: id,
      name: String(name),
      description: description ? String(description) : null,
      icon: icon ? String(icon) : null,
      pricePerDay: Number(pricePerDay) || 0,
    },
  });
  return NextResponse.json({ extra }, { status: 201 });
}

// PATCH /api/cars/[id]/extras — update extra availability
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

  const userId = (session.user as { id?: string }).id;
  if (car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { extraId, isAvailable, name, description, icon, pricePerDay } = body;
  if (!extraId) return NextResponse.json({ error: 'extraId required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof isAvailable === 'boolean') data.isAvailable = isAvailable;
  if (name !== undefined) data.name = String(name);
  if (description !== undefined) data.description = description ? String(description) : null;
  if (icon !== undefined) data.icon = icon ? String(icon) : null;
  if (pricePerDay !== undefined) data.pricePerDay = Number(pricePerDay);

  const extra = await prisma.carExtra.update({ where: { id: extraId }, data });
  return NextResponse.json({ extra });
}

// DELETE /api/cars/[id]/extras — remove an extra (host only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

  const userId = (session.user as { id?: string }).id;
  if (car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { extraId } = body;
  if (!extraId) return NextResponse.json({ error: 'extraId required' }, { status: 400 });

  await prisma.carExtra.delete({ where: { id: extraId } });
  return NextResponse.json({ success: true });
}
