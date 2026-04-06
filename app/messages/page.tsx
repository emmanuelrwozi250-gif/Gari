import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = { title: 'Messages — Gari' };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/messages');

  const userId = (session.user as any).id;

  // Load all bookings where user is renter or host
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { renterId: userId },
        { car: { hostId: userId } },
      ],
    },
    include: {
      car: {
        select: { make: true, model: true, year: true, photos: true, hostId: true },
      },
      renter: { select: { id: true, name: true, avatar: true, image: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Count unread messages per booking
  const unreadCounts = await prisma.message.groupBy({
    by: ['bookingId'],
    where: {
      booking: {
        OR: [{ renterId: userId }, { car: { hostId: userId } }],
      },
      senderId: { not: userId },
      read: false,
    },
    _count: { id: true },
  });

  const unreadMap = Object.fromEntries(
    unreadCounts.map(u => [u.bookingId, u._count.id])
  );

  return (
    <MessagesClient
      bookings={bookings as any}
      userId={userId}
      unreadMap={unreadMap}
      defaultBookingId={searchParams.bookingId}
    />
  );
}
