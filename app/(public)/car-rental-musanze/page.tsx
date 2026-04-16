import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { MapPin, Star, Shield, Mountain, CheckCircle, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Car Rental Musanze (Ruhengeri), Rwanda — From RWF 50,000/day · Gari',
  description:
    'Rent a car in Musanze (Ruhengeri) for gorilla trekking at Volcanoes National Park. Economy & 4x4 from RWF 50,000/day. Local drivers familiar with national park routes.',
  keywords: ['car rental Musanze', 'car hire Ruhengeri', 'Musanze car rental', 'Volcanoes National Park car', 'gorilla trekking car Rwanda', 'rent car Musanze'],
  openGraph: {
    title: 'Car Rental Musanze — Gari',
    description: 'Verified cars in Musanze for gorilla trekking. From RWF 50,000/day.',
    type: 'website',
  },
};

function demoToCard(c: (typeof DEMO_RENTAL_CARS)[number]) {
  return {
    id: c.id, make: c.make, model: c.model, year: c.year, type: c.type,
    listingType: c.listingType, seats: c.seats, fuel: c.fuel,
    pricePerDay: c.pricePerDay, driverAvailable: c.drivingOption !== 'Self-Drive',
    photos: c.images, district: c.district, isVerified: c.hostVerified,
    rating: c.rating, totalTrips: c.reviewCount, hasAC: c.features.includes('Air Conditioning'),
    host: { name: c.hostName, avatar: c.hostAvatar },
  };
}

async function getMusanzeCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, district: 'musanze' },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch { return []; }
}

const NEARBY = [
  { name: 'Volcanoes National Park', km: '12 km', desc: 'Gorilla & golden monkey trekking.' },
  { name: 'Musanze Caves', km: '4 km', desc: '2km of volcanic caves, bats, and twin lakes.' },
  { name: 'Dian Fossey\'s Tomb', km: '18 km', desc: 'Hike to the grave of the famous primatologist.' },
  { name: 'Lake Burera & Ruhondo', km: '25 km', desc: 'Twin volcanic lakes with stunning scenery.' },
];

const FAQ = [
  { q: 'Can I hire a car in Musanze for gorilla trekking?', a: 'Yes, Gari has verified cars and local drivers in Musanze who know the routes to Volcanoes National Park. Book at least 48 hours ahead for gorilla trekking days.' },
  { q: 'Is a 4x4 necessary for Volcanoes National Park?', a: 'The tarmac road to the park gate is accessible in any car. Inside the park and for some trailheads, a 4x4 or high-clearance vehicle is recommended, especially in the rainy season (Mar–May, Oct–Nov).' },
  { q: 'Can I get a car from Kigali to Musanze?', a: 'Many Kigali-based Gari hosts offer one-way or round-trip drops to Musanze (approx. 110 km, 2.5 hrs). Request this in the booking notes or contact the host on WhatsApp.' },
  { q: 'Do local Musanze drivers know the national park routes?', a: 'Yes, many Gari hosts in Musanze are experienced guides and drivers who have worked with national park visitors for years. Select "With Driver" when filtering.' },
];

export default async function CarRentalMusanzePage() {
  const dbCars = await getMusanzeCars();
  const cars: ReturnType<typeof demoToCard>[] =
    dbCars.length > 0 ? (dbCars as unknown as ReturnType<typeof demoToCard>[]) :
    // Use SUVs from any district as demo fallback (no Musanze district in demo data)
    DEMO_RENTAL_CARS.filter(c => ['SUV / 4x4', 'Sedan'].includes(c.type)).slice(0, 6).map(demoToCard);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — Car Rental Musanze',
    description: 'Car rental in Musanze (Ruhengeri) for gorilla trekking and Volcanoes National Park.',
    url: 'https://gari-nu.vercel.app/car-rental-musanze',
    address: { '@type': 'PostalAddress', addressLocality: 'Musanze', addressCountry: 'RW' },
    priceRange: 'RWF 50,000 – RWF 150,000 per day',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <Image src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=60" alt="Car rental Musanze Rwanda" fill className="object-cover" priority sizes="100vw" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Mountain className="w-4 h-4 text-accent-yellow" /> Musanze (Ruhengeri), Northern Rwanda
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Car Rental in Musanze<br />
              <span className="text-accent-yellow">Gorilla Trekking Ready</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Verified cars in Musanze for Volcanoes National Park, gorilla trekking, and Northern Rwanda exploration. Local drivers who know every trail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?district=musanze" className="btn-primary px-8 py-3 text-base font-bold">Browse Musanze Cars</Link>
              <Link href="/search?district=musanze&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
                With Local Driver
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 border-b border-border py-5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon: Mountain, label: 'Volcanoes NP access' },
                { icon: CheckCircle, label: 'Local park guides' },
                { icon: Star, label: '4.8★ average rating' },
                { icon: Shield, label: 'NIDA-verified hosts' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nearby attractions */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Nearby Attractions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NEARBY.map(n => (
              <div key={n.name} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="font-bold text-text-primary dark:text-white text-sm">{n.name}</span>
                </div>
                <div className="text-xs text-primary font-medium mb-1">{n.km} from Musanze</div>
                <p className="text-xs text-text-secondary">{n.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Cars in Musanze</h2>
              <p className="text-text-secondary text-sm mt-1">{cars.length}+ verified cars · Instant booking</p>
            </div>
            <Link href="/search?type=SUV_4X4" className="text-sm text-primary font-semibold hover:underline">View 4x4s →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car: ReturnType<typeof demoToCard>) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <h3 className="font-bold text-text-primary dark:text-white text-sm mb-2">{q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
