import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SearchBar } from '@/components/SearchBar';
import { CarCard } from '@/components/CarCard';
import { STATS } from '@/config/social-proof';
import { prisma } from '@/lib/prisma';
import { DEMO_RENTAL_CARS, DEMO_STATS, DEMO_TESTIMONIALS } from '@/lib/demo-data';
import { EarningsEstimator } from '@/components/home/EarningsEstimator';
import {
  Shield, BadgeCheck, Phone, Star, ArrowRight,
  Car, Users, Globe,
  Clock, HeartHandshake, Lock, RefreshCcw,
} from 'lucide-react';

// ─── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Gari — Rent a Car Anywhere in Rwanda',
  description: 'Book verified cars across all 30 Rwanda districts. Pay with MTN MoMo or card. Self-drive or with a professional driver. No hidden fees.',
  keywords: [
    'car rental Rwanda', 'rent a car Kigali', 'car hire Rwanda',
    'MTN MoMo car rental', 'self-drive Rwanda', 'driver Rwanda',
    'Kigali car hire', 'Rwanda car booking', 'Gari Rwanda',
  ],
  openGraph: {
    type: 'website',
    url: 'https://gari.rw',
    siteName: 'Gari',
    title: 'Gari — Rent a Car Anywhere in Rwanda',
    description: 'Verified hosts, mobile money payments, available across all 30 districts.',
    locale: 'en_RW',
    images: [
      {
        url: 'https://gari.rw/og?title=Rent+a+Car+Anywhere+in+Rwanda&sub=Verified+hosts+%C2%B7+MTN+MoMo+%C2%B7+30+districts',
        width: 1200,
        height: 630,
        alt: 'Gari — Rwanda Car Rental Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gari — Rent a Car Anywhere in Rwanda',
    description: 'Verified hosts, mobile money payments, available across all 30 districts.',
    images: ['https://gari.rw/og?title=Rent+a+Car+Anywhere+in+Rwanda&sub=Verified+hosts+%C2%B7+MTN+MoMo+%C2%B7+30+districts'],
  },
  alternates: { canonical: 'https://gari.rw' },
};

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function getFeaturedCars() {
  try {
    // FIX 7: 3 top-rated + 1 most affordable, deduped
    const [topRated, cheapest] = await Promise.all([
      prisma.car.findMany({
        where: { isAvailable: true, isVerified: true },
        include: { host: { select: { name: true, avatar: true } } },
        orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
        take: 3,
      }),
      prisma.car.findMany({
        where: { isAvailable: true, isVerified: true },
        include: { host: { select: { name: true, avatar: true } } },
        orderBy: { pricePerDay: 'asc' },
        take: 1,
      }),
    ]);

    const seen = new Set(topRated.map(c => c.id));
    const extra = cheapest.filter(c => !seen.has(c.id));
    return [...topRated, ...extra];
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

const GUARANTEE_ITEMS = [
  {
    icon: Lock,
    title: 'Payment Held Safe',
    desc: 'Your payment is held in escrow and only released to the host after your trip starts. You pay, we hold.',
    colour: 'bg-blue-500/10 border-blue-500/20',
    iconColour: 'text-blue-400',
  },
  {
    icon: RefreshCcw,
    title: 'Full Refund If Host Cancels',
    desc: 'If a host cancels your confirmed booking, you receive a 100% refund — no questions asked.',
    colour: 'bg-emerald-500/10 border-emerald-500/20',
    iconColour: 'text-emerald-400',
  },
  {
    icon: Shield,
    title: 'Deposit Protected',
    desc: 'Security deposits are returned within 48 hours of a smooth return. Every transaction is logged.',
    colour: 'bg-violet-500/10 border-violet-500/20',
    iconColour: 'text-violet-400',
  },
  {
    icon: Phone,
    title: '24/7 WhatsApp Support',
    desc: 'Stuck on the road at 2 AM? Our team is one WhatsApp message away, every day of the year.',
    colour: 'bg-amber-500/10 border-amber-500/20',
    iconColour: 'text-amber-400',
  },
];

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// ─── JSON-LD structured data ───────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoRental',
  name: 'Gari',
  url: 'https://gari.rw',
  description: 'Rwanda\'s car rental marketplace. Verified hosts, mobile money payments, available across all 30 districts.',
  areaServed: {
    '@type': 'Country',
    name: 'Rwanda',
  },
  availableLanguage: 'English',
  paymentAccepted: 'MTN MoMo, Airtel Money, Visa, Mastercard',
  currenciesAccepted: 'RWF',
  priceRange: 'RWF 35,000 – 200,000 / day',
  telephone: '+250788123000',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Kigali',
    addressCountry: 'RW',
  },
  sameAs: [
    'https://twitter.com/gari_rw',
    'https://instagram.com/gari.rw',
  ],
};

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const dbCars = await getFeaturedCars();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const featuredCars: any[] = dbCars.length > 0
    ? dbCars
    : (() => {
        const sorted = [...DEMO_RENTAL_CARS].sort((a, b) => b.rating - a.rating);
        const top3 = sorted.slice(0, 3).map(demoToCard);
        const cheapest = [...DEMO_RENTAL_CARS].sort((a, b) => a.pricePerDay - b.pricePerDay)[0];
        const seen = new Set(top3.map(c => c.id));
        const extra = seen.has(cheapest.id) ? [] : [demoToCard(cheapest)];
        return [...top3, ...extra];
      })();

  return (
    <div className="min-h-screen">
      {/* JSON-LD */}
      <Script
        id="json-ld-autorental"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
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
            The simplest way to rent a verified car in Rwanda — with or without a driver. Pay with MTN MoMo.
          </p>

          <div className="max-w-5xl mx-auto">
            <SearchBar />
            {/* Quick-select location chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {[
                { label: '📍 Kigali', district: 'GASABO' },
                { label: '🦍 Volcanoes', district: 'MUSANZE' },
                { label: '🐘 Akagera', district: 'KAYONZA' },
                { label: '🌊 Lake Kivu', district: 'RUBAVU' },
                { label: '🌿 Nyungwe', district: 'NYAMASHEKE' },
              ].map(({ label, district }) => (
                <Link
                  key={district}
                  href={`/search?district=${district}`}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-gray-300 hover:bg-primary/20 hover:text-primary border border-white/10 hover:border-primary/40 transition-all"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
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

      {/* ── Featured Cars (FIX 7: mixed pricing) ─────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Cars</h2>
            <p className="section-subtitle">Top-rated picks + an affordable option for every budget</p>
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

      {/* ── How It Works ──────────────────────────────────────────────────── */}
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

      {/* ── Trust & Safety ────────────────────────────────────────────────── */}
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

      {/* ── Earnings Estimator (FIX 4) ────────────────────────────────────── */}
      <EarningsEstimator />

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
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
              <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
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

      {/* ── Gari Guarantee (FIX 8) ────────────────────────────────────────── */}
      <section className="py-16 bg-dark-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1.5 text-primary-light text-xs font-semibold mb-4">
              <Shield className="w-3.5 h-3.5" /> The Gari Guarantee
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Book With Confidence</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every booking on Gari is backed by our renter-first promise. If anything goes wrong, we make it right.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GUARANTEE_ITEMS.map(({ icon: Icon, title, desc, colour, iconColour }) => (
              <div key={title} className={`rounded-2xl border p-5 ${colour}`}>
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${iconColour}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-dark-bg text-white text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <HeartHandshake className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold mb-4">Your Next Drive Starts Here</h2>
          <p className="text-gray-400 mb-8">
            Join {STATS.tripsCompleted} Rwandans who have rented on Gari. NIDA-verified hosts, MTN MoMo payments.
          </p>
          <Link href="/search" className="btn-primary text-base px-12 py-4 inline-flex items-center gap-2">
            Browse Cars <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
