import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { CheckinClient } from './CheckinClient';

export const metadata: Metadata = { title: 'Vehicle Check-in — Gari' };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function CheckinPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const sp = await searchParams;
  const checkInType = (sp.type === 'return' ? 'return' : 'pickup') as 'pickup' | 'return';

  const userId = (session.user as { id?: string }).id ?? '';

  let booking: {
    id: string;
    status: string;
    pickupDate: string;
    returnDate: string;
    renterId: string;
    hostId: string | null;
    car: { make: string; model: string; year: number; photos: string[] };
  } | null = null;

  try {
    const raw = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true, status: true,
        pickupDate: true, returnDate: true,
        renterId: true, hostId: true,
        car: { select: { make: true, model: true, year: true, photos: true } },
      },
    });
    if (raw) {
      booking = {
        ...raw,
        pickupDate: raw.pickupDate.toISOString(),
        returnDate: raw.returnDate.toISOString(),
      };
    }
  } catch { /* fall through */ }

  if (!booking) notFound();

  const isRenter = booking.renterId === userId;
  const isHost = booking.hostId === userId;
  const role = (session.user as { role?: string }).role;

  if (!isRenter && !isHost && role !== 'ADMIN') redirect('/dashboard');

  // Validate state: can only do pickup check-in when CONFIRMED/ACTIVE
  // and return check-in only when ACTIVE
  const allowed =
    (checkInType === 'pickup' && ['CONFIRMED', 'ACTIVE', 'PENDING'].includes(booking.status)) ||
    (checkInType === 'return' && booking.status === 'ACTIVE');

  if (!allowed) redirect(`/bookings/${id}`);

  return (
    <CheckinClient
      bookingId={id}
      checkInType={checkInType}
      carLabel={`${booking.car.year} ${booking.car.make} ${booking.car.model}`}
      carPhoto={booking.car.photos[0] ?? null}
    />
  );
}
