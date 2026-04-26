import Link from 'next/link';
import { Car, Star, MapPin } from 'lucide-react';
import { FallbackImage } from '@/components/FallbackImage';
import { prisma } from '@/lib/prisma';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { formatRWF } from '@/lib/utils';

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=60';

async function getTopCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 3,
      select: {
        id: true, make: true, model: true, year: true,
        pricePerDay: true, district: true, rating: true, photos: true,
      },
    });
    if (cars.length > 0) return cars;
  } catch { /* fall through */ }
  return DEMO_RENTAL_CARS.slice(0, 3).map(c => ({
    id: c.id, make: c.make, model: c.model, year: c.year,
    pricePerDay: c.pricePerDay, district: c.district, rating: c.rating,
    photos: c.images,
  }));
}

export default async function NotFound() {
  const topCars = await getTopCars();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-16 pb-12">
      <div className="max-w-3xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Car className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-text-primary dark:text-white">
            Gar<span className="text-accent-yellow">i</span>
          </span>
        </div>

        {/* 404 number */}
        <div className="text-8xl md:text-9xl font-extrabold text-primary mb-2 leading-none">404</div>

        {/* Car SVG illustration */}
        <svg viewBox="0 0 200 80" className="w-48 h-20 my-6 text-gray-200 dark:text-gray-700 mx-auto" fill="currentColor">
          <rect x="20" y="35" width="160" height="30" rx="8" />
          <rect x="45" y="20" width="90" height="25" rx="6" />
          <rect x="52" y="24" width="35" height="16" rx="3" fill="white" opacity="0.6" />
          <rect x="95" y="24" width="35" height="16" rx="3" fill="white" opacity="0.6" />
          <circle cx="55" cy="65" r="14" fill="#1a7a4a" />
          <circle cx="55" cy="65" r="8" fill="white" opacity="0.3" />
          <circle cx="145" cy="65" r="14" fill="#1a7a4a" />
          <circle cx="145" cy="65" r="8" fill="white" opacity="0.3" />
          <rect x="170" y="38" width="12" height="8" rx="2" fill="#f5c518" />
          <rect x="18" y="38" width="12" height="8" rx="2" fill="#ef4444" />
        </svg>

        <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
          This road doesn&apos;t exist.
        </h1>
        <p className="text-text-secondary mb-8">Let&apos;s get you back on track.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="btn-primary px-8 py-3 font-bold">
            Browse Cars →
          </Link>
          <Link href="/" className="btn-secondary px-8 py-3 font-bold">
            Go Home
          </Link>
        </div>

        {/* Featured cars */}
        {topCars.length > 0 && (
          <div className="mt-14 text-left">
            <h2 className="text-lg font-bold text-text-primary dark:text-white text-center mb-6">
              While you&apos;re here, check out these cars
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {topCars.map(car => (
                <Link
                  key={car.id}
                  href={`/cars/${car.id}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow group block"
                >
                  <div className="relative h-36 overflow-hidden">
                    <FallbackImage
                      src={car.photos?.[0] ?? FALLBACK}
                      fallback={FALLBACK}
                      alt={`${car.make} ${car.model}`}
                      fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) calc(100vw - 32px), 280px"
                      quality={60}
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-text-primary dark:text-white text-sm truncate">
                      {car.year} {car.make} {car.model}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-primary font-bold text-sm">
                        {formatRWF(car.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span>
                      </span>
                      {car.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-accent-yellow font-semibold">
                          <Star className="w-3 h-3 fill-accent-yellow" /> {car.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-light flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {car.district}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
