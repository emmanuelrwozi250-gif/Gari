import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, CheckCircle, Building2, Globe, Car, Users, ArrowRight } from 'lucide-react';
import { COMPANY, waLink } from '@/lib/config/company';

export const metadata: Metadata = {
  title: 'Partner with Gari | Lodges, Tour Operators & DMCs',
  description: "Rwanda's best lodges and tour operators use Gari to organise guest transport. Join the Gari Partners programme.",
  openGraph: {
    title: 'Partner with Gari | Lodges, Tour Operators & DMCs',
    description: "Rwanda's best lodges and tour operators use Gari to organise guest transport. Join the Gari Partners programme.",
    url: 'https://gari-africa.com/partners',
    siteName: 'Gari',
    images: [{
      url: 'https://gari-africa.com/og?title=Partner+with+Gari&sub=Lodges+%C2%B7+Tour+Operators+%C2%B7+DMCs',
      width: 1200,
      height: 630,
      alt: 'Partner with Gari',
    }],
  },
  alternates: {
    canonical: 'https://gari-africa.com/partners',
  },
};

const BENEFITS = [
  {
    icon: Car,
    title: 'Verified fleet on demand',
    desc: 'Access Rwanda\'s largest network of RURA-licensed vehicles — from budget saloons to Land Cruisers — without owning a single car.',
  },
  {
    icon: CheckCircle,
    title: 'Dedicated partner account',
    desc: 'A named account manager, priority booking support, and a direct WhatsApp line for urgent guest requests.',
  },
  {
    icon: Globe,
    title: 'Seamless guest experience',
    desc: 'Pre-vetted drivers, English-speaking hosts, airport pickups, and clean vehicles — your guests will thank you.',
  },
  {
    icon: Building2,
    title: 'Volume pricing',
    desc: 'Preferential rates for partners who bring consistent volume. The more you book, the less you pay.',
  },
  {
    icon: Users,
    title: 'Group & convoy coordination',
    desc: 'Need 4 cars for a 16-person group? We coordinate multi-vehicle bookings so you don\'t have to.',
  },
];

const WHO_ITS_FOR = [
  'Safari lodges & camps',
  'Boutique hotels',
  'Tour operators & DMCs',
  'Corporate travel managers',
  'NGOs & diplomatic missions',
  'Film & production companies',
  'Wedding & events coordinators',
  'Airlines & ground handlers',
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Apply', desc: 'Fill in the form below or message us on WhatsApp. We\'ll respond within 24 hours.' },
  { n: '02', title: 'Onboard', desc: 'Your account manager sets up your partner account and brief your team on the booking flow.' },
  { n: '03', title: 'Book', desc: 'Request vehicles via WhatsApp or our partner dashboard. We confirm availability within the hour.' },
  { n: '04', title: 'Relax', desc: 'We handle driver coordination, pickup logistics, and post-trip invoicing. You focus on your guests.' },
];

const applyLink = waLink("Hi Gari, I'd like to apply for a partner account. My organisation is ");

export default function PartnersPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Hero */}
      <div className="text-center mb-14">
        <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
          Trade & B2B Programme
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary dark:text-white mb-4">
          Send your guests. We handle the car.
        </h1>
        <p className="text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Rwanda&apos;s best lodges and tour operators use Gari to organise guest transport.
          Verified vehicles, professional drivers, and a single point of contact — so you
          can focus on the experience, not the logistics.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 justify-center"
          >
            <Phone className="w-4 h-4" /> Apply for a partner account →
          </a>
          <a
            href={`mailto:${COMPANY.email}?subject=Partner Programme Enquiry`}
            className="btn-secondary inline-flex items-center gap-2 justify-center"
          >
            Email us instead
          </a>
        </div>
      </div>

      {/* Benefits */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-8">
          What partners get
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map(b => (
            <div key={b.title} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-text-secondary dark:text-gray-400">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mb-14 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-6 text-center">
          Who it&apos;s for
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WHO_ITS_FOR.map(who => (
            <div key={who} className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{who}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(step => (
            <div key={step.n} className="card p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-extrabold text-base flex items-center justify-center mx-auto mb-3">
                {step.n}
              </div>
              <h3 className="font-bold text-text-primary dark:text-white mb-2 text-sm">{step.title}</h3>
              <p className="text-xs text-text-secondary dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enquiry form */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-2">
          Apply for a partner account
        </h2>
        <p className="text-center text-sm text-text-secondary dark:text-gray-400 mb-8">
          Fill in the form below and your account manager will be in touch within one business day.
        </p>
        <div className="card p-8 max-w-xl mx-auto">
          <PartnerEnquiryForm />
        </div>
      </section>

      {/* CTA strip */}
      <section className="text-center bg-primary/5 dark:bg-primary/10 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">
          Already a Gari operator?
        </h2>
        <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 max-w-md mx-auto">
          If you own a licensed fleet and want to list on Gari, visit the operator page.
        </p>
        <Link href="/become-operator" className="btn-primary inline-flex items-center gap-2">
          List your fleet <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </main>
  );
}

function PartnerEnquiryForm() {
  'use client';
  // This is a server component page, so we use a plain HTML form that posts to the API.
  // For a progressively enhanced UX the form posts to /api/partners/enquiry.
  return (
    <form action="/api/partners/enquiry" method="POST" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input name="name" required className="input w-full" placeholder="Amina Kalisa" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
            Organisation <span className="text-red-500">*</span>
          </label>
          <input name="organisation" required className="input w-full" placeholder="Volcanoes Safaris" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
          Organisation type <span className="text-red-500">*</span>
        </label>
        <select name="type" required className="input w-full">
          <option value="">Select type…</option>
          <option>Safari lodge / camp</option>
          <option>Boutique hotel</option>
          <option>Tour operator / DMC</option>
          <option>Corporate travel</option>
          <option>NGO / diplomatic mission</option>
          <option>Film / production</option>
          <option>Wedding / events</option>
          <option>Other</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input name="email" type="email" required className="input w-full" placeholder="hello@company.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
            WhatsApp / phone
          </label>
          <input name="phone" className="input w-full" placeholder="+250 7xx xxx xxx" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
          Website
        </label>
        <input name="website" type="url" className="input w-full" placeholder="https://yourcompany.com" />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
          Estimated monthly vehicle bookings
        </label>
        <select name="monthlyVolume" className="input w-full">
          <option value="">Select range…</option>
          <option>1–5 bookings / month</option>
          <option>6–20 bookings / month</option>
          <option>21–50 bookings / month</option>
          <option>50+ bookings / month</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">
          Anything else?
        </label>
        <textarea name="message" rows={3} className="input w-full resize-none" placeholder="Tell us about your guests, peak season, or specific vehicle needs…" />
      </div>
      <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2">
        <Phone className="w-4 h-4" /> Submit application
      </button>
      <p className="text-xs text-text-light text-center">
        Prefer WhatsApp?{' '}
        <a href={waLink("Hi Gari, I'd like to apply for a partner account.")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Message us directly
        </a>
      </p>
    </form>
  );
}
