import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { PaymentClient } from './PaymentClient';

export const metadata: Metadata = { title: 'Pay for Booking — Gari' };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ method?: string; amount?: string }>;
}

export default async function PayPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const sp = await searchParams;

  type BookingShape = {
    id: string; status: string; paymentStatus: string; paymentMethod: string;
    totalAmount: number; depositAmount: number;
    car: { make: string; model: string; year: number; photos: string[] };
  };
  let booking: BookingShape | null = null;

  try {
    const raw = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true, status: true, paymentStatus: true, paymentMethod: true,
        totalAmount: true, depositAmount: true,
        car: { select: { make: true, model: true, year: true, photos: true } },
      },
    });
    if (raw) booking = raw as BookingShape;
  } catch { /* fall through */ }

  // If booking not found (e.g. demo flow), build a skeleton from query params
  if (!booking) {
    const method = sp.method ?? 'MTN_MOMO';
    const amount = Number(sp.amount ?? 0);
    booking = {
      id, status: 'PENDING', paymentStatus: 'UNPAID',
      paymentMethod: method, totalAmount: amount, depositAmount: 0,
      car: { make: '', model: '', year: 0, photos: [] },
    };
  }

  // If already paid, go to confirmation
  if (booking.paymentStatus === 'PAID') {
    redirect(`/bookings/${id}/confirmed`);
  }

  const method = (booking.paymentMethod ?? sp.method ?? 'MTN_MOMO') as 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
  const totalDue = booking.totalAmount + booking.depositAmount;

  return (
    <PaymentClient
      bookingId={id}
      method={method}
      totalDue={totalDue > 0 ? totalDue : Number(sp.amount ?? 0)}
      carLabel={booking.car.make ? `${booking.car.year} ${booking.car.make} ${booking.car.model}` : 'Your booking'}
    />
  );
}
