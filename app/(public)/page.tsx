import { Metadata } from 'next';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { CarCard, CarCardSkeleton } from '@/components/CarCard';
import { prisma } from '@/lib/prisma';
import {
  Shield, BadgeCheck, Phone, Star, ArrowRight,
  TrendingUp, Car, Users, Globe, CheckCircle,
  Banknote, Clock, HeartHandshake, Tag, Building2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gari — Car Rental in Rwanda | Drive on Your Own Terms',
};

async function getFeaturedCars() {
  try {
    return await prisma.car.findMany({
      where: { isAvailable: true, isVerified: true },
      include: { host: { select: { name: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 8,
    });
  } catch {
    return [];
  }
}

const HOW_IT_WORKS = [
  { icon: Search, step: '01', title: 'Find Your Car', desc: 'Search across 30 districts. Filter by type, budget, and whether you want a driver.' },
  { icon: BadgeCheck, step: '02', title: 'Book Instantly', desc: 'Confirm your dates, choose MTN MoMo, Airtel Money, or card. No hidden fees.' },
  { icon: Car, step: '03', title: 'Pick Up & Go', desc: 'Meet the host, inspect the car together, and start your journey.' },
  { icon: Star, step: '04', title: 'Rate & Review', desc: 'Share your experience and help build trust in the community.' },
];

const STATS = [
  { label: 'Active Listings', value: '500+', icon: Car },
  { label: 'Happy Renters', value: '12,000+', icon: Users },
  { label: 'Districts Covered', value: '30', icon: Globe },
  { label: 'Avg. Rating', value: '4.8★', icon: Star },
];

const TESTIMONIALS = [
  {
    name: 'Jean-Pierre M.',
    role: 'Host — Gasabo',
    avatar: 'https://i.pravatar.cc/60?img=11',
    text: 'I listed my Toyota RAV4 on Gari and earned over RWF 800,000 last month. The platform handles everything — bookings, payments, even insurance.',
    rating: 5,
  },
  {
    name: 'Amina K.',
    role: 'Renter — Musanze',
    avatar: 'https://i.pravatar.cc/60?img=48',
    text: 'Found a beautiful Prado 4x4 for our Volcanoes National Park trip in minutes. MTN MoMo payment was instant. Highly recommend!',
    rating: 5,
  },
  {
    name: 'David N.',
    role: 'Host — Rubavu',
    avatar: 'https://i.pravatar.cc/60?img=22',
    text: 'As a fleet operator in Rubavu, Gari gave us a digital presence overnight. Our Hiace minibuses are booked weeks in advance now.',
    rating: 5,
  },
];

function Search(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export default async function HomePage() {
  const featuredCars = await getFeaturedCars();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-dark-bg">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #1a7a4a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f5c518 0%, transparent 50%)`,
          }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/50 via-transparent to-dark-bg/80" />

        {/* Hero car silhouette */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none hidden lg:block">
          <Car className="w-[600px] h-[300px] text-white" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 text-primary-light text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Now available across all 30 Rwanda districts
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Rent a Car <br />
            <span className="text-primary">Anywhere in</span>{' '}
            <span className="text-accent-yellow">Rwanda</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Connecting Africa to the world — peer-to-peer car sharing and fleet rentals, with or without a driver. Pay with MTN MoMo, Airtel Money, or card.
          </p>

          {/* Search Bar */}
          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400">
                <Icon className="w-4 h-4 text-primary" />
                <span className="font-bold text-white">{value}</span>
                <span className="text-sm">{label}</span>
              </div>
            ))}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredCars.length > 0
            ? featuredCars.map((car) => <CarCard key={car.id} car={car as any} />)
            : Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)
          }
        </div>
      </section>

      {/* ── Marketplace Callouts (Buy / Sell) ─────────────────────── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Buy a Car */}
          <Link href="/buy" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white hover:shadow-xl transition-shadow">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Tag className="w-28 h-28" />
            </div>
            <div className="relative z-10">
              <Tag className="w-7 h-7 text-blue-200 mb-3" />
              <h3 className="text-xl font-extrabold mb-1">Buy a Car</h3>
              <p className="text-blue-200 text-sm mb-3">Browse verified used cars sold directly by owners. NIDA-checked sellers, transparent pricing.</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:gap-2 transition-all">
                Browse listings <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Sell Your Car */}
          <Link href="/sell" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white hover:shadow-xl transition-shadow">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-28 h-28" />
            </div>
            <div className="relative z-10">
              <Building2 className="w-7 h-7 text-emerald-200 mb-3" />
              <h3 className="text-xl font-extrabold mb-1">Sell Your Car</h3>
              <p className="text-emerald-200 text-sm mb-3">List in minutes, reach thousands of verified buyers across Rwanda. Basic listing is free.</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:gap-2 transition-all">
                Start listing <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
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
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                  <span>No listing fees — only 10% per completed booking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                  <span>Insurance coverage on every trip</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                  <span>Payout via MTN MoMo within 24h</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-yellow flex-shrink-0" />
                  <span>NIDA-verified renters only</span>
                </div>
              </div>
              <Link href="/host/new" className="inline-flex items-center gap-2 bg-accent-yellow text-gray-900 font-bold px-8 py-3 rounded-pill hover:bg-yellow-400 transition-colors">
                List Your Car <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-accent-yellow">Earnings Estimator</h3>
              <div className="space-y-3 text-sm">
                {[
                  { type: 'Economy (Vitz, Fielder)', price: 'RWF 30,000', days: 20, est: 'RWF 552,000' },
                  { type: 'SUV (RAV4, Vitara)', price: 'RWF 75,000', days: 18, est: 'RWF 1,242,000' },
                  { type: 'Minibus (Hiace)', price: 'RWF 120,000', days: 22, est: 'RWF 2,428,800' },
                ].map(row => (
                  <div key={row.type} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                    <div>
                      <div className="font-medium">{row.type}</div>
                      <div className="text-primary-light text-xs">{row.price}/day × {row.days} days</div>
                    </div>
                    <div className="text-accent-yellow font-bold">{row.est}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-light">* After 10% platform fee. Based on average host performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Buy & Earn Teaser ─────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/30 rounded-full px-4 py-1.5 text-accent-yellow text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            New on Gari
          </div>
          <h2 className="section-title">Invest in a Car. Earn on Gari.</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Buy a car from our curated fleet and list it on Gari from day one.
            We handle the bookings — you collect the income.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Banknote,
              stat: '18–30%',
              label: 'Typical Annual ROI',
              desc: 'Based on comparable cars listed on Gari at Rwanda market rates.',
            },
            {
              icon: Clock,
              label: '24–36 Month Payback',
              stat: '2–3 years',
              desc: 'Earn rental income that progressively covers your vehicle purchase cost.',
            },
            {
              icon: Shield,
              stat: 'Fully Insured',
              label: 'Every Trip',
              desc: 'Comprehensive insurance on all rentals — your asset is protected from day one.',
            },
          ].map(({ icon: Icon, stat, label, desc }) => (
            <div key={label} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-yellow/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-accent-yellow" />
              </div>
              <div className="text-2xl font-extrabold text-text-primary dark:text-white mb-0.5">{stat}</div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{label}</div>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/earn" className="inline-flex items-center justify-center gap-2 bg-accent-yellow text-gray-900 font-bold px-8 py-3 rounded-pill hover:bg-yellow-400 transition-colors">
            <TrendingUp className="w-4 h-4" />
            View Investment Opportunities
          </Link>
          <Link href="/buy" className="inline-flex items-center justify-center gap-2 btn-secondary px-8 py-3">
            <Tag className="w-4 h-4" />
            Browse Cars for Sale
          </Link>
        </div>

        <p className="text-xs text-center text-text-light mt-4">
          Income estimates are projections based on comparable Gari listings. Not a guaranteed return. See full disclaimer on listing pages.
        </p>
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

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Real stories from hosts and renters across Rwanda</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
                ))}
              </div>
              <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
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
          <p className="text-gray-400 mb-8">Join thousands of Rwandans already renting and hosting on Gari.</p>
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
