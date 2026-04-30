import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Mountain, MapPin, Star, Users, CheckCircle, ArrowRight, Zap, Clock, AlertTriangle } from 'lucide-react';
import { formatRWF, toUSD, getCarTypeLabel, getFuelLabel } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Safari & Adventure Cars in Rwanda · Gari',
  description: 'Rent 4WD SUVs and pickups for gorilla trekking, Akagera safaris, Nyungwe forest drives, and Lake Kivu tours. Verified vehicles with optional guides.',
};

const DESTINATIONS = [
  {
    name: 'Volcanoes National Park',
    tagline: 'Gorilla Trekking',
    district: 'musanze',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80',
    duration: '2–3 hrs from Kigali',
    highlight: 'Home to mountain gorillas',
    color: 'from-emerald-900/80',
  },
  {
    name: 'Akagera National Park',
    tagline: 'Big 5 Safari',
    district: 'kayonza',
    image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=800&q=80',
    duration: '2.5 hrs from Kigali',
    highlight: 'Lions, elephants & hippos',
    color: 'from-amber-900/80',
  },
  {
    name: 'Nyungwe Forest',
    tagline: 'Canopy & Chimpanzees',
    district: 'nyamasheke',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    duration: '5 hrs from Kigali',
    highlight: "Africa's largest montane forest",
    color: 'from-green-900/80',
  },
  {
    name: 'Lake Kivu',
    tagline: 'Scenic Drive',
    district: 'rubavu',
    image: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=800&q=80',
    duration: '2.5 hrs from Kigali',
    highlight: 'Beaches, islands & sundowners',
    color: 'from-blue-900/80',
  },
];

const SAFARI_TIPS = [
  { icon: '🛣️', title: 'Rwanda roads', body: 'Most park routes require a 4WD or high-clearance vehicle, especially during rainy season (Mar–May, Oct–Nov).' },
  { icon: '⛽', title: 'Fuel up in town', body: 'Fill up before leaving Kigali or the nearest large town — petrol stations are scarce near national parks.' },
  { icon: '🧑‍✈️', title: 'Add a driver', body: 'Many hosts offer certified safari drivers who know park entry points, ranger contacts, and best wildlife spots.' },
  { icon: '📋', title: 'Park permits', body: 'Gorilla trekking permits ($1,500 USD) must be pre-booked via Rwanda Development Board. Your host can assist.' },
];

const POPULAR_ROUTES = [
  {
    from: 'Kigali',
    to: 'Volcanoes NP (Kinigi)',
    time: '2.5 hrs',
    conditions: 'Paved then rough mountain road',
    conditionIcon: '⚠️',
    recommendedCar: 'Prado / RAV4 4WD',
    district: 'musanze',
  },
  {
    from: 'Kigali',
    to: 'Akagera NP',
    time: '2.5 hrs',
    conditions: 'Paved highway, dirt tracks inside park',
    conditionIcon: '🛣️',
    recommendedCar: 'Land Cruiser / Hilux',
    district: 'kayonza',
  },
  {
    from: 'Kigali',
    to: 'Nyungwe Forest',
    time: '5 hrs',
    conditions: 'Long paved highway, steep mountain sections',
    conditionIcon: '🏔️',
    recommendedCar: 'Prado / SUV with driver',
    district: 'nyamasheke',
  },
  {
    from: 'Kigali',
    to: 'Lake Kivu (Rubavu)',
    time: '2.5 hrs',
    conditions: 'Scenic mountain road — fully paved',
    conditionIcon: '✅',
    recommendedCar: 'Any SUV',
    district: 'rubavu',
  },
];

async function getSafariCars() {
  try {
    const dbCars = await prisma.car.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        type: { in: ['SUV_4X4', 'PICKUP', 'LUXURY', 'EXECUTIVE'] },
        fuel: { not: 'ELECTRIC' },
      },
      include: { host: { select: { name: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 6,
    });
    if (dbCars.length > 0) return dbCars;
  } catch {
    // DB unavailable — return empty, UI shows empty state
  }
  return [];
}

export default async function SafariPage() {
  const safariCars = await getSafariCars();

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[380px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1600&q=80"
          alt="Rwanda safari landscape"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white text-sm font-medium mb-4">
            <Mountain className="w-4 h-4" />
            Rwanda Adventure Rentals
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Go <span className="text-accent-yellow">Off-Road</span> in Rwanda
          </h1>
          <p className="text-lg text-white/80 max-w-xl mb-8">
            4WD SUVs and pickups for gorilla trekking, Akagera safaris, and highland adventures. All verified. Driver optional.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="#vehicles" className="btn-primary px-8 py-3 text-base">
              Browse Safari Vehicles
            </Link>
            <Link href="/search?type=suv-4x4&driver=true" className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
              With Driver <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why 4WD */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAFARI_TIPS.map(tip => (
            <div key={tip.title} className="card p-5">
              <div className="text-2xl mb-3">{tip.icon}</div>
              <h3 className="font-bold text-text-primary dark:text-white mb-1.5 text-sm">{tip.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Popular Destinations</h2>
          <p className="text-text-secondary mt-1 text-sm">Filter cars by your destination district with one click</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DESTINATIONS.map(dest => (
            <Link
              key={dest.name}
              href={`/search?type=suv-4x4&district=${dest.district}`}
              className="group relative h-52 rounded-2xl overflow-hidden block"
            >
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 300px"
                quality={70}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${dest.color} to-transparent`} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-xs font-semibold text-white/70 mb-0.5">{dest.tagline}</div>
                <h3 className="font-bold text-white text-sm leading-tight">{dest.name}</h3>
                <div className="flex items-center gap-1 text-white/60 text-xs mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" /> {dest.duration}
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  Browse <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Routes — Section 8.2 */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Popular Safari Routes from Kigali</h2>
          <p className="text-text-secondary mt-1 text-sm">Drive times and road conditions at a glance</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {POPULAR_ROUTES.map(route => (
            <div key={route.to} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold text-text-light uppercase tracking-wide mb-0.5">
                    {route.from} →
                  </p>
                  <h3 className="font-bold text-text-primary dark:text-white">{route.to}</h3>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold bg-primary-light text-primary px-2.5 py-1 rounded-full flex-shrink-0">
                  <Clock className="w-3 h-3" /> {route.time}
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-3 flex items-center gap-1.5">
                <span>{route.conditionIcon}</span> {route.conditions}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-text-secondary px-2.5 py-1 rounded-full">
                  🚙 {route.recommendedCar}
                </span>
                <Link
                  href={`/search?district=${route.district}&type=suv-4x4`}
                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Find cars <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vehicle listings */}
      <section id="vehicles" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Safari Vehicles</h2>
            <p className="text-text-secondary mt-1 text-sm">All 4WD & high-clearance — ready for any terrain</p>
          </div>
          <Link href="/search?type=suv-4x4" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {safariCars.length === 0 && (
            <div className="col-span-3 text-center py-16 text-text-secondary">
              <p className="text-lg font-semibold mb-2">No safari vehicles listed yet</p>
              <Link href="/search?type=suv-4x4" className="text-primary underline text-sm">
                Browse all SUV &amp; 4x4 cars →
              </Link>
            </div>
          )}
          {safariCars.map((car: any) => {
            const photo = (car.photos ?? car.images)?.[0];
            const verified = car.isVerified ?? car.hostVerified ?? false;
            const hasDriver = car.driverAvailable ?? (car.drivingOption !== 'Self-Drive');
            const carRating = typeof car.rating === 'number' ? car.rating : 0;
            const reviewCt = car._count?.reviews ?? car.reviewCount ?? 0;
            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="card overflow-hidden group hover:shadow-lg transition-shadow block">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={photo || '/images/car-placeholder.svg'}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 380px"
                    quality={65}
                    unoptimized={!photo}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {verified && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </div>
                  )}
                  {hasDriver && (
                    <span className="absolute top-3 right-3 bg-purple-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      🧑‍✈️ Driver
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/95 dark:bg-gray-900/95 text-primary font-bold text-sm px-2.5 py-1 rounded-lg shadow">
                      {formatRWF(car.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span>
                    </span>
                    <span className="block text-[10px] text-white/80 mt-0.5 pl-0.5">{toUSD(car.pricePerDay)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-bold text-text-primary dark:text-white">{car.make} {car.model}</h3>
                      <p className="text-xs text-text-light">{car.year} · {getCarTypeLabel(car.type)}</p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-accent-yellow text-accent-yellow" />
                      <span className="text-xs font-semibold text-text-primary dark:text-white">
                        {carRating > 0 ? carRating.toFixed(1) : 'New'}
                      </span>
                      {reviewCt > 0 && <span className="text-xs text-text-light">({reviewCt})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-2">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {car.seats} seats</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {getFuelLabel(car.fuel)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {car.district ? car.district.charAt(0).toUpperCase() + car.district.slice(1).toLowerCase() : ''}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="relative rounded-2xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=1200&q=80"
            alt="Akagera National Park"
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1200px"
            quality={60}
          />
          <div className="relative z-10 bg-gradient-to-r from-black/70 to-black/30 p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Need help planning your safari?</h2>
            <p className="text-white/80 mb-6 max-w-lg">Our hosts know Rwanda inside out. Add a driver to your booking and get local expertise included.</p>
            <Link href="/search?type=suv-4x4&driver=true" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
              Find a 4WD with Driver <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
