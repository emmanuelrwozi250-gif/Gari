import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { MapPin, Star, Shield, Compass, Mountain, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '4x4 Safari Car Hire Rwanda — Akagera, Volcanoes, Nyungwe · Gari',
  description:
    'Hire a 4x4 SUV for Rwanda safaris from RWF 70,000/day. Land Cruiser, Prado, RAV4. Akagera National Park, Volcanoes NP, Nyungwe Forest. Experienced drivers available.',
  keywords: ['4x4 hire Rwanda', 'safari car rental Rwanda', 'Land Cruiser hire Kigali', '4WD rental Rwanda', 'Akagera safari car', 'Volcanoes National Park 4x4'],
  openGraph: {
    title: '4x4 Safari Car Hire Rwanda — Gari',
    description: 'Land Cruiser, Prado, RAV4 for Rwanda safaris. From RWF 70,000/day.',
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

async function getSafariCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, type: { in: ['SUV_4X4', 'PICKUP'] } },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch { return []; }
}

const SAFARI_DESTINATIONS = [
  { name: 'Akagera National Park', dist: '~2.5 hrs', desc: 'Big Five safari — lions, elephants, giraffes, hippos.' },
  { name: 'Volcanoes National Park', dist: '~2.5 hrs', desc: 'Gorilla trekking and golden monkey visits.' },
  { name: 'Nyungwe Forest', dist: '~5 hrs', desc: 'Chimpanzee tracking and canopy walk.' },
  { name: 'Lake Kivu', dist: '~2.5 hrs', desc: 'Scenic drive along Rwanda\'s most beautiful lake.' },
  { name: 'Musanze Caves', dist: '~2 hrs', desc: 'Volcanic caves and twin lakes.' },
  { name: 'Gishwati-Mukura Park', dist: '~3 hrs', desc: 'Restored rainforest with chimpanzees.' },
];

const FAQ = [
  { q: 'What is the best 4x4 for a Rwanda safari?', a: 'The Toyota Land Cruiser (GX/TX) and Land Cruiser Prado are the top choices — high clearance, reliable 4WD, and the standard vehicle for guides. Toyota RAV4 and Hilux are good budget alternatives.' },
  { q: 'Do I need a 4x4 to reach Volcanoes National Park?', a: 'The main road to Musanze is tarmac and accessible in a regular car. However, a 4x4 is strongly recommended for the muddy tracks inside the park and for comfort on rough terrain.' },
  { q: 'Can I hire a 4x4 with an experienced safari driver?', a: 'Yes — many Gari hosts are experienced upcountry drivers. Filter by "With Driver" when searching, or request a driver in the booking notes. Drivers know the national park access routes well.' },
  { q: 'What is the price for a 4x4 safari rental in Rwanda?', a: 'SUV/4x4 rentals start from RWF 70,000/day on Gari. Adding an experienced driver is RWF 20,000–30,000/day extra. Multi-day bookings may qualify for a discount.' },
  { q: 'Is the 4x4 insured for national park use?', a: 'All verified Gari listings include basic third-party insurance. Upgrade to Gari Protect (comprehensive cover, RWF 5,000/day) for upcountry and national park trips.' },
];

export default async function SafariRwandaPage() {
  const dbCars = await getSafariCars();
  const cars: ReturnType<typeof demoToCard>[] =
    dbCars.length > 0 ? (dbCars as unknown as ReturnType<typeof demoToCard>[]) :
    DEMO_RENTAL_CARS.filter(c => ['SUV / 4x4', 'Pickup'].includes(c.type)).slice(0, 9).map(demoToCard);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — 4x4 Safari Car Hire Rwanda',
    description: 'Rwanda\'s leading 4x4 and SUV hire for national park safaris.',
    url: 'https://gari-nu.vercel.app/4x4-safari-rwanda',
    address: { '@type': 'PostalAddress', addressLocality: 'Kigali', addressCountry: 'RW' },
    priceRange: 'RWF 70,000 – RWF 200,000 per day',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        {/* Hero */}
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <Image src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1600&q=60" alt="4x4 safari Rwanda" fill className="object-cover" priority sizes="100vw" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <Compass className="w-4 h-4 text-accent-yellow" /> Rwanda Safari & Upcountry
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              4x4 Safari Car Hire Rwanda<br />
              <span className="text-accent-yellow">Akagera · Volcanoes · Nyungwe</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Land Cruiser, Prado, Hilux and RAV4 from RWF 70,000/day. Experienced upcountry drivers available. All national parks covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?type=SUV_4X4" className="btn-primary px-8 py-3 text-base font-bold">Browse 4x4 Vehicles</Link>
              <Link href="/search?type=SUV_4X4&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
                With Safari Driver
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-white dark:bg-gray-900 border-b border-border py-5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon: Mountain, label: 'All national parks' },
                { icon: CheckCircle, label: 'High-clearance 4WD' },
                { icon: Star, label: '4.8★ average rating' },
                { icon: Shield, label: 'Comprehensive insurance' },
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
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Available 4x4 & SUV Vehicles</h2>
              <p className="text-text-secondary text-sm mt-1">{cars.length}+ safari-ready cars · Instant booking</p>
            </div>
            <Link href="/search?type=SUV_4X4" className="text-sm text-primary font-semibold hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car: ReturnType<typeof demoToCard>) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>

        {/* Destinations */}
        <section className="max-w-5xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Popular Safari Destinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAFARI_DESTINATIONS.map(d => (
              <div key={d.name} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-bold text-text-primary dark:text-white text-sm">{d.name}</span>
                </div>
                <div className="text-xs text-primary font-medium mb-1">{d.dist} from Kigali</div>
                <p className="text-xs text-text-secondary">{d.desc}</p>
              </div>
            ))}
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
