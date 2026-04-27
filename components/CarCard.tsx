import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Users, Fuel, BadgeCheck, Zap, Award } from 'lucide-react';
import { formatRWF, toUSD, getCarTypeLabel, getFuelLabel } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { FallbackImage } from './FallbackImage';

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
  pickupDate?: string;
  returnDate?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function CarCard({ car, compact = false, pickupDate, returnDate }: CarCardProps) {
  const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
  const rawPhoto = car.photos[0] || FALLBACK_IMAGE;
  const imgSrc = rawPhoto.startsWith('http') ? rawPhoto : FALLBACK_IMAGE;
  const isSuperhost = !!car.host?.superhostSince;

  const tripDays = (pickupDate && returnDate)
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86400000))
    : null;
  const tripTotal = tripDays ? car.pricePerDay * tripDays : null;

  return (
    <Link href={`/cars/${car.slug ?? car.id}`} className="card block group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Photo */}
      <div className={`relative overflow-hidden ${compact ? 'h-40' : 'h-52'}`}>
        <FallbackImage
          src={imgSrc}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 400px"
          quality={60}
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

        {/* Badges top-right: listing type + superhost */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {car.listingType === 'P2P' ? (
            <span className="badge bg-blue-500/90 text-white text-xs backdrop-blur-sm">P2P</span>
          ) : (
            <span className="badge bg-purple-500/90 text-white text-xs backdrop-blur-sm">Fleet</span>
          )}
          {isSuperhost && (
            <span className="badge bg-amber-400/90 text-amber-900 text-xs backdrop-blur-sm font-bold">
              ⭐ Superhost
            </span>
          )}
        </div>

        {/* Price bottom-left */}
        <div className="absolute bottom-3 left-3">
          {tripTotal ? (
            <>
              <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-primary font-bold text-sm px-2.5 py-1 rounded-lg shadow">
                {formatRWF(tripTotal)}<span className="text-text-light font-normal text-xs"> total</span>
              </span>
              <span className="block text-[10px] text-white/80 mt-0.5 pl-0.5">{formatRWF(car.pricePerDay)}/day · {tripDays}d</span>
            </>
          ) : (
            <>
              <span className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-primary font-bold text-sm px-2.5 py-1 rounded-lg shadow">
                {formatRWF(car.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span>
              </span>
              <span className="block text-[10px] text-white/80 mt-0.5 pl-0.5">{toUSD(car.pricePerDay)}</span>
            </>
          )}
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

        {/* Rwanda context tags */}
        {(() => {
          const tags: string[] = [];
          if (car.type === 'SUV_4X4' && car.district === 'MUSANZE') tags.push('🦍 Gorilla Trek');
          if (car.district === 'KAYONZA') tags.push('🐘 Akagera');
          if (car.type === 'LUXURY') tags.push('💼 Business Class');
          if (car.pricePerDay <= 35000) tags.push('💚 Best Value');
          if (tags.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light px-1.5 py-0.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          );
        })()}

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
            {(() => {
              const av = car.host.avatar;
              const isReal = av &&
                !av.includes('pravatar') &&
                !av.includes('placeholder') &&
                !av.includes('picsum');
              const initials = car.host.name
                ?.trim().split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
                || '?';
              const COLOURS = [
                'bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
                'bg-violet-100 text-violet-700','bg-amber-100 text-amber-700',
                'bg-rose-100 text-rose-700','bg-cyan-100 text-cyan-700',
              ];
              const colour = COLOURS[(car.host.name?.charCodeAt(0) ?? 0) % COLOURS.length];
              return isReal ? (
                <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={av!} alt={car.host.name || ''} fill className="object-cover" sizes="20px" />
                </div>
              ) : (
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${colour}`}>
                  {initials}
                </div>
              );
            })()}
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
