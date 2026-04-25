import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/bookings/[id]/inspection
// Body: { type: 'pickup'|'return'|'damage', position: string, imageUrl: string, lat?, lng? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { renterId: true, hostId: true },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  const isRenter = booking.renterId === userId;
  const isHost = booking.hostId === userId;
  if (!isRenter && !isHost && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    type: string; position: string; imageUrl: string; lat?: number; lng?: number;
  };
  const { type, position, imageUrl, lat, lng } = body;

  if (!type || !position || !imageUrl) {
    return NextResponse.json({ error: 'type, position and imageUrl are required' }, { status: 400 });
  }

  const photo = await prisma.inspectionPhoto.create({
    data: { bookingId: id, type, position, imageUrl, lat, lng },
  });

  // Update booking's array fields too (pickup/return arrays for quick access)
  if (type === 'pickup') {
    await prisma.booking.update({
      where: { id },
      data: { inspectionPhotosPickup: { push: imageUrl } },
    });
  } else if (type === 'return' || type === 'damage') {
    await prisma.booking.update({
      where: { id },
      data: { inspectionPhotosReturn: { push: imageUrl } },
    });
  }

  return NextResponse.json({ ok: true, photo });
}

// GET /api/bookings/[id]/inspection — return all inspection photos grouped by type
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { renterId: true, hostId: true },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  if (booking.renterId !== userId && booking.hostId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const photos = await prisma.inspectionPhoto.findMany({
    where: { bookingId: id },
    orderBy: { takenAt: 'asc' },
  });

  const grouped = {
    pickup: photos.filter(p => p.type === 'pickup'),
    return: photos.filter(p => p.type === 'return'),
    damage: photos.filter(p => p.type === 'damage'),
  };

  return NextResponse.json(grouped);
}
