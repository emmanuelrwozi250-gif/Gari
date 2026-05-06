import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { SearchResults, SearchSkeleton } from './SearchResults';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { searchParams }: SearchPageProps
): Promise<Metadata> {
  const p = await searchParams;
  const parts: string[] = [];
  if (p.type) parts.push(p.type.replace(/_/g, ' ').toLowerCase());
  if (p.district) parts.push(`in ${p.district.charAt(0) + p.district.slice(1).toLowerCase()}`);

  const title = parts.length
    ? `Rent ${parts.join(' ')} · Gari Rwanda`
    : 'Browse Cars for Rent in Rwanda · Gari';

  const description = parts.length
    ? `Find and book ${parts.join(' ')} on Gari. NIDA-verified hosts, instant booking available.`
    : 'Find economy cars, SUVs, minibuses and executive vehicles in Rwanda. Filter by district, price and car type.';

  return { title, description };
}

type SearchParamsShape = {
  district?: string;
  pickup?: string;
  return?: string;
  driver?: string;
  type?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  seats?: string;
  transmission?: string;
  instantBooking?: string;
  sort?: string;
  page?: string;
};

interface SearchPageProps {
  searchParams: Promise<SearchParamsShape>;
}

// Slug → enum mapping so URLs can use human-readable type slugs
// e.g. /search?type=suv-4x4 works alongside legacy ?type=SUV_4X4
const TYPE_SLUG_MAP: Record<string, string> = {
  'suv-4x4':   'SUV_4X4',
  'pickup':    'PICKUP',
  'executive': 'EXECUTIVE',
  'economy':   'ECONOMY',
  'sedan':     'SEDAN',
  'minibus':   'MINIBUS',
  'coaster':   'COASTER',
  'luxury':    'LUXURY',
  'van':       'VAN',
};
function resolveType(t?: string): string | undefined {
  if (!t) return undefined;
  return TYPE_SLUG_MAP[t.toLowerCase()] ?? t; // fall back to raw value for backward compat
}

// DEMO DATA — swap for API call
function filterDemoCars(params: SearchParamsShape) {
  let cars = DEMO_RENTAL_CARS.map(c => ({
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
    listingType: c.listingType,
    rating: c.rating,
    totalTrips: c.reviewCount,
    photos: c.images,
    isAvailable: true,
    isVerified: c.hostVerified,
    instantBooking: c.listingType === 'Fleet',
    hasAC: true,
    fuel: c.fuel.toUpperCase(),
    host: { name: c.hostName, avatar: c.hostAvatar },
    createdAt: new Date(),
  }));

  if (params.district) cars = cars.filter(c => c.district === params.district);
  if (params.driver === 'true') cars = cars.filter(c => c.driverAvailable);
  if (params.type) cars = cars.filter(c => c.type === resolveType(params.type));
  if (params.listingType) cars = cars.filter(c => c.listingType === params.listingType);
  if (params.transmission) cars = cars.filter(c => c.transmission === params.transmission);
  if (params.seats) cars = cars.filter(c => c.seats >= parseInt(params.seats!));
  if (params.minPrice) cars = cars.filter(c => c.pricePerDay >= parseInt(params.minPrice!));
  if (params.maxPrice) cars = cars.filter(c => c.pricePerDay <= parseInt(params.maxPrice!));
  if (params.instantBooking === 'true') cars = cars.filter(c => c.instantBooking);
  if (!params.type) cars = cars.filter(c => !['MINIBUS', 'COASTER'].includes(c.type));

  if (params.sort === 'price_asc') cars.sort((a, b) => a.pricePerDay - b.pricePerDay);
  else if (params.sort === 'price_desc') cars.sort((a, b) => b.pricePerDay - a.pricePerDay);
  else if (params.sort === 'newest') cars.reverse();
  else if (params.sort === 'popular') cars.sort((a, b) => (b.totalTrips - a.totalTrips) || (b.rating - a.rating));
  else cars.sort((a, b) => (b.totalTrips - a.totalTrips) || (b.rating - a.rating) || (a.pricePerDay - b.pricePerDay));

  return cars;
}

async function getCars(params: SearchParamsShape) {
  try {
    const where: Record<string, unknown> = { isAvailable: true };
    // RURA compliance: only licensed commercial vehicles appear publicly
    where.vehicleType = 'COMMERCIAL';
    where.complianceStatus = 'APPROVED';
    if (params.district) where.district = params.district;
    if (params.driver === 'true') where.driverAvailable = true;
    if (params.type) where.type = resolveType(params.type);
    if (params.listingType) where.listingType = params.listingType;
    if (params.transmission) where.transmission = params.transmission;
    if (params.seats) where.seats = { gte: parseInt(params.seats) };
    if (params.minPrice || params.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (params.minPrice) priceFilter.gte = parseInt(params.minPrice);
      if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice);
      where.pricePerDay = priceFilter;
    }
    if (params.instantBooking === 'true') where.instantBooking = true;
    if ((params as any).intl === 'true') {
      where.host = { internationalReady: true };
    }
    // Exclude commercial buses from default browse — still reachable via ?type=minibus / ?type=coaster
    if (!params.type) {
      where.type = { notIn: ['MINIBUS', 'COASTER'] };
    }

    const baseOrderBy = [
      { totalTrips: 'desc' as const },
      { rating: 'desc' as const },
      { pricePerDay: 'asc' as const },
    ];

    const orderBy =
      params.sort === 'price_asc'  ? [{ pricePerDay: 'asc' as const }] :
      params.sort === 'price_desc' ? [{ pricePerDay: 'desc' as const }] :
      params.sort === 'rating'     ? [{ rating: 'desc' as const }] :
      params.sort === 'newest'     ? [{ createdAt: 'desc' as const }] :
      params.sort === 'popular'    ? [{ totalTrips: 'desc' as const }, { rating: 'desc' as const }] :
      [{ isFeatured: 'desc' as const }, ...baseOrderBy]; // boosted listings always first on default view

    const page = parseInt(params.page || '1');
    const take = 12;
    const skip = (page - 1) * take;

    const [dbCars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        include: { host: { select: { name: true, avatar: true, superhostSince: true, internationalReady: true, airportPickup: true } } },
        orderBy,
        take,
        skip,
      }),
      prisma.car.count({ where }),
    ]);

    if (dbCars.length > 0) {
      return { cars: dbCars, total, page };
    }
    // DEMO DATA fallback
    const demoCars = filterDemoCars(params);
    return { cars: demoCars, total: demoCars.length, page: 1 };
  } catch {
    const demoCars = filterDemoCars(params);
    return { cars: demoCars, total: demoCars.length, page: 1 };
  }
}

async function SearchResultsFetcher({ searchParams }: { searchParams: Promise<SearchParamsShape> }) {
  const resolved = await searchParams;
  const [{ cars, total, page }, priceRange] = await Promise.all([
    getCars(resolved),
    prisma.car.aggregate({
      _min: { pricePerDay: true },
      _max: { pricePerDay: true },
      where: { isAvailable: true },
    }).catch(() => ({ _min: { pricePerDay: 15000 }, _max: { pricePerDay: 300000 } })),
  ]);
  const priceMin = priceRange._min.pricePerDay ?? 15000;
  const priceMax = priceRange._max.pricePerDay ?? 300000;
  return (
    <SearchResults
      cars={cars as unknown[]}
      total={total}
      page={page}
      searchParams={resolved}
      priceMin={priceMin}
      priceMax={priceMax}
    />
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResultsFetcher searchParams={searchParams} />
    </Suspense>
  );
}
