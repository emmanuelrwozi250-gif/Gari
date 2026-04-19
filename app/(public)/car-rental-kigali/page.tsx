import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { CheckCircle, MapPin, Star, Shield, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Car Rental in Kigali, Rwanda — From RWF 35,000/day · Gari',
  description:
    'Book a verified car in Kigali from RWF 35,000/day. Economy, SUV, executive and minibus rentals. Pay with MTN MoMo. Self-drive or with a driver. Instant confirmation.',
  keywords: ['car rental Kigali', 'rent a car Kigali', 'Kigali car hire', 'voiture location Kigali', 'gari rental Rwanda'],
  openGraph: {
    title: 'Car Rental Kigali — Gari',
    description: 'Verified cars in Kigali from RWF 35,000/day. MTN MoMo payment. Instant booking.',
    type: 'website',
  },
};

const KIGALI_DISTRICTS = ['gasabo', 'kicukiro', 'nyarugenge'];

async function getKigaliCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, district: { in: KIGALI_DISTRICTS } },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch {
    return [];
  }
}

function demoToCard(c: (typeof DEMO_RENTAL_CARS)[number]) {
  return {
    id: c.id,
    make: c.make,
    model: c.model,
    year: c.year,
    type: c.type,
    listingType: c.listingType,
    seats: c.seats,
    fuel: c.fuel,
    pricePerDay: c.pricePerDay,
    driverAvailable: c.drivingOption !== 'Self-Drive',
    photos: c.images,
    district: c.district,
    isVerified: c.hostVerified,
    rating: c.rating,
    totalTrips: c.reviewCount,
    hasAC: c.features.includes('Air Conditioning'),
    host: { name: c.hostName, avatar: c.hostAvatar },
  };
}

const FAQ = [
  {
    q: 'How much does it cost to rent a car in Kigali?',
    a: 'Car rental in Kigali starts from RWF 35,000 per day for an economy car. SUVs typically cost RWF 70,000–100,000/day. Prices include standard insurance. Add a driver for RWF 12,000–25,000/day extra.',
  },
  {
    q: 'Can I pay with MTN MoMo for a car rental in Kigali?',
    a: 'Yes — Gari supports MTN MoMo, Airtel Money, and card payments. Pay instantly when you book. No cash transactions required.',
  },
  {
    q: 'Do I need a driver\'s licence to rent a car in Kigali?',
    a: 'Yes, a valid driver\'s licence is required for self-drive rentals. International licences are accepted. Alternatively, you can add a verified local driver to your booking.',
  },
  {
    q: 'Can I get a car delivered to Kigali International Airport (KIA)?',
    a: 'Many Gari hosts offer airport pickup at KIA. Select "Kigali Airport (KIA)" as your pickup location when booking, and the host will meet you at arrivals.',
  },
  {
    q: 'Are the cars on Gari insured?',
    a: 'All verified Gari listings include basic third-party insurance. You can add Gari Protect (comprehensive cover up to RWF 2,000,000) during booking for RWF 5,000/day.',
  },
];

export default async function CarRentalKigaliPage() {
  const dbCars = await getKigaliCars();
  const cars: any[] = dbCars.length > 0
    ? dbCars
    : DEMO_RENTAL_CARS
        .filter(c => KIGALI_DISTRICTS.includes(c.district))
        .slice(0, 9)
        .map(demoToCard);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — Car Rental Kigali',
    description: 'Rwanda\'s leading car rental marketplace. Verified cars across all Kigali districts.',
    url: 'https://gari-nu.vercel.app/car-rental-kigali',
    telephone: '+250788123000',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kigali',
      addressCountry: 'RW',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -1.9441, longitude: 30.0619 },
    priceRange: 'RWF 35,000 – RWF 400,000 per day',
    openingHours: 'Mo-Su 06:00-22:00',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        {/* Hero */}
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=60"
              alt="Car rental Kigali"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <MapPin className="w-4 h-4 text-accent-yellow" /> Kigali, Rwanda
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Car Rental in Kigali<br />
              <span className="text-accent-yellow">From RWF 35,000/day</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Verified cars across Gasabo, Kicukiro, and Nyarugenge. Pay with MTN MoMo or card.
              Self-drive or with a professional driver.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?district=gasabo" className="btn-primary px-8 py-3 text-base font-bold">
                Browse Kigali Cars
              </Link>
              <Link href="/search?district=gasabo&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
                With Driver
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-white dark:bg-gray-900 border-b border-border py-5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon: Shield, label: 'NIDA-verified hosts' },
                { icon: CheckCircle, label: 'Inspected & insured' },
                { icon: Star, label: '4.8★ average rating' },
                { icon: Phone, label: '24/7 WhatsApp support' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cars */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">
                Available in Kigali
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                {cars.length}+ verified cars · Instant booking available
              </p>
            </div>
            <Link href="/search?district=gasabo" className="text-sm text-primary font-semibold hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car: any) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>

        {/* Districts */}
        <section className="max-w-5xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Browse by District</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'gasabo',     name: 'Gasabo',     desc: 'Kigali CBD, Remera, Kimironko, Gisozi' },
              { id: 'kicukiro',   name: 'Kicukiro',   desc: 'Gikondo, Niboye, Nyarugunga, Kanombe' },
              { id: 'nyarugenge', name: 'Nyarugenge',  desc: 'City centre, Nyamirambo, Biryogo' },
            ].map(d => (
              <Link key={d.id} href={`/search?district=${d.id}`}
                className="card p-5 hover:border-primary hover:shadow-md transition-all group">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-bold text-text-primary dark:text-white group-hover:text-primary transition-colors">{d.name}</span>
                </div>
                <p className="text-xs text-text-secondary">{d.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
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
