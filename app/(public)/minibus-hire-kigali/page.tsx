import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { Users, Star, Shield, CheckCircle, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Minibus Hire Kigali Rwanda — 14-Seater & Coaster · Gari',
  description:
    'Hire a minibus in Kigali from RWF 80,000/day. 14-seater Toyota Hiace, 30-seater Coaster. Corporate transfers, weddings, school trips, upcountry tours. Book with MTN MoMo.',
  keywords: ['minibus hire Kigali', 'coaster hire Rwanda', 'toyota hiace hire Kigali', 'group transport Rwanda', 'bus rental Kigali', 'shuttle hire Rwanda'],
  openGraph: {
    title: 'Minibus Hire Kigali — Gari',
    description: '14-seater Hiace and Coaster hire in Kigali. From RWF 80,000/day.',
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

async function getMinibusCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, type: 'MINIBUS' },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch { return []; }
}

const USE_CASES = [
  { title: 'Corporate Transfers', desc: 'Airport runs, hotel-to-meeting, team transport across Kigali.' },
  { title: 'Wedding Transport', desc: 'Guest shuttles from Kigali hotels to venues. Decorated on request.' },
  { title: 'School Trips', desc: 'Safe, driver-operated transport for school excursions.' },
  { title: 'Church Groups', desc: 'Sunday service and event transport for congregations.' },
  { title: 'Upcountry Tours', desc: 'Musanze, Gisenyi, Butare — day trips and overnight tours.' },
  { title: 'Airport Shuttles', desc: 'Group pickups and drop-offs at KIA for delegations and families.' },
];

const FAQ = [
  { q: 'How much does it cost to hire a minibus in Kigali?', a: 'Minibus hire in Kigali starts from RWF 80,000/day for a 14-seater Toyota Hiace. Larger Coaster (30-seater) vehicles start from RWF 120,000/day. Prices include a driver.' },
  { q: 'Do minibuses on Gari come with a driver?', a: 'Yes, all minibus listings on Gari include a driver. The driver is experienced with Kigali routes and upcountry travel. Driver is included in the advertised price.' },
  { q: 'Can I hire a minibus for a full-day tour of Rwanda?', a: 'Yes, most minibus hosts offer full-day and multi-day packages. Message the host via WhatsApp after booking to arrange your itinerary.' },
  { q: 'What is the maximum group size for a Gari minibus?', a: 'Most Gari minibuses are 14-seater Toyota Hiace. For groups over 20 people, filter by "Minibus" and you\'ll find 25 and 30-seater Coasters available.' },
];

export default async function MinibusHireKigaliPage() {
  const dbCars = await getMinibusCars();
  const cars: ReturnType<typeof demoToCard>[] =
    dbCars.length > 0 ? (dbCars as unknown as ReturnType<typeof demoToCard>[]) :
    DEMO_RENTAL_CARS.filter(c => c.type === 'Minibus').slice(0, 9).map(demoToCard);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — Minibus Hire Kigali',
    description: '14-seater and Coaster minibus hire in Kigali, Rwanda.',
    url: 'https://gari-nu.vercel.app/minibus-hire-kigali',
    address: { '@type': 'PostalAddress', addressLocality: 'Kigali', addressCountry: 'RW' },
    priceRange: 'RWF 80,000 – RWF 200,000 per day',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Image src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1600&q=60" alt="Minibus hire Kigali" fill className="object-cover" priority sizes="100vw" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Users className="w-4 h-4 text-accent-yellow" /> Group Transport · Kigali
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Minibus Hire in Kigali<br />
              <span className="text-accent-yellow">14-Seater &amp; Coaster</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Hire a Toyota Hiace or Coaster for weddings, corporate transfers, tours, and airport shuttles. All minibuses include an experienced driver.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?type=MINIBUS" className="btn-primary px-8 py-3 text-base font-bold">Browse Minibuses</Link>
              <Link href="/search?type=MINIBUS&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
                With Driver (Included)
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 border-b border-border py-5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon: Users, label: 'Up to 30 passengers' },
                { icon: CheckCircle, label: 'Driver included' },
                { icon: Star, label: '4.8★ average rating' },
                { icon: Shield, label: 'Fully insured' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Perfect For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {USE_CASES.map(u => (
              <div key={u.title} className="card p-4">
                <p className="font-bold text-text-primary dark:text-white text-sm mb-1">{u.title}</p>
                <p className="text-xs text-text-secondary">{u.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Available Minibuses</h2>
              <p className="text-text-secondary text-sm mt-1">{cars.length}+ group vehicles in Kigali</p>
            </div>
            <Link href="/search?type=MINIBUS" className="text-sm text-primary font-semibold hover:underline">View all →</Link>
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
