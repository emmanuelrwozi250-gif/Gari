import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { CheckCircle, MapPin, Star, Shield, Clock, Plane } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Car Rental Kigali International Airport (KIA) — Gari',
  description:
    'Book a car for Kigali Airport pickup from RWF 35,000/day. Meet & greet at KIA arrivals. Economy, SUV, executive. MTN MoMo payment. Instant confirmation.',
  keywords: ['car rental kigali airport', 'KIA car hire', 'airport car rental Rwanda', 'rent car KIA', 'Kigali International Airport car'],
  openGraph: {
    title: 'Kigali Airport Car Rental — Gari',
    description: 'Meet & greet at KIA arrivals. Cars from RWF 35,000/day. Instant booking.',
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

async function getAirportCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, district: { in: ['gasabo', 'kicukiro'] } },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch { return []; }
}

const FAQ = [
  { q: 'Can I get a car delivered to Kigali Airport (KIA)?', a: 'Yes. Many Gari hosts offer door-to-door airport pickup. Select "Kigali Airport (KIA)" as your pickup location when booking. The host will meet you at arrivals with your name on a sign.' },
  { q: 'What is the closest car rental to KIA?', a: 'Gari hosts in Kicukiro and Gasabo districts are nearest to KIA, typically 10–20 minutes from the terminal. Many offer in-terminal meetups.' },
  { q: 'How early should I book airport pickup?', a: 'We recommend booking at least 24 hours ahead. For instant-booking cars, same-day pickup is possible. The host will confirm pickup time once you book.' },
  { q: 'Is there a surcharge for airport pickup?', a: 'Some hosts charge a small convenience fee (RWF 5,000–15,000) for airport meet & greet. This is shown clearly before you confirm your booking.' },
  { q: 'Can I return the car to the airport?', a: 'Yes, most hosts offer airport drop-off. Add a note in the booking requesting airport return and the host will confirm arrangements.' },
];

export default async function CarRentalKigaliAirportPage() {
  const dbCars = await getAirportCars();
  const cars: ReturnType<typeof demoToCard>[] =
    dbCars.length > 0 ? (dbCars as unknown as ReturnType<typeof demoToCard>[]) :
    DEMO_RENTAL_CARS.filter(c => ['gasabo', 'kicukiro'].includes(c.district)).slice(0, 9).map(demoToCard);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — Car Rental Kigali Airport',
    description: 'Airport car rental with meet & greet at Kigali International Airport.',
    url: 'https://gari-nu.vercel.app/car-rental-kigali-airport',
    address: { '@type': 'PostalAddress', addressLocality: 'Kigali', addressCountry: 'RW' },
    priceRange: 'RWF 35,000 – RWF 400,000 per day',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        {/* Hero */}
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Image src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=60" alt="Kigali airport car rental" fill className="object-cover" priority sizes="100vw" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Plane className="w-4 h-4 text-accent-yellow" /> Kigali International Airport (KIA)
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Car Rental at Kigali Airport<br />
              <span className="text-accent-yellow">Meet &amp; Greet at Arrivals</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Book a verified car with airport pickup. Your host meets you at KIA arrivals — no queuing, no hassle. Self-drive or with a professional driver.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?district=kicukiro&pickup=kigali-airport" className="btn-primary px-8 py-3 text-base font-bold">Browse Airport Cars</Link>
              <Link href="/search?district=kicukiro&pickup=kigali-airport&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
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
                { icon: Plane, label: 'Airport meet & greet' },
                { icon: Clock, label: 'On-time guarantee' },
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

        {/* Cars */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Cars Near KIA</h2>
              <p className="text-text-secondary text-sm mt-1">{cars.length}+ cars offering airport pickup</p>
            </div>
            <Link href="/search?district=kicukiro" className="text-sm text-primary font-semibold hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car: ReturnType<typeof demoToCard>) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>

        {/* FAQ */}
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
