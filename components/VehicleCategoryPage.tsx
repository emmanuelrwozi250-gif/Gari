import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, MapPin, Star, Zap } from 'lucide-react';
import { formatRWF } from '@/lib/utils';
import type { Metadata } from 'next';

export interface CategoryConfig {
  slug: string;
  heading: string;
  subheading: string;
  heroImage: string;
  useCases: string[];
  faqs: { q: string; a: string }[];
  searchTypes: string[];   // CarType enum values to filter
  minPrice?: number;
}

interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  photos: string[];
  district: string;
  rating: number;
  instantBooking: boolean;
}

interface Props {
  config: CategoryConfig;
  vehicles: VehicleSummary[];
}

const FALLBACK = 'https://images.pexels.com/photos/9615358/pexels-photo-9615358.jpeg?auto=compress&cs=tinysrgb&w=800';

export function VehicleCategoryPage({ config, vehicles }: Props) {
  const hasVehicles = vehicles.length > 0;

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src={config.heroImage}
          alt={config.heading}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{config.heading}</h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl">{config.subheading}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Use cases */}
        <div>
          <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">What it&apos;s used for</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {config.useCases.map(uc => (
              <div key={uc} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 border border-border">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-text-secondary">{uc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">
              {hasVehicles ? `${vehicles.length} available` : 'Available vehicles'}
            </h2>
            <Link
              href={`/search?type=${config.searchTypes.join(',')}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!hasVehicles ? (
            <div className="text-center py-10 card">
              <p className="text-text-secondary mb-2">No vehicles listed yet in this category.</p>
              <p className="text-xs text-text-light mb-4">Be the first to list a {config.slug} on Gari.</p>
              <Link href="/host/new" className="btn-primary text-sm py-2 px-4">
                List your vehicle — it&apos;s free
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map(v => (
                <Link
                  key={v.id}
                  href={`/cars/${v.id}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={v.photos[0] ?? FALLBACK}
                      alt={`${v.make} ${v.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width:640px) 100vw, 50vw"
                    />
                    {v.instantBooking && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Instant
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-text-primary dark:text-white text-sm">
                          {v.year} {v.make} {v.model}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                          <MapPin className="w-3 h-3" /> {v.district}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-primary text-sm">{formatRWF(v.pricePerDay)}</div>
                        <div className="text-xs text-text-light">/day</div>
                      </div>
                    </div>
                    {v.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 fill-accent-yellow text-accent-yellow" />
                        <span className="text-xs text-text-secondary">{v.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-text-primary dark:text-white">Own a {config.heading.split(' ')[0].toLowerCase()}?</p>
            <p className="text-sm text-text-secondary mt-0.5">List it free on Gari and earn from every rental.</p>
          </div>
          <Link href="/host/new" className="btn-primary whitespace-nowrap text-sm py-2.5 px-5">
            Start earning <ArrowRight className="w-4 h-4 ml-1 inline-block" />
          </Link>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {config.faqs.map(faq => (
              <details
                key={faq.q}
                className="card p-4 group cursor-pointer"
              >
                <summary className="font-semibold text-sm text-text-primary dark:text-white list-none flex items-center justify-between">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 text-text-light group-open:rotate-90 transition-transform flex-shrink-0 ml-2" />
                </summary>
                <p className="text-sm text-text-secondary mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export function buildCategoryMetadata(config: CategoryConfig): Metadata {
  const title = `${config.heading} in Rwanda · Gari`;
  return {
    title,
    description: config.subheading,
    openGraph: { title, description: config.subheading, type: 'website' },
    alternates: { canonical: `/rent/${config.slug}` },
  };
}
