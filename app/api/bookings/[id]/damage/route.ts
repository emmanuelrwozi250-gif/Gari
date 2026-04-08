import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { car: { select: { hostId: true } } },
  });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only host or admin can file damage reports
  const isHost = booking.car.hostId === userId;
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isHost && !isAdmin) {
    return NextResponse.json({ error: 'Only the host can file a damage report' }, { status: 403 });
  }
  if (booking.status !== 'COMPLETED' && booking.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Damage reports only for active or completed bookings' }, { status: 400 });
  }

  const { photos, description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: {
      damageReportPhotos: photos || [],
      damageDescription: description.trim(),
      depositStatus: 'CLAIMED',
    },
  });

  // Notify renter
  await prisma.notification.create({
    data: {
      userId: booking.renterId,
      title: 'Damage report filed',
      message: `Your host has filed a damage report for booking ${params.id.slice(0, 8).toUpperCase()}. Security deposit will be reviewed.`,
      type: 'DAMAGE',
    },
  });

  return NextResponse.json(updated);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    select: {
      renterId: true,
      damageReportPhotos: true,
      damageDescription: true,
      depositStatus: true,
      depositAmount: true,
      car: { select: { hostId: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (booking.renterId !== userId && booking.car.hostId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(booking);
}
