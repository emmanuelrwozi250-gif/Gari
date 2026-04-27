import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { CarDetailClient, type CarDisplay, type ReviewDisplay, type SimilarCar } from '@/components/CarDetailClient';
import { formatRWF } from '@/lib/utils';

// cache() deduplicates calls within a single render — generateMetadata + page component
// both call getCar but only one DB round-trip is made per request
const getCar = cache(async function getCar(id: string): Promise<CarDisplay | null> {
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
      cancellationPolicy: (car.cancellationPolicy ?? 'MODERATE') as 'FLEXIBLE' | 'MODERATE' | 'STRICT',
      hostSuperhostSince: car.host?.superhostSince
        ? car.host.superhostSince.toISOString()
        : null,
    };
  } catch {
    return null;
  }
});

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const car = await getCar(id);
  const demo = !car ? DEMO_RENTAL_CARS.find(c => c.id === id) : null;
  const display = car ?? demo;
  if (!display) return { title: 'Car Rental — Gari' };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
  const carTitle = `${display.year} ${display.make} ${display.model}`;
  const ogUrl = `${baseUrl}/og?title=${encodeURIComponent(carTitle)}&sub=${encodeURIComponent('Available in Rwanda · NIDA Verified')}&price=${encodeURIComponent(formatRWF(display.pricePerDay))}`;

  return {
    title: `${carTitle} Rental in Rwanda — Gari`,
    description: `Rent a ${carTitle} in Rwanda from ${formatRWF(display.pricePerDay)}/day. NIDA-verified host. Book on Gari.`,
    openGraph: {
      title: `${carTitle} — ${formatRWF(display.pricePerDay)}/day`,
      description: `${carTitle} available in Rwanda. Self-drive or with driver.`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: carTitle }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${carTitle} — ${formatRWF(display.pricePerDay)}/day`,
      description: `${carTitle} available in Rwanda. Self-drive or with driver.`,
      images: [ogUrl],
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

  // 4. Fetch similar cars from DB (same type → any, max 3, never demo IDs)
  let similarCars: SimilarCar[] = [];
  try {
    const sameType = await prisma.car.findMany({
      where: { id: { not: id }, type: car.type as any, isAvailable: true },
      orderBy: { rating: 'desc' },
      take: 3,
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, rating: true, photos: true, slug: true },
    });
    const results = sameType.length >= 3 ? sameType : [
      ...sameType,
      ...(await prisma.car.findMany({
        where: { id: { notIn: [id, ...sameType.map(c => c.id)] }, isAvailable: true },
        orderBy: { rating: 'desc' },
        take: 3 - sameType.length,
        select: { id: true, make: true, model: true, year: true, pricePerDay: true, rating: true, photos: true, slug: true },
      })),
    ];
    similarCars = results.map(c => ({
      id: c.slug ?? c.id,
      make: c.make,
      model: c.model,
      year: c.year,
      pricePerDay: c.pricePerDay,
      rating: c.rating,
      images: c.photos,
    }));
  } catch {
    // non-critical — falls back to empty array
  }

  // 5. Check if logged-in user has a completed booking for this car (enables review form)
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

  const baseUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${car.year} ${car.make} ${car.model} — Car Rental in Rwanda`,
    description: car.description || `Rent a ${car.year} ${car.make} ${car.model} in Rwanda`,
    image: car.images[0] ?? '',
    brand: { '@type': 'Brand', name: car.make },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RWF',
      price: car.pricePerDay,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: car.pricePerDay,
        priceCurrency: 'RWF',
        unitCode: 'DAY',
      },
      availability: car.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/cars/${id}`,
    },
    ...(car.rating > 0 && car.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: car.rating.toFixed(1),
            reviewCount: car.reviewCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CarDetailClient car={car} completedBookingId={completedBookingId} existingBookingId={existingBookingId} similarCars={similarCars} />
    </>
  );
}
