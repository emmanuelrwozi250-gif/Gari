import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
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
      isRevealed: true, // Always visible on public car detail; isRevealed is a host-management concept
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
      priceIncludesVat: (car as { priceIncludesVat?: boolean }).priceIncludesVat ?? false,
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
  if (!car) return { title: 'Car Rental — Gari' };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
  const carTitle = `${car.year} ${car.make} ${car.model}`;
  const ogUrl = `${baseUrl}/og?title=${encodeURIComponent(carTitle)}&sub=${encodeURIComponent('Available in Rwanda · NIDA Verified')}&price=${encodeURIComponent(formatRWF(car.pricePerDay))}`;

  return {
    title: `${carTitle} Rental in Rwanda — Gari`,
    description: `Rent a ${carTitle} in Rwanda from ${formatRWF(car.pricePerDay)}/day. NIDA-verified host. Book on Gari.`,
    openGraph: {
      title: `${carTitle} — ${formatRWF(car.pricePerDay)}/day`,
      description: `${carTitle} available in Rwanda. Self-drive or with driver.`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: carTitle }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${carTitle} — ${formatRWF(car.pricePerDay)}/day`,
      description: `${carTitle} available in Rwanda. Self-drive or with driver.`,
      images: [ogUrl],
    },
  };
}

export default async function CarPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // DB only — no demo fallback. Unknown IDs → 404.
  const car = await getCar(id);
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
