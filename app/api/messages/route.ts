import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  const userId = (session.user as any).id;

  // Verify user is part of this booking (renter or host)
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { car: { select: { hostId: true } } },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.renterId !== userId && booking.car.hostId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { bookingId },
    include: { sender: { select: { id: true, name: true, avatar: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { bookingId, senderId: { not: userId }, read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { bookingId, content } = await req.json();

  if (!bookingId || !content?.trim()) {
    return NextResponse.json({ error: 'bookingId and content are required' }, { status: 400 });
  }

  // Verify user is part of this booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { car: { select: { hostId: true } }, renter: { select: { id: true } } },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.renterId !== userId && booking.car.hostId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { bookingId, senderId: userId, content: content.trim() },
    include: { sender: { select: { id: true, name: true, avatar: true, image: true } } },
  });

  // Create notification for the other party
  const recipientId = booking.renterId === userId ? booking.car.hostId : booking.renterId;
  await prisma.notification.create({
    data: {
      userId: recipientId,
      title: 'New message',
      message: `${(session.user as any).name || 'Someone'}: ${content.trim().slice(0, 80)}`,
      type: 'MESSAGE',
    },
  });

  return NextResponse.json(message, { status: 201 });
}
