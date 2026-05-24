import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CarCard } from '@/components/CarCard';
import { COLLECTIONS, getCollection } from '@/lib/collections';
import { prisma } from '@/lib/prisma';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { CollectionTracker } from '@/components/recommendations/CollectionTracker';

export const dynamic = 'force-dynamic';

// Per-collection Prisma where clauses — OR logic so real DB data always shows cars
const COLLECTION_QUERIES: Record<string, () => Record<string, unknown>> = {
  'gorilla-trek': () => ({
    AND: [
      { isAvailable: true },
      { isVerified: true },
      { fuel: { notIn: ['ELECTRIC'] } },
      { OR: [
        { isSafariCapable: true },
        { type: { in: ['SUV_4X4', 'PICKUP'] } },
      ]},
    ],
  }),
  'lake-kivu': () => ({
    isAvailable: true,
    isVerified: true,
    // Any car can make the drive to Lake Kivu — no type restriction
  }),
  'kigali-business': () => ({
    isAvailable: true,
    isVerified: true,
    OR: [
      { type: { in: ['EXECUTIVE', 'LUXURY'] } },
      { pricePerDay: { gte: 100000 } },
    ],
  }),
  'national-parks': () => ({
    AND: [
      { isAvailable: true },
      { isVerified: true },
      { fuel: { notIn: ['ELECTRIC'] } },
      { OR: [
        { isSafariCapable: true },
        { type: { in: ['SUV_4X4', 'PICKUP'] } },
      ]},
    ],
  }),
  'family-road-trip': () => ({
    isAvailable: true,
    isVerified: true,
    OR: [
      { seats: { gte: 7 } },
      { type: { in: ['MINIBUS', 'COASTER'] } },
    ],
  }),
  'luxury': () => ({
    isAvailable: true,
    isVerified: true,
    OR: [
      { type: { in: ['EXECUTIVE', 'LUXURY'] } },
      { pricePerDay: { gte: 120000 } },
    ],
  }),
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};
  return {
    title: `${collection.title} | Gari Rwanda`,
    description: collection.description,
    openGraph: {
      title: `${collection.emoji} ${collection.title} | Gari Rwanda`,
      description: collection.description,
      images: [{ url: collection.heroImage, width: 1200, height: 630 }],
      url: `/collections/${slug}`,
      siteName: 'Gari',
      locale: 'en_RW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${collection.emoji} ${collection.title} | Gari Rwanda`,
      description: collection.description,
      images: [collection.heroImage],
    },
  };
}

async function getCollectionCars(slug: string) {
  const queryBuilder = COLLECTION_QUERIES[slug];
  if (!queryBuilder) return [];
  try {
    const where = queryBuilder();
    const cars = await prisma.car.findMany({
      where,
      include: { host: { select: { name: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 12,
    });
    if (cars.length > 0) return cars;
  } catch {
    // DB unavailable — fall through to demo
  }

  // Demo fallback — filter by slug logic
  const collection = getCollection(slug);
  if (!collection) return [];
  const { type, district, driver, seats } = collection.searchParams;
  const TYPE_SLUG_MAP: Record<string, string> = {
    'suv-4x4': 'SUV_4X4', 'pickup': 'PICKUP', 'executive': 'EXECUTIVE',
    'economy': 'ECONOMY', 'sedan': 'SEDAN', 'minibus': 'MINIBUS',
    'coaster': 'COASTER', 'luxury': 'LUXURY', 'van': 'VAN',
  };
  const EV_EXCLUDED_COLLECTIONS = new Set(['gorilla-trek', 'national-parks', 'safari']);
  const typeEnum = type ? (TYPE_SLUG_MAP[type] ?? type) : null;
  return DEMO_RENTAL_CARS
    .filter(c => {
      const carType = c.type.toUpperCase().replace(/ \/ /g, '_').replace(/ /g, '_');
      if (typeEnum && carType !== typeEnum) return false;
      if (district && c.district !== district) return false;
      if (driver === 'true' && c.drivingOption === 'Self-Drive') return false;
      if (seats && c.seats < parseInt(seats)) return false;
      if (EV_EXCLUDED_COLLECTIONS.has(slug) && c.fuel.toUpperCase() === 'ELECTRIC') return false;
      return true;
    })
    .map(c => ({
      id: c.id,
      make: c.make,
      model: c.model,
      year: c.year,
      type: c.type.toUpperCase().replace(/ \/ /g, '_').replace(/ /g, '_'),
      pricePerDay: c.pricePerDay,
      district: c.district,
      seats: c.seats,
      transmission: c.transmission === 'Auto' ? 'AUTOMATIC' : 'MANUAL',
      driverAvailable: c.drivingOption !== 'Self-Drive',
      photos: c.images,
      rating: c.rating,
      totalTrips: c.reviewCount,
      hasAC: true,
      fuel: c.fuel.toUpperCase(),
      isVerified: c.hostVerified,
      instantBooking: c.listingType === 'Fleet',
      host: { name: c.hostName, avatar: c.hostAvatar },
    }));
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const cars = await getCollectionCars(slug);
  const otherCollections = COLLECTIONS.filter(c => c.slug !== slug);

  // Build search link from collection params
  const searchUrl = '/search?' + new URLSearchParams(
    Object.fromEntries(Object.entries(collection.searchParams).filter(([, v]) => v))
  ).toString();

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <CollectionTracker slug={slug} />
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[280px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.heroImage}
          alt={collection.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="text-4xl mb-3">{collection.emoji}</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3">
            {collection.title}
          </h1>
          <p className="text-white/80 max-w-xl text-sm sm:text-base">{collection.description}</p>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {collection.highlights.map((h) => (
              <span key={h} className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                {h}
              </span>
            ))}
          </div>
        </div>
        {/* Back link */}
        <Link
          href="/collections"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Collections
        </Link>
      </div>

      {/* Car grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">
              {cars.length > 0 ? `${cars.length} car${cars.length !== 1 ? 's' : ''} available` : 'Cars in this collection'}
            </h2>
            <p className="text-sm text-text-secondary">Verified hosts · Instant or request booking</p>
          </div>
          <Link href={searchUrl} className="btn-ghost text-sm flex items-center gap-1">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {cars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(cars as any[]).map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">{collection.emoji}</p>
            <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">
              No cars listed yet
            </h3>
            <p className="text-text-secondary mb-6 text-sm">
              We're growing fast — check back soon or browse all available cars.
            </p>
            <Link href={searchUrl} className="btn-primary">
              Browse similar cars →
            </Link>
          </div>
        )}
      </div>

      {/* Other collections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-5">
          Explore other collections
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {otherCollections.map(c => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group block rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.heroImage} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 p-2 flex flex-col justify-end">
                  <p className="text-sm">{c.emoji}</p>
                  <p className="text-white text-xs font-semibold leading-tight">{c.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
