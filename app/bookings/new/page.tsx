import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { NewBookingClient } from './NewBookingClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Confirm Booking — Gari' };

interface PageProps {
  searchParams: Promise<{
    carId?: string;
    pickupDate?: string;
    returnDate?: string;
    withDriver?: string;
    pickupLocation?: string;
    totalDays?: string;
    subtotal?: string;
    platformFee?: string;
    driverFee?: string;
    totalAmount?: string;
    paymentMethod?: string;
    depositAmount?: string;
  }>;
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/search');

  const sp = await searchParams;
  const carId = sp.carId ?? '';
  if (!carId) redirect('/search');

  // Resolve car from DB or demo data
  type CarShape = {
    id: string; make: string; model: string; year: number;
    photos: string[]; district: string; pricePerDay: number;
    driverPricePerDay: number | null; instantBooking: boolean;
    host: { id: string; name: string | null; } | null;
  };
  let car: CarShape | null = null;

  try {
    const dbCar = await prisma.car.findFirst({
      where: { OR: [{ id: carId }, { slug: carId }] },
      select: {
        id: true, make: true, model: true, year: true,
        photos: true, district: true, pricePerDay: true,
        driverPricePerDay: true, instantBooking: true,
        host: { select: { id: true, name: true } },
      },
    });
    if (dbCar) car = dbCar as CarShape;
  } catch { /* fall through to demo */ }

  if (!car) {
    const demo = DEMO_RENTAL_CARS.find(c => c.id === carId);
    if (demo) {
      car = {
        id: demo.id, make: demo.make, model: demo.model, year: demo.year,
        photos: demo.images, district: demo.district,
        pricePerDay: demo.pricePerDay, driverPricePerDay: 20000,
        instantBooking: false, host: null,
      };
    }
  }

  if (!car) redirect('/search');

  const user = session.user as { id?: string; name?: string | null; email?: string | null; renterType?: string };

  return (
    <NewBookingClient
      car={car}
      userId={user.id ?? ''}
      userName={user.name ?? ''}
      userEmail={user.email ?? ''}
      renterType={(user.renterType as 'LOCAL' | 'FOREIGN') ?? 'LOCAL'}
      params={{
        pickupDate: sp.pickupDate ?? '',
        returnDate: sp.returnDate ?? '',
        withDriver: sp.withDriver === 'true',
        pickupLocation: sp.pickupLocation ?? '',
        totalDays: Number(sp.totalDays ?? 1),
        subtotal: Number(sp.subtotal ?? 0),
        platformFee: Number(sp.platformFee ?? 0),
        driverFee: Number(sp.driverFee ?? 0),
        totalAmount: Number(sp.totalAmount ?? 0),
        depositAmount: Number(sp.depositAmount ?? 0),
        paymentMethod: (sp.paymentMethod as 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD') ?? 'MTN_MOMO',
      }}
    />
  );
}
