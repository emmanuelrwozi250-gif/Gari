'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import { useRecentlyViewed, type RecentlyViewedCar } from '@/hooks/useRecentlyViewed';
import { formatRWF } from '@/lib/utils';

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=60';

interface Props {
  /** Current car to record on mount */
  currentCar: RecentlyViewedCar;
}

export function RecentlyViewedCars({ currentCar }: Props) {
  const { viewed, addViewed } = useRecentlyViewed();

  // Record the current car on first render
  useEffect(() => {
    addViewed(currentCar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCar.id]);

  // Show all viewed cars except the one currently being viewed
  const others = viewed.filter(c => c.id !== currentCar.id);
  if (others.length === 0) return null;

  return (
    <section className="mt-10 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-light" />
        <h2 className="text-base font-bold text-text-primary dark:text-white">Recently Viewed</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {others.map(car => (
          <Link
            key={car.id}
            href={`/cars/${car.id}`}
            className="flex-shrink-0 w-44 card overflow-hidden hover:shadow-md transition-shadow group block"
          >
            <div className="relative h-28 overflow-hidden">
              <Image
                src={car.photos?.[0] ?? FALLBACK}
                alt={`${car.make} ${car.model}`}
                fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="176px"
                quality={60}
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
              />
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-text-primary dark:text-white truncate">
                {car.year} {car.make} {car.model}
              </p>
              <p className="text-primary text-xs font-semibold mt-0.5">{formatRWF(car.pricePerDay)}<span className="text-text-light font-normal">/day</span></p>
              {car.rating != null && car.rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5 text-xs text-accent-yellow font-semibold">
                  <Star className="w-3 h-3 fill-accent-yellow" /> {car.rating.toFixed(1)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
