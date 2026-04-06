import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { SearchResults } from './SearchResults';

export const metadata: Metadata = {
  title: 'Search Cars — Gari',
  description: 'Find and book cars across all 30 districts of Rwanda.',
};

interface SearchPageProps {
  searchParams: {
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
    sort?: string;
    page?: string;
  };
}

async function getCars(params: SearchPageProps['searchParams']) {
  try {
    const where: any = { isAvailable: true };
    if (params.district) where.district = params.district;
    if (params.driver === 'true') where.driverAvailable = true;
    if (params.type) where.type = params.type;
    if (params.listingType) where.listingType = params.listingType;
    if (params.transmission) where.transmission = params.transmission;
    if (params.seats) where.seats = { gte: parseInt(params.seats) };
    if (params.minPrice || params.maxPrice) {
      where.pricePerDay = {};
      if (params.minPrice) where.pricePerDay.gte = parseInt(params.minPrice);
      if (params.maxPrice) where.pricePerDay.lte = parseInt(params.maxPrice);
    }

    const orderBy: any =
      params.sort === 'price_asc' ? { pricePerDay: 'asc' } :
      params.sort === 'price_desc' ? { pricePerDay: 'desc' } :
      params.sort === 'rating' ? { rating: 'desc' } :
      params.sort === 'newest' ? { createdAt: 'desc' } :
      { rating: 'desc' };

    const page = parseInt(params.page || '1');
    const take = 12;
    const skip = (page - 1) * take;

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        include: { host: { select: { name: true, avatar: true } } },
        orderBy,
        take,
        skip,
      }),
      prisma.car.count({ where }),
    ]);

    return { cars, total, page };
  } catch {
    return { cars: [], total: 0, page: 1 };
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { cars, total, page } = await getCars(searchParams);

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>}>
      <SearchResults
        cars={cars as any[]}
        total={total}
        page={page}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
