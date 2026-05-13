'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CarCard, CarCardSkeleton } from '@/components/CarCard';

interface RecommendedCar {
  id: string;
  slug?: string | null;
  make: string;
  model: string;
  year: number;
  type: string;
  listingType: string;
  seats: number;
  fuel: string;
  pricePerDay: number;
  driverAvailable: boolean;
  driverMandatory?: boolean;
  driverPricePerDay?: number | null;
  photos: string[];
  district: string;
  isVerified: boolean;
  isFeatured?: boolean;
  instantBooking?: boolean;
  gpsVerified?: boolean;
  rating: number;
  totalTrips: number;
  hasAC?: boolean;
  host?: {
    name?: string | null;
    avatar?: string | null;
    superhostSince?: Date | string | null;
  };
}

interface Props {
  /** Title shown above the section. Defaults to "Recommended for You". */
  title?: string;
  /** Max number of cards to show. Defaults to 4. */
  limit?: number;
}

export function RecommendedCars({ title = 'Recommended for You', limit = 4 }: Props) {
  const [cars, setCars] = useState<RecommendedCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations')
      .then((r) => r.json())
      .then((data: { cars: RecommendedCar[] }) => {
        setCars((data.cars ?? []).slice(0, limit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  if (!loading && cars.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-text-primary dark:text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: limit }).map((_, i) => <CarCardSkeleton key={i} />)
          : cars.map((car) => <CarCard key={car.id} car={car} />)}
      </div>
    </section>
  );
}
