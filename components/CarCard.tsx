'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Users, Fuel, BadgeCheck, Zap, Award } from 'lucide-react';
import { formatRWF, toUSD, getCarTypeLabel, getFuelLabel } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';

interface CarCardProps {
  car: {
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
    driverPricePerDay?: number | null;
    photos: string[];
    district: string;
    isVerified: boolean;
    instantBooking?: boolean;
    rating: number;
    totalTrips: number;
    hasAC?: boolean;
    host?: {
      name?: string | null;
      avatar?: string | null;
      superhostSince?: Date | string | null;
    };
  };
  compact?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function CarCard({ car, compact = false }: CarCardProps) {
  const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
  const rawPhoto = car.photos[0] || FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(rawPhoto.startsWith('http') ? rawPhoto : FALLBACK_IMAGE);
  const isSuperhost = !!car.host?.superhostSince;

  return (
    <Link href={`/cars/${car.slug ?? car.id}`} className="card block group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Photo */}
      <div className={`relative overflow-hidden ${compact ? 'h-40' : 'h-52'}`}>
        <Image
          src={imgSrc}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 400px"
          quality={60}
          onError={() => setImgSrc('/images/car-placeholder.svg')}
          unoptimized={imgSrc === '/images/car-placeholder.svg'}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {car.isVerified && (
            <span className="badge-green text-xs backdrop-blur-sm">
              <BadgeCheck className="w-3 h-3" /> Verified
            </span>
          )}
          {car.instantBooking && (
            <span className="badge bg-accent-yellow/90 text-gray-900 text-xs backdrop-blur-sm">
              <Zap className="w-3 h-3" /> Instant
            </span>
          )}
          {car.driverAvailable && (
            <span className="badge bg-purple-600/90 text-white text-xs backdrop-blur-sm">
              🧑‍✈️ Driver
            </span>
          )}
        </div>

        {/* Listing type badge top-right */}
        {car.listingType === 'P2P' ? (
          <span className="absolute top-3 right-3 badge bg-blue-500/90 text-white text-xs backdrop-blur-sm">P2P</span>
        ) : (
          <span className="absolute top-3 right-3 badge bg-purple-500/90 text-white text-xs backdrop-blur-sm">Fleet</span>
        )}

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-primary font-bold text-sm px-2.5 py-1 rounded-lg shadow">
            {formatRWF(car.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span>
          </span>
          <span className="block text-[10px] text-white/80 mt-0.5 pl-0.5">{toUSD(car.pricePerDay)}</span>
        </div>
      </div>

      {/* Content */}
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <h3 className="font-bold text-text-primary dark:text-white truncate">
              {car.make} {car.model}
            </h3>
            <p className="text-xs text-text-light">{car.year} · {getCarTypeLabel(car.type)}</p>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-accent-yellow text-accent-yellow" />
            <span className="text-xs font-semibold text-text-primary dark:text-white">
              {car.rating > 0 ? car.rating.toFixed(1) : 'New'}
            </span>
            {car.totalTrips > 0 && (
              <span className="text-xs text-text-light">({car.totalTrips})</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-text-secondary mb-2.5">
          <MapPin className="w-3 h-3 text-text-light flex-shrink-0" />
          <span className="truncate">{district?.name || car.district}{district ? `, ${district.province.replace(' Province', '')}` : ''}</span>
        </div>

        {/* Specs */}
        {!compact && (
          <div className="flex items-center gap-3 text-xs text-text-secondary mb-3 pb-3 border-b border-border">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {car.seats}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="w-3 h-3" /> {getFuelLabel(car.fuel)}
            </span>
            {car.hasAC && <span className="text-text-light">A/C</span>}
          </div>
        )}

        {/* Host row */}
        {car.host && (
          <div className="flex items-center gap-2">
            {car.host.avatar ? (
              <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={car.host.avatar}
                  alt={car.host.name || ''}
                  fill
                  className="object-cover"
                  sizes="20px"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
                {car.host.name?.[0] || '?'}
              </div>
            )}
            <span className="text-xs text-text-light truncate">{car.host.name?.split(' ')[0]}</span>
            {isSuperhost && (
              <span className="ml-auto flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Award className="w-3 h-3" /> Superhost
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-52 rounded-t-card rounded-b-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
