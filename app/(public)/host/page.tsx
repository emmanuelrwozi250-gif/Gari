export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Car, Banknote, Shield, Star, ArrowRight, Users, Globe } from 'lucide-react';
import { STATS } from '@/config/social-proof';
import { ActivityTicker } from '@/components/ActivityTicker';
import { HostMobileCTA } from '@/components/HostMobileCTA';

export const metadata: Metadata = {
  title: 'Become a Host — Earn with Your Car | Gari',
  description: 'List your car on Gari and earn money in Rwanda. MTN MoMo payouts, NIDA-verified renters, and insurance on every trip.',
  openGraph: {
    title: 'Earn with Your Car — Gari',
    description: 'List your car on Gari and earn RWF 550,000–2,600,000/month. Free to list, instant MoMo payouts.',
    url: 'https://gari.rw/host',
    siteName: 'Gari',
    images: [{
      url: 'https://gari.rw/og?title=Earn+with+Your+Car&sub=RWF+550k%E2%80%932.6M%2Fmonth&type=host',
      width: 1200,
      height: 630,
      alt: 'Earn with Your Car on Gari',
    }],
    locale: 'en_RW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earn with Your Car — Gari',
    description: 'List your car on Gari and earn RWF 550,000–2,600,000/month. Free to list.',
  },
};

const BENEFITS = [
  { icon: Banknote, title: 'Earn Passive Income', desc: 'Hosts earn RWF 550,000 – 2,600,000/month depending on vehicle type.' },
  { icon: Shield, title: 'Insured Every Trip', desc: 'Every rental is covered by our insurance policy. You\'re protected.' },
  { icon: Users, title: 'Verified Renters Only', desc: 'All renters go through NIDA verification. Peace of mind guaranteed.' },
  { icon: Star, title: 'Build Your Reputation', desc: 'Great reviews lead to more bookings and Superhost status.' },
  { icon: Car, title: 'You Control Your Car', desc: 'Block dates, set rules, approve requests. Your car, your terms.' },
  { icon: Globe, title: 'Reach Tourists & Expats', desc: 'List once, reach thousands of renters across Rwanda and beyond.' },
];

const STEPS = [
  { step: '01', title: 'Create Your Listing', desc: 'Fill in your car details, upload photos, set your price. Takes under 10 minutes.' },
  { step: '02', title: 'Get Verified', desc: 'Our team reviews your listing within 24 hours. NIDA verification is quick.' },
  { step: '03', title: 'Accept Bookings', desc: 'Approve requests or enable instant booking. You decide who drives your car.' },
  { step: '04', title: 'Get Paid', desc: 'Payouts via MTN MoMo within 24h of trip completion. Zero hassle.' },
];

export default function BeAHostPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-dark-bg to-primary-dark text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm mb-6">
            <Banknote className="w-4 h-4 text-accent-yellow" />
            Hosts earn RWF 550,000 – 2,600,000/month depending on vehicle type
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Your Car Should Be{' '}
            <span className="text-accent-yellow">Working for You</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            List your car on Gari and earn passive income. Peer-to-peer or fleet — we connect you with verified renters across all 30 Rwanda districts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/host/new" className="btn-primary text-lg px-10 py-4">
              List Your Car Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/search" className="border-2 border-white/30 text-white font-semibold px-10 py-4 rounded-pill hover:bg-white/10 transition-all text-lg">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Live activity ticker */}
      <ActivityTicker />

      {/* 8 minutes to list */}
      <section className="py-5 px-4 bg-accent-yellow/10 dark:bg-accent-yellow/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-amber-700 dark:text-accent-yellow mb-3">⏱️ List your car in about 8 minutes</p>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {[
              { step: '1', label: 'Take photos', time: '2 min' },
              { step: '2', label: 'Set your price', time: '3 min' },
              { step: '3', label: 'Go live', time: '3 min' },
            ].map(({ step, label, time }, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-yellow text-gray-900 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                <span className="text-sm font-medium text-text-secondary dark:text-gray-300">{label}</span>
                <span className="text-xs text-text-light">({time})</span>
                {i < arr.length - 1 && <span className="hidden sm:inline text-text-light mx-1">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Why Host on Gari?</h2>
          <p className="section-subtitle">Everything you need to succeed as a car host in Rwanda</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-bg dark:bg-gray-950 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">How Hosting Works</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="card p-6 flex gap-4">
                <div className="text-3xl font-extrabold text-primary/20 flex-shrink-0">{step}</div>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-text-secondary">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings examples */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="section-title">How Much Can You Earn?</h2>
          <p className="section-subtitle">Based on real host data — after 12% platform fee</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { type: 'Economy Car', model: 'Toyota Vitz / Fielder', price: '30,000', days: 20, monthly: '552,000' },
            { type: 'SUV / 4x4', model: 'RAV4 / Vitara / Prado', price: '90,000', days: 18, monthly: '1,490,400' },
            { type: 'Minibus', model: 'Toyota Hiace', price: '130,000', days: 22, monthly: '2,641,600' },
          ].map(({ type, model, price, days, monthly }) => (
            <div key={type} className="card p-6 text-center">
              <div className="text-sm text-text-secondary mb-1">{type}</div>
              <div className="font-bold mb-1">{model}</div>
              <div className="text-2xl font-extrabold text-primary mb-1">RWF {monthly}</div>
              <div className="text-xs text-text-light">per month avg (RWF {price}/day × {days} days)</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-text-light mt-4">* Estimates based on average host utilization. Results vary.</p>
      </section>

      {/* Host success story */}
      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="section-title text-center mb-6">Host Success Story</h2>
          <div className="card p-6 border-l-4 border-primary">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                JP
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-text-primary dark:text-white">Jean-Pierre M.</p>
                  <span className="text-xs bg-amber-400/20 text-amber-700 dark:text-accent-yellow px-2 py-0.5 rounded-full font-medium">⭐ Superhost</span>
                </div>
                <p className="text-xs text-text-secondary mb-3">Kigali, Rwanda · 47 trips completed</p>
                <blockquote className="text-sm text-text-secondary dark:text-gray-400 italic leading-relaxed">
                  &ldquo;I listed my Land Cruiser on Gari and earned over RWF 2.1M last month. The MoMo payouts are instant and the renters are all NIDA-verified. Best decision I made.&rdquo;
                </blockquote>
                <div className="mt-3 text-2xl font-extrabold text-primary">RWF 2,100,000</div>
                <p className="text-xs text-text-light">earned last month · 1 vehicle</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white text-center px-4">
        <div className="max-w-xl mx-auto">
          <CheckCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold mb-4">Ready to Start Earning?</h2>
          <p className="text-primary-light mb-8">Join {STATS.hosts} hosts already earning on Gari. No listing fees.</p>
          <Link href="/host/new" className="inline-flex items-center gap-2 bg-accent-yellow text-gray-900 font-bold px-10 py-4 rounded-pill hover:bg-yellow-400 transition-colors text-lg">
            List Your Car for Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      <HostMobileCTA />
    </div>
  );
}
