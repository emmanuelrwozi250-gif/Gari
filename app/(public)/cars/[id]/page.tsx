import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { CarDetailClient, type CarDisplay, type ReviewDisplay } from '@/components/CarDetailClient';
import { formatRWF } from '@/lib/utils';

async function getCar(id: string): Promise<CarDisplay | null> {
  try {
    const include = {
      host: { select: { id: true, name: true, avatar: true, createdAt: true, nidaVerified: true, superhostSince: true } },
      reviews: {
        include: { reviewer: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
      _count: { select: { reviews: true } },
    };

    let car = await prisma.car.findUnique({ where: { id }, include });
    if (!car) {
      car = await prisma.car.findFirst({ where: { slug: id }, include });
    }
    if (!car) return null;

    const reviews: ReviewDisplay[] = (car.reviews ?? []).map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewerName: r.reviewer?.name ?? 'Anonymous',
      reviewerAvatar: r.reviewer?.avatar ?? null,
      isRevealed: (r as { isRevealed?: boolean }).isRevealed ?? true,
    }));

    return {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      type: car.type,
      pricePerDay: car.pricePerDay,
      district: car.district,
      seats: car.seats,
      transmission: car.transmission,
      drivingOption: car.driverAvailable ? 'Both' : 'Self-Drive',
      images: car.photos,
      hostName: car.host?.name ?? '',
      hostAvatar: car.host?.avatar ?? '',
      hostVerified: car.isVerified,
      hostMemberSince: new Date(car.host?.createdAt ?? Date.now()).toLocaleDateString('en-RW', { month: 'long', year: 'numeric' }),
      hostResponseRate: '95%',
      rating: car.rating,
      tripCount: car.totalTrips,
      reviewCount: car._count.reviews,
      features: car.features.length > 0 ? car.features : ['Air Conditioning', 'USB Charging'],
      description: car.description ?? '',
      fuel: car.fuel,
      available: car.isAvailable,
      depositAmount: car.depositAmount,
      instantBooking: car.instantBooking,
      driverPricePerDay: car.driverPricePerDay ?? 0,
      reviews,
      hostSuperhostSince: car.host?.superhostSince
        ? car.host.superhostSince.toISOString()
        : null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const car = await getCar(id);
  const demo = !car ? DEMO_RENTAL_CARS.find(c => c.id === id) : null;
  const display = car ?? demo;
  if (!display) return { title: 'Car Rental — Gari' };
  return {
    title: `${display.year} ${display.make} ${display.model} Rental in Rwanda — Gari`,
    description: `Rent a ${display.year} ${display.make} ${display.model} in Rwanda from ${formatRWF(display.pricePerDay)}/day. NIDA-verified host. Book on Gari.`,
    openGraph: {
      title: `${display.year} ${display.make} ${display.model} — ${formatRWF(display.pricePerDay)}/day`,
      description: `${display.year} ${display.make} ${display.model} available in Rwanda. Self-drive or with driver.`,
      images: (display as CarDisplay).images?.[0]
        ? [{ url: (display as CarDisplay).images[0] }]
        : (demo as { images?: string[] })?.images?.[0]
        ? [{ url: (demo as { images: string[] }).images[0] }]
        : [],
      type: 'website',
    },
  };
}

export default async function CarPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Try DB via Prisma directly (no HTTP fetch, no failure risk)
  let car = await getCar(id);

  // 2. Fall back to demo data
  if (!car) {
    const demo = DEMO_RENTAL_CARS.find(c => c.id === id);
    if (demo) {
      car = {
        id: demo.id,
        make: demo.make,
        model: demo.model,
        year: demo.year,
        type: demo.type,
        pricePerDay: demo.pricePerDay,
        district: demo.district,
        seats: demo.seats,
        transmission: demo.transmission,
        drivingOption: demo.drivingOption,
        images: demo.images,
        hostName: demo.hostName,
        hostAvatar: demo.hostAvatar,
        hostVerified: demo.hostVerified,
        hostMemberSince: demo.hostMemberSince,
        hostResponseRate: demo.hostResponseRate,
        rating: demo.rating,
        tripCount: demo.reviewCount,
        reviewCount: demo.reviewCount,
        features: demo.features,
        description: demo.description,
        fuel: demo.fuel,
        available: demo.available,
        depositAmount: 0,
        instantBooking: false,
        driverPricePerDay: 0,
        reviews: [],
      };
    }
  }

  // 3. Proper 404 — shows custom not-found page
  if (!car) notFound();

  // 4. Check if logged-in user has a completed booking for this car (enables review form)
  //    and any active/confirmed booking (enables in-app messaging)
  let completedBookingId: string | null = null;
  let existingBookingId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as { id?: string }).id;
      if (userId) {
        const [completed, existing] = await Promise.all([
          prisma.booking.findFirst({
            where: { carId: id, renterId: userId, status: 'COMPLETED', review: null },
            select: { id: true },
          }),
          prisma.booking.findFirst({
            where: { carId: id, renterId: userId, status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] } },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]);
        completedBookingId = completed?.id ?? null;
        existingBookingId = existing?.id ?? null;
      }
    }
  } catch {
    // Session check is non-critical — silently skip
  }

  return <CarDetailClient car={car} completedBookingId={completedBookingId} existingBookingId={existingBookingId} />;
}
