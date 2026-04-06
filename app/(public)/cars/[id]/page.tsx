import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BookingCard } from '@/components/BookingCard';
import { PhotoGallery } from '@/components/PhotoGallery';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { formatRWF, getCarTypeLabel, getTransmissionLabel, getFuelLabel, formatDate } from '@/lib/utils';
import Image from 'next/image';
import {
  Star, MapPin, Users, Fuel, Settings, Calendar, BadgeCheck, Shield,
  Zap, Car, Navigation, ArrowLeft, CheckCircle, Award,
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView').then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="skeleton h-64 rounded-xl" />,
});

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const car = await prisma.car.findUnique({
      where: { id: params.id },
      select: { make: true, model: true, year: true, district: true },
    });
    if (!car) return { title: 'Car Not Found' };
    const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
    return {
      title: `${car.year} ${car.make} ${car.model} in ${district?.name || car.district} — Gari`,
      description: `Rent a ${car.year} ${car.make} ${car.model} in ${district?.name}, Rwanda. Book now on Gari.`,
    };
  } catch {
    return { title: 'Car Details — Gari' };
  }
}

export default async function CarDetailPage({ params }: Props) {
  const car = await prisma.car.findUnique({
    where: { id: params.id },
    include: {
      host: {
        select: {
          id: true, name: true, avatar: true, createdAt: true,
          nidaVerified: true, responseRate: true, avgResponseHours: true,
          superhostSince: true, totalHostTrips: true,
        },
      },
      reviews: {
        include: { reviewer: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!car) notFound();

  const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
  const mapCenter: [number, number] = [
    car.lat || district?.lat || -1.9441,
    car.lng || district?.lng || 30.0619,
  ];

  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: car.reviews.filter(r => r.rating === stars).length,
    pct: car.reviews.length > 0
      ? Math.round((car.reviews.filter(r => r.rating === stars).length / car.reviews.length) * 100)
      : 0,
  }));

  const specs = [
    { icon: Settings, label: 'Transmission', value: getTransmissionLabel(car.transmission) },
    { icon: Fuel, label: 'Fuel', value: getFuelLabel(car.fuel) },
    { icon: Users, label: 'Seats', value: `${car.seats} passengers` },
    { icon: Calendar, label: 'Year', value: String(car.year) },
    { icon: Car, label: 'Type', value: getCarTypeLabel(car.type) },
    { icon: MapPin, label: 'Location', value: district?.name || car.district },
  ];

  // JSON-LD structured data for Google rich results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${car.year} ${car.make} ${car.model}`,
    description: car.description,
    image: car.photos,
    brand: { '@type': 'Brand', name: car.make },
    offers: {
      '@type': 'Offer',
      price: car.pricePerDay,
      priceCurrency: 'RWF',
      availability: car.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Person', name: car.host.name },
    },
    aggregateRating: car.rating > 0 && car.totalTrips > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: car.rating.toFixed(1),
      reviewCount: car.reviews.length,
      bestRating: 5,
    } : undefined,
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/search" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to search
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left / Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <PhotoGallery photos={car.photos} carName={`${car.make} ${car.model}`} />

            {/* Title + Badges */}
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-4 h-4 text-text-light" />
                      <span className="text-text-secondary">{district?.name || car.district}{district ? `, ${district.province}` : ''}</span>
                    </div>
                    {car.exactLocation && (
                      <span className="text-text-light text-sm">• {car.exactLocation}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-accent-yellow text-accent-yellow" />
                    <span className="font-bold text-lg">{car.rating > 0 ? car.rating.toFixed(1) : 'New'}</span>
                    <span className="text-text-secondary text-sm">({car.totalTrips} trips)</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${car.listingType === 'P2P' ? 'badge-blue' : 'bg-purple-100 text-purple-700'}`}>
                  {car.listingType === 'P2P' ? 'Peer-to-Peer' : 'Professional Fleet'}
                </span>
                <span className="badge bg-gray-100 dark:bg-gray-800 text-text-secondary">
                  {getCarTypeLabel(car.type)}
                </span>
                {car.isVerified && (
                  <span className="badge-green">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {car.instantBooking && (
                  <span className="badge bg-yellow-50 text-yellow-700">
                    <Zap className="w-3 h-3" /> Instant Book
                  </span>
                )}
                {car.driverAvailable && (
                  <span className="badge bg-blue-50 text-blue-700">
                    <Users className="w-3 h-3" /> Driver Available
                  </span>
                )}
              </div>
            </div>

            {/* Specs Grid */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specs.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-text-light">{label}</div>
                      <div className="font-semibold text-sm text-text-primary dark:text-white">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features */}
              {car.features.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-sm mb-2 text-text-primary dark:text-white">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map(f => (
                      <span key={f} className="flex items-center gap-1 px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-3 text-text-primary dark:text-white">About this car</h2>
              <p className="text-text-secondary dark:text-gray-400 leading-relaxed">{car.description}</p>
            </div>

            {/* Rules */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Rental Rules</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary dark:text-white">Mileage</div>
                    <div className="text-text-secondary">{car.mileageLimit ? `${car.mileageLimit.toLocaleString()} km/day` : 'Unlimited'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Fuel className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary dark:text-white">Fuel Policy</div>
                    <div className="text-text-secondary">{car.fuelPolicy || 'Return full'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-text-primary dark:text-white">Smoking</div>
                    <div className="text-text-secondary">{car.smokingAllowed ? 'Allowed' : 'Not allowed'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-text-primary dark:text-white">Pickup Location</h2>
                <a
                  href={`https://www.google.com/maps?q=${mapCenter[0]},${mapCenter[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  <Navigation className="w-4 h-4" /> Navigate
                </a>
              </div>
              <p className="text-text-secondary text-sm mb-3">
                {car.exactLocation || district?.name || 'Location will be shared after booking'}
              </p>
              <MapView
                center={mapCenter}
                zoom={14}
                markers={[{
                  lat: mapCenter[0], lng: mapCenter[1],
                  label: `${car.make} ${car.model}`,
                  type: 'car', carId: car.id,
                  photo: car.photos[0], price: car.pricePerDay,
                }]}
                height="300px"
              />
            </div>

            {/* Host Card */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Meet Your Host</h2>
              <div className="flex items-start gap-4">
                {car.host.avatar ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={car.host.avatar} alt={car.host.name || ''} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                    {car.host.name?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary dark:text-white">{car.host.name}</span>
                    {(car.host as any).superhostSince && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        <Award className="w-3 h-3" /> Superhost
                      </span>
                    )}
                  </div>
                  <div className="text-text-secondary text-sm">Host since {formatDate(car.host.createdAt)}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
                    {car.host.nidaVerified && (
                      <span className="flex items-center gap-1 text-primary">
                        <BadgeCheck className="w-3.5 h-3.5" /> NIDA Verified
                      </span>
                    )}
                    <span>Response rate: {(car.host as any).responseRate ?? 100}%</span>
                    <span>Responds in ~{(car.host as any).avgResponseHours ?? 2}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {car.reviews.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-bold text-lg text-text-primary dark:text-white">Reviews</h2>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                    <span className="font-bold">{car.rating.toFixed(1)}</span>
                    <span className="text-text-secondary text-sm">({car.reviews.length})</span>
                  </div>
                </div>

                {/* Rating breakdown */}
                <div className="space-y-2 mb-6">
                  {ratingBreakdown.map(({ stars, count, pct }) => (
                    <div key={stars} className="flex items-center gap-2 text-sm">
                      <span className="text-text-secondary w-4">{stars}</span>
                      <Star className="w-3 h-3 fill-accent-yellow text-accent-yellow" />
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-yellow rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-text-light w-6 text-xs">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {car.reviews.map(review => (
                    <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        {review.reviewer.avatar ? (
                          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={review.reviewer.avatar} alt="" fill className="object-cover" sizes="36px" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {review.reviewer.name?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-text-primary dark:text-white">{review.reviewer.name}</div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-accent-yellow text-accent-yellow" />
                            ))}
                            <span className="text-xs text-text-light ml-1">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm pl-12">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <BookingCard car={{
              id: car.id,
              pricePerDay: car.pricePerDay,
              driverAvailable: car.driverAvailable,
              driverPricePerDay: car.driverPricePerDay,
              instantBooking: car.instantBooking,
              isAvailable: car.isAvailable,
            }} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
