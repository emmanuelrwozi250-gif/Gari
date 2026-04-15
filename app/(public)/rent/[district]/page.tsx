import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Star, ArrowRight, ChevronRight, Car } from 'lucide-react';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { formatRWF, toUSD } from '@/lib/utils';

interface PageProps {
  params: Promise<{ district: string }>;
}

// Pre-render all 30 districts at build time
export function generateStaticParams() {
  return RWANDA_DISTRICTS.map(d => ({ district: d.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { district: districtId } = await params;
  const district = RWANDA_DISTRICTS.find(d => d.id === districtId);
  if (!district) return {};

  const title = `Car Rental in ${district.name}, Rwanda · Gari`;
  const description = `Rent a car in ${district.name} — economy cars, SUVs, minibuses and executive vehicles. Verified hosts. MTN MoMo & Airtel Money accepted. Instant booking available.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `/rent/${districtId}`,
    },
  };
}

const PROVINCE_BLURBS: Record<string, string> = {
  'Kigali City': 'the heart of Rwanda — perfect for business travel, airport transfers, and city exploration.',
  'Northern Province': 'Rwanda\'s north — gateway to Volcanoes National Park and gorilla trekking.',
  'Southern Province': 'the cultural heartland — home to Huye University, Nyungwe Forest, and Rwanda\'s history.',
  'Eastern Province': 'the savanna east — base for Akagera National Park safaris and Lake Muhazi.',
  'Western Province': 'the lakeside west — Lake Kivu, Nyungwe treks, and the Congo border crossing.',
};

export default async function DistrictRentalPage({ params }: PageProps) {
  const { district: districtId } = await params;
  const district = RWANDA_DISTRICTS.find(d => d.id === districtId);
  if (!district) notFound();

  const cars = DEMO_RENTAL_CARS.filter(c => c.district === districtId).slice(0, 6);
  const nearbyDistricts = RWANDA_DISTRICTS
    .filter(d => d.province === district.province && d.id !== districtId)
    .slice(0, 4);

  const avgPrice = cars.length
    ? Math.round(cars.reduce((s, c) => s + c.pricePerDay, 0) / cars.length)
    : 35000;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Gari Car Rental — ${district.name}`,
    description: `Car rental service in ${district.name}, ${district.province}, Rwanda`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: district.name,
      addressRegion: district.province,
      addressCountry: 'RW',
    },
    geo: { '@type': 'GeoCoordinates', latitude: district.lat, longitude: district.lng },
    url: `https://gari.rw/rent/${districtId}`,
    priceRange: `RWF ${formatRWF(avgPrice)}/day`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-gray-900 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-text-secondary flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
            <Link href="/search" className="hover:text-primary transition-colors">Rent a Car</Link>
            <ChevronRight className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
            <span className="text-text-primary dark:text-white font-medium">{district.name}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{district.province}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-white mb-3">
              Car Rental in <span className="text-primary">{district.name}</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl">
              Find and book verified cars in {district.name},{' '}
              {PROVINCE_BLURBS[district.province] || `${district.province}, Rwanda.`}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Car className="w-4 h-4 text-primary" />
                {cars.length > 0 ? `${cars.length}+ cars available` : 'Cars available nearby'}
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Star className="w-4 h-4 text-accent-yellow" />
                From {formatRWF(Math.min(...(cars.length ? cars.map(c => c.pricePerDay) : [25000])))} /day
              </span>
            </div>
          </div>

          {/* Car grid */}
          {cars.length > 0 ? (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">
                  Available Cars in {district.name}
                </h2>
                <Link
                  href={`/search?district=${districtId}`}
                  className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  See all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cars.map(car => (
                  <Link key={car.id} href={`/cars/${car.id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow block">
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={car.images[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80'}
                        alt={`${car.make} ${car.model} rental in ${district.name}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 380px"
                        quality={65}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-white/95 dark:bg-gray-900/95 text-primary font-bold text-sm px-2.5 py-1 rounded-lg shadow">
                          {formatRWF(car.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span>
                        </span>
                        <span className="block text-[10px] text-white/80 mt-0.5 pl-0.5">{toUSD(car.pricePerDay)}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-text-primary dark:text-white">{car.make} {car.model}</h3>
                      <p className="text-xs text-text-light mt-0.5">{car.year} · {car.type} · {car.transmission}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3.5 h-3.5 fill-accent-yellow text-accent-yellow" />
                        <span className="text-xs font-semibold text-text-primary dark:text-white">{car.rating.toFixed(1)}</span>
                        <span className="text-xs text-text-light">({car.reviewCount} trips)</span>
                        {car.drivingOption !== 'Self-Drive' && (
                          <span className="ml-auto text-xs text-primary font-medium">+ Driver available</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href={`/search?district=${districtId}`}
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3"
                >
                  Browse all cars in {district.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-10 text-center py-16 card">
              <Car className="w-10 h-10 text-text-light mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-text-primary dark:text-white mb-2">No cars listed in {district.name} yet</h2>
              <p className="text-text-secondary mb-4">Browse nearby districts or search all of Rwanda.</p>
              <Link href="/search" className="btn-primary inline-flex items-center gap-2">
                Search all Rwanda <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          )}

          {/* SEO content block */}
          <section className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">
              Renting a Car in {district.name}
            </h2>
            <div className="prose prose-sm text-text-secondary max-w-none space-y-3">
              <p>
                Gari connects you with verified private owners and professional fleet operators in {district.name},{' '}
                {district.province}. Whether you need a compact economy car for daily errands or a 4WD SUV for
                off-road adventures, you'll find the right vehicle at a fair price.
              </p>
              <p>
                All listings include the driver option at the host's rate, and payment is accepted via
                MTN Mobile Money, Airtel Money, or card. Prices in {district.name} start from around{' '}
                {formatRWF(Math.max(15000, avgPrice - 10000))} per day for economy vehicles.
              </p>
              <p>
                Need a car with a driver? Many hosts in {district.name} offer chauffeur services — ideal for
                corporate travel, airport transfers, and national park excursions.
              </p>
            </div>
          </section>

          {/* Nearby districts */}
          {nearbyDistricts.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">
                Nearby Districts in {district.province}
              </h2>
              <div className="flex flex-wrap gap-2">
                {nearbyDistricts.map(d => (
                  <Link
                    key={d.id}
                    href={`/rent/${d.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Car Rental in {d.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
