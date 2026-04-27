import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { COMPANY, waLink } from '@/lib/config/company';
import { PLATFORM_STATS } from '@/lib/config/stats';

export const metadata: Metadata = {
  title: 'Press & Media | Gari',
  description: 'Press resources, brand assets, and media contact for Gari — Rwanda\'s leading car rental marketplace.',
};

const BRAND_COLORS = [
  { name: 'Primary Blue', hex: '#0066FF', bg: 'bg-[#0066FF]' },
  { name: 'Accent Yellow', hex: '#F5C518', bg: 'bg-[#F5C518]' },
  { name: 'Dark Background', hex: '#0F172A', bg: 'bg-[#0F172A]' },
  { name: 'Success Green', hex: '#16A34A', bg: 'bg-[#16A34A]' },
];

export default function PressPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-text-primary dark:text-white mb-4">
          Press &amp; Media
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl">
          Resources for journalists and media covering Gari — Rwanda&apos;s car rental marketplace.
          For press enquiries, reach out directly.
        </p>
      </div>

      {/* About Gari boilerplate */}
      <section className="card p-6 mb-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-3">About Gari</h2>
        <p className="text-text-secondary leading-relaxed">
          Gari is Rwanda&apos;s leading peer-to-peer and fleet car rental marketplace, connecting verified
          hosts with renters across all 30 districts. Founded in {COMPANY.founded}, Gari enables secure
          bookings with MTN MoMo and Airtel Money payments, NIDA-verified identities, and insurance on
          every trip. With {PLATFORM_STATS.verifiedCars} verified vehicles, {PLATFORM_STATS.tripsCompleted} completed
          trips, and a {PLATFORM_STATS.avgRating}★ average rating, Gari is building the infrastructure for
          trusted mobility across East Africa.
        </p>
        <p className="text-xs text-text-light mt-3">
          Feel free to use this paragraph verbatim in your coverage.
        </p>
      </section>

      {/* Key facts */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Key Facts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Verified Cars', value: PLATFORM_STATS.verifiedCars },
            { label: 'Trips Completed', value: PLATFORM_STATS.tripsCompleted },
            { label: 'Avg Rating', value: `${PLATFORM_STATS.avgRating}★` },
            { label: 'Districts', value: PLATFORM_STATS.districtsActive },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand assets */}
      <section className="card p-6 mb-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Brand Assets</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          {BRAND_COLORS.map(({ name, hex, bg }) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${bg} border border-border`} />
              <div>
                <p className="text-xs font-medium text-text-primary dark:text-white">{name}</p>
                <p className="text-xs text-text-light font-mono">{hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/favicon.svg"
            download="gari-logo.svg"
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Logo (SVG)
          </a>
          <Link href="/search" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ExternalLink className="w-4 h-4" />
            View Live Platform
          </Link>
        </div>
      </section>

      {/* Press contact */}
      <section className="card p-6 mb-8">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Press Contact</h2>
        <p className="text-text-secondary mb-4">
          We&apos;re happy to arrange interviews, provide additional data, or arrange a platform demo.
          We typically respond within 4 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`mailto:${COMPANY.email}?subject=Press Enquiry — Gari`}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {COMPANY.email}
          </a>
          <a
            href={waLink('Hi Gari team, I\'d like to cover your platform for a story.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </section>

      {/* Coverage invitation */}
      <section className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
        <p className="text-lg font-semibold text-text-primary dark:text-white mb-2">
          We&apos;re just getting started.
        </p>
        <p className="text-text-secondary mb-4">
          Be among the first to cover Rwanda&apos;s fastest-growing mobility platform.
        </p>
        <a
          href={waLink('Hi, I\'d like to be the first to cover Gari. Can we set up an interview?')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Request an Interview
        </a>
      </section>
    </main>
  );
}
