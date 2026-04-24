import { Metadata } from 'next';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { CarCard } from '@/components/CarCard';
import { EarningsCalculator } from '@/components/EarningsCalculator';
import { STATS } from '@/config/social-proof';
import { prisma } from '@/lib/prisma';
import { DEMO_RENTAL_CARS, DEMO_STATS, DEMO_TESTIMONIALS } from '@/lib/demo-data';
import {
  Shield, BadgeCheck, Phone, Star, ArrowRight,
  Car, Users, Globe, CheckCircle,
  Banknote, Clock, HeartHandshake
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gari — Rent a Car Anywhere in Rwanda',
  description: 'Book verified cars across all 30 Rwanda districts. Pay with MTN MoMo or card. Self-drive or with a professional driver.',
};

async function getFeaturedCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, isVerified: true },
      include: { host: { select: { name: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 4,
    });
    return cars;
  } catch {
    return [];
  }
}

// Map DemoRentalCar shape → CarCard prop shape
function demoToCard(c: typeof DEMO_RENTAL_CARS[number]) {
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

const STAT_ICONS = [Car, Users, Globe, Star];

const HOW_IT_WORKS = [
  { icon: SearchIcon, step: '01', title: 'Find Your Car', desc: 'Search across 30 districts. Filter by type, budget, and whether you want a driver.' },
  { icon: BadgeCheck, step: '02', title: 'Book Instantly', desc: 'Confirm your dates, choose MTN MoMo, Airtel Money, or card. No hidden fees.' },
  { icon: Car, step: '03', title: 'Pick Up & Go', desc: 'Meet the host, inspect the car together, and start your journey.' },
  { icon: Star, step: '04', title: 'Rate & Review', desc: 'Share your experience and help build trust in the community.' },
];

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default async function HomePage() {
  const dbCars = await getFeaturedCars();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featuredCars: any[] = dbCars.length > 0
    ? dbCars
    : [...DEMO_RENTAL_CARS]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4)
        .map(demoToCard);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-dark-bg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #1a7a4a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f5c518 0%, transparent 50%)`,
          }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/50 via-transparent to-dark-bg/80" />

        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none hidden lg:block">
          <Car className="w-[600px] h-[300px] text-white" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1.5 text-primary-light text-xs sm:text-sm font-medium mb-6 max-w-[90vw]">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Now available across all 30 Rwanda districts</span>
          </div>

          <h1 className="text-[1.85rem] sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 sm:mb-6">
            Rent a Car{' '}
            <span className="text-primary">Anywhere in</span>{' '}
            <span className="text-accent-yellow">Rwanda</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
            Connecting Africa to the world — peer-to-peer car sharing and fleet rentals, with or without a driver. Pay with MTN MoMo, Airtel Money, or card.
          </p>

          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>

          {/* Stats from demo-data */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-10">
            {DEMO_STATS.map(({ label, value }, i) => {
              const Icon = STAT_ICONS[i];
              return (
                <div key={label} className="flex items-center gap-2 text-gray-400">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-bold text-white">{value}</span>
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Top-Rated Cars</h2>
            <p className="section-subtitle">Handpicked, verified listings across Rwanda</p>
          </div>
          <Link href="/search" className="btn-ghost">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-bg dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">How Gari Works</h2>
            <p className="section-subtitle">Rent a car in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                  <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-bold text-primary mb-1">STEP {step}</div>
                <h3 className="font-bold text-lg mb-2 text-text-primary dark:text-white">{title}</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <Banknote className="w-64 h-64" />
          </div>
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Earn with Your Car <span className="text-accent-yellow">🚗💰</span>
              </h2>
              <p className="text-primary-light mb-6">
                List your car on Gari and earn passive income. Hosts typically earn RWF 400,000 – 1,200,000 per month.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'No listing fees — only 10% per completed booking',
                  'Insurance coverage on every trip',
                  'Payout via MTN MoMo within 24h',
                  'NIDA-verified renters only',
                ].map(point => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <Link href="/host/new" className="inline-flex items-center gap-2 bg-accent-yellow text-gray-900 font-bold px-8 py-3 rounded-pill hover:bg-yellow-400 transition-colors">
                List Your Car <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <EarningsCalculator />
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 bg-gray-bg dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Trust & Safety</h2>
            <p className="section-subtitle">Every booking is protected</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BadgeCheck, title: 'NIDA Verified', desc: 'All renters verified with Rwanda National ID (NIDA).' },
              { icon: Shield, title: 'Insured Trips', desc: 'Comprehensive insurance coverage on every rental.' },
              { icon: Phone, title: 'MoMo Payments', desc: 'Secure mobile money payments — MTN MoMo & Airtel Money.' },
              { icon: Clock, title: '24/7 Support', desc: 'Our team is available around the clock to help you.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2 text-text-primary dark:text-white">{title}</h3>
                <p className="text-sm text-text-secondary dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — from DEMO_TESTIMONIALS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Real stories from hosts and renters across Rwanda</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_TESTIMONIALS.slice(0, 3).map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                ))}
              </div>
              <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                {/* Initials avatar — no external image dependency */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                  ['bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-purple-100 text-purple-700','bg-amber-100 text-amber-700'][t.name.charCodeAt(0) % 4]
                }`}>
                  {t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-text-primary dark:text-white">{t.name}</div>
                  <div className="text-xs text-text-light">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-dark-bg text-white text-center">
        <div className="max-w-2xl mx-auto">
          <HeartHandshake className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold mb-4">Ready to Drive on Your Own Terms?</h2>
          <p className="text-gray-400 mb-8">Join {STATS.tripsCompleted} Rwandans already renting and hosting on Gari.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="btn-primary text-base px-10 py-4">
              Browse Cars <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/host/new" className="btn-secondary text-base px-10 py-4 border-white text-white hover:bg-white/10">
              List Your Car
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
