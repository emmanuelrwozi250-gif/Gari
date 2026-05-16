import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, FileText, Shield, TrendingUp, Car, Phone } from 'lucide-react';
import { COMPANY, waLink } from '@/lib/config/company';

export const metadata: Metadata = {
  title: 'Become a Verified Operator | Gari Rwanda',
  description:
    'List your RURA-licensed fleet on Gari Rwanda. Reach thousands of renters across all 30 districts. Commercial vehicles only.',
  openGraph: {
    title: 'List Your Licensed Fleet on Gari Rwanda',
    description: 'Join Rwanda\'s trusted B2B2C car rental marketplace. RURA-compliant vehicles only.',
    url: 'https://gari.rw/become-operator',
    siteName: 'Gari',
    images: [{
      url: 'https://gari.rw/og?title=List+Your+Fleet&sub=RURA+Verified+Operators+Only&type=operator',
      width: 1200,
      height: 630,
      alt: 'List Your Licensed Fleet on Gari Rwanda',
    }],
    locale: 'en_RW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List Your Licensed Fleet on Gari Rwanda',
    description: 'RURA-compliant B2B2C car rental marketplace. Commercial vehicles only.',
  },
  alternates: {
    canonical: 'https://gari.rw/become-operator',
    languages: { 'en': 'https://gari.rw/become-operator', 'fr': 'https://gari.rw/become-operator', 'x-default': 'https://gari.rw/become-operator' },
  },
};

const REQUIREMENTS = [
  {
    icon: FileText,
    title: 'Commercial Vehicle License',
    desc: 'Valid RURA commercial vehicle permit (TM plates). Required for all rental cars in Rwanda.',
  },
  {
    icon: Shield,
    title: 'Insurance Certificate',
    desc: 'Third-party liability insurance at minimum. Comprehensive insurance preferred.',
  },
  {
    icon: CheckCircle,
    title: 'Vehicle Inspection Certificate',
    desc: 'Current vehicle inspection (contrôle technique) from an approved RTDA centre.',
  },
  {
    icon: Car,
    title: 'Operator NIDA',
    desc: 'Rwanda National ID or business registration number for company fleets.',
  },
];

const EARNINGS_TABLE = [
  { type: 'Economy Car',  model: 'Toyota Vitz / Fielder', price: '30,000',  days: 20, monthly: '528,000' },
  { type: 'SUV / 4×4',   model: 'RAV4 / Vitara / Prado', price: '90,000',  days: 18, monthly: '1,425,600' },
  { type: 'Minibus',     model: 'Toyota Hiace',           price: '130,000', days: 22, monthly: '2,513,600' },
];

const STEPS = [
  { n: '01', title: 'Submit Documents', desc: 'WhatsApp us your license, insurance, and inspection certificate.' },
  { n: '02', title: 'Gari Verifies',    desc: 'Our team reviews documents within 24 hours and confirms compliance.' },
  { n: '03', title: 'Go Live',          desc: 'Your cars appear on Gari and start receiving bookings immediately.' },
];

export default function BecomeOperatorPage() {
  const applyLink = waLink(
    'Hi Gari, I would like to list my licensed fleet as a verified operator. My company name is '
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
          B2B2C Platform · RURA Compliant
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-white mb-4">
          List Your Licensed Fleet on Gari
        </h1>
        <p className="text-text-secondary dark:text-gray-400 max-w-2xl mx-auto text-lg">
          Rwanda&apos;s only marketplace dedicated to RURA-licensed commercial rental vehicles.
          Reach thousands of renters across all 30 districts — with mobile money payments
          and full deposit protection.
        </p>
        <a
          href={applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          <Phone className="w-4 h-4" /> Apply to List Your Fleet
        </a>
      </div>

      {/* RURA Compliance Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 mb-12 text-center">
        <p className="font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center justify-center gap-2">
          🏛️ RURA Compliance Required
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400 max-w-2xl mx-auto">
          Rwanda&apos;s RURA regulation requires all commercial rental vehicles to hold a valid
          commercial vehicle license (TM plates). Gari only lists RURA-compliant vehicles.
          Private vehicles may not be listed on this platform.
        </p>
      </div>

      {/* Commission comparison — PROMINENT, before How It Works */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Why Gari?</p>
            <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
              Keep 88% of Every Booking
            </h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 max-w-xl mx-auto">
              Other platforms take a massive cut. Gari&apos;s 12% fee is the lowest in Rwanda — so you keep more of what you earn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center border border-border">
              <p className="font-extrabold text-2xl sm:text-3xl text-red-500">25–35%</p>
              <p className="text-xs text-text-secondary mt-1 font-semibold">Traditional car hire co.</p>
              <p className="text-[10px] text-text-light mt-0.5">e.g. Century, Dollar Rent</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center border border-border">
              <p className="font-extrabold text-2xl sm:text-3xl text-amber-500">20–30%</p>
              <p className="text-xs text-text-secondary mt-1 font-semibold">Hotels / OTA platforms</p>
              <p className="text-[10px] text-text-light mt-0.5">e.g. Booking.com, Marriott</p>
            </div>
            <div className="bg-primary rounded-xl p-3 sm:p-4 text-center ring-2 ring-primary ring-offset-2">
              <p className="font-extrabold text-2xl sm:text-3xl text-white">12%</p>
              <p className="text-xs text-white/90 mt-1 font-bold">Gari platform fee</p>
              <p className="text-[10px] text-white/70 mt-0.5">You keep 88%</p>
            </div>
          </div>
          {/* RWF example */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Example: SUV at RWF 90,000/day · 18 days/month</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-red-500 font-bold">RWF 1,053,000</p>
                <p className="text-text-light">at 35% commission</p>
              </div>
              <div>
                <p className="text-amber-600 font-bold">RWF 1,134,000</p>
                <p className="text-text-light">at 30% commission</p>
              </div>
              <div>
                <p className="text-primary font-extrabold text-sm">RWF 1,425,600</p>
                <p className="text-text-secondary font-semibold">with Gari (12%)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(step => (
            <div key={step.n} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                {step.n}
              </div>
              <h3 className="font-bold text-text-primary dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-8">
          What You Need to List
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REQUIREMENTS.map(req => (
            <div key={req.title} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <req.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-white text-sm mb-1">{req.title}</p>
                <p className="text-xs text-text-secondary dark:text-gray-400">{req.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings Table */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-2">
          Projected Monthly Earnings
        </h2>
        <p className="text-center text-xs text-text-light mb-4">
          Projected earnings based on typical utilisation — after 12% platform fee
        </p>
        <p className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl py-2.5 px-4 inline-block mx-auto w-full">
          💳 Earnings paid to your MoMo within 24 hours of each completed trip.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Vehicle Type', 'Example Model', 'Price/Day (RWF)', 'Avg Days/Month', 'Monthly Earnings (RWF)'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-text-secondary dark:text-gray-400 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EARNINGS_TABLE.map(row => (
                <tr key={row.type} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-text-primary dark:text-white">{row.type}</td>
                  <td className="px-4 py-4 text-text-secondary dark:text-gray-400">{row.model}</td>
                  <td className="px-4 py-4 text-text-primary dark:text-white">{row.price}</td>
                  <td className="px-4 py-4 text-text-secondary dark:text-gray-400">{row.days}</td>
                  <td className="px-4 py-4 font-bold text-primary">{row.monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="mb-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: '💳', label: 'MTN MoMo & Airtel Money payments' },
          { icon: '🔒', label: 'Deposit held & released by Gari' },
          { icon: '📊', label: 'Real-time analytics dashboard' },
          { icon: '⭐', label: 'Boost to top of search results' },
        ].map(b => (
          <div key={b.label} className="card p-4 text-center">
            <div className="text-2xl mb-2">{b.icon}</div>
            <p className="text-xs text-text-secondary dark:text-gray-400">{b.label}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center bg-primary/5 dark:bg-primary/10 rounded-2xl p-8">
        <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">
          Ready to List Your Fleet?
        </h2>
        <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 max-w-md mx-auto">
          Send us your documents via WhatsApp and we&apos;ll verify your fleet within 24 hours.
          No upfront fee — we only earn when you earn.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 justify-center"
          >
            <Phone className="w-4 h-4" /> Apply via WhatsApp
          </a>
          <a
            href={`mailto:${COMPANY.email}?subject=Fleet Operator Application`}
            className="btn-secondary inline-flex items-center gap-2 justify-center"
          >
            Apply via Email
          </a>
        </div>
        <p className="text-xs text-text-light mt-4">
          Questions?{' '}
          <Link href="/faq" className="text-primary hover:underline">
            Read our FAQ
          </Link>{' '}
          or call{' '}
          <a href={`tel:${COMPANY.phone}`} className="text-primary hover:underline">
            {COMPANY.phone}
          </a>
        </p>
      </section>
    </main>
  );
}
