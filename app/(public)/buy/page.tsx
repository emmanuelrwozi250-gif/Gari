import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { formatRWF } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, MapPin, Gauge, Calendar, BadgeCheck, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { DEMO_SALES_LISTINGS } from '@/lib/demo-sales';

export const metadata: Metadata = {
  title: 'Buy a Verified Used Car in Rwanda · Gari',
  description: 'Browse NIDA-verified used cars for sale across Rwanda. Transparent pricing, direct from owners.',
};

const FALLBACK = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80';

const USD_RATE = Number(process.env.USD_RWF_EXCHANGE_RATE || '1340');

export default async function BuyPage({
  searchParams,
}: {
  searchParams: { make?: string; district?: string; minPrice?: string; maxPrice?: string; minYear?: string; sort?: string };
}) {
  const where: any = {
    status: 'AVAILABLE',
    expiresAt: { gte: new Date() },
    ...(searchParams.make && { make: { contains: searchParams.make, mode: 'insensitive' } }),
    ...(searchParams.district && { district: searchParams.district }),
    ...(searchParams.minPrice || searchParams.maxPrice
      ? {
          askingPrice: {
            ...(searchParams.minPrice && { gte: Number(searchParams.minPrice) }),
            ...(searchParams.maxPrice && { lte: Number(searchParams.maxPrice) }),
          },
        }
      : {}),
    ...(searchParams.minYear ? { year: { gte: Number(searchParams.minYear) } } : {}),
  };

  const orderBy: any =
    searchParams.sort === 'price_asc' ? { askingPrice: 'asc' }
    : searchParams.sort === 'price_desc' ? { askingPrice: 'desc' }
    : searchParams.sort === 'views' ? { viewCount: 'desc' }
    : { createdAt: 'desc' };

  let listings: any[] = [];
  let total = 0;
  try {
    [listings, total] = await Promise.all([
      prisma.salesListing.findMany({
        where,
        orderBy: [{ featured: 'desc' }, orderBy],
        take: 24,
        include: { seller: { select: { name: true, nidaVerified: true, trustScore: true } } },
      }),
      prisma.salesListing.count({ where }),
    ]);
  } catch {
    // DB not ready yet — fall through to demo data
  }

  // No DB records yet — show demo listings so the page is never empty
  if (listings.length === 0 && !searchParams.make && !searchParams.district && !searchParams.minPrice && !searchParams.minYear) {
    listings = DEMO_SALES_LISTINGS;
    total = DEMO_SALES_LISTINGS.length;
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Header */}
      <div className="bg-dark-bg text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Tag className="w-7 h-7 text-accent-yellow" />
            <h1 className="text-3xl font-extrabold">Buy a Car</h1>
          </div>
          <p className="text-gray-400 text-lg mb-8">
            {total} verified cars for sale across Rwanda
          </p>

          {/* Search bar */}
          <form method="GET" className="flex flex-wrap gap-3">
            <input
              name="make"
              defaultValue={searchParams.make}
              placeholder="Make (e.g. Toyota)"
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-primary w-40"
            />
            <select
              name="district"
              defaultValue={searchParams.district}
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Districts</option>
              {RWANDA_DISTRICTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              name="minPrice"
              defaultValue={searchParams.minPrice}
              placeholder="Min price (RWF)"
              type="number"
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-primary w-44"
            />
            <input
              name="minYear"
              defaultValue={searchParams.minYear}
              placeholder="Min year"
              type="number"
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-primary w-28"
            />
            <select
              name="sort"
              defaultValue={searchParams.sort}
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-primary"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="views">Most Viewed</option>
            </select>
            <button type="submit" className="btn-primary flex items-center gap-2 py-2.5 px-5">
              <Search className="w-4 h-4" /> Search
            </button>
          </form>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map(listing => {
              const photo = listing.photos[0] || FALLBACK;
              const district = RWANDA_DISTRICTS.find(d => d.id === listing.district);
              const usd = Math.round(listing.askingPrice / USD_RATE);
              return (
                <Link key={listing.id} href={`/buy/${listing.id}`} className="card group overflow-hidden hover:shadow-xl transition-all">
                  {listing.featured && (
                    <div className="absolute top-3 left-3 z-10 bg-accent-yellow text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      Featured
                    </div>
                  )}
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={photo}
                      alt={`${listing.make} ${listing.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute bottom-3 left-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        listing.condition === 'Excellent' ? 'bg-green-500 text-white' :
                        listing.condition === 'Good' ? 'bg-blue-500 text-white' :
                        listing.condition === 'Fair' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {listing.condition}
                      </span>
                    </div>
                    {listing.inspectionDone && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> Inspected
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-text-primary dark:text-white">
                      {listing.year} {listing.make} {listing.model}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1.5">
                      <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {listing.mileage.toLocaleString()} km</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {listing.year}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {district?.name || listing.district}</span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-xl font-extrabold text-primary">{formatRWF(listing.askingPrice)}</div>
                        <div className="text-xs text-text-light">≈ USD {usd.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        {listing.seller.nidaVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                        <span>{listing.seller.name?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {total > 24 && (
          <p className="text-center text-sm text-text-secondary mt-8">
            Showing 24 of {total} listings. Use filters to narrow results.
          </p>
        )}
      </div>
    </div>
  );
}
