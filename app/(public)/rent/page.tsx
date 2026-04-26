import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rent Any Vehicle in Rwanda · Gari',
  description: 'Cars, trucks, buses, tractors, vans and cold trucks available for hire across Rwanda. Pay with MTN MoMo or Airtel Money. Instant booking available.',
  alternates: { canonical: '/rent' },
};

const CATEGORIES = [
  {
    slug: 'trucks',
    label: 'Trucks & Pickups',
    desc: 'Cargo trucks & flatbeds for moving goods and materials.',
    image: 'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Heavy cargo',
  },
  {
    slug: 'buses',
    label: 'Buses & Minibuses',
    desc: '14–60 seat vehicles for group travel, MICE and tours.',
    image: 'https://images.pexels.com/photos/3764569/pexels-photo-3764569.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Groups',
  },
  {
    slug: 'vans',
    label: 'Cargo Vans',
    desc: 'Panel vans for deliveries, removals and events.',
    image: 'https://images.pexels.com/photos/4481323/pexels-photo-4481323.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Logistics',
  },
  {
    slug: 'cold-trucks',
    label: 'Refrigerated Trucks',
    desc: '0–8°C cold chain transport for food, pharma & flowers.',
    image: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Cold chain',
  },
  {
    slug: 'tractors',
    label: 'Tractors',
    desc: 'Agricultural tractors for land prep, harvesting & more.',
    image: 'https://images.pexels.com/photos/158028/belinda-farm-rural-tractor-158028.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Agriculture',
  },
  {
    slug: '',   // links to /search for standard cars
    href: '/search',
    label: 'Cars & SUVs',
    desc: 'Economy, sedan, SUV, executive and luxury vehicles.',
    image: 'https://images.pexels.com/photos/9615358/pexels-photo-9615358.jpeg?auto=compress&cs=tinysrgb&w=600',
    badge: 'Most popular',
  },
];

export default function RentIndexPage() {
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-2">
          Rent any vehicle in Rwanda
        </h1>
        <p className="text-text-secondary mb-8">
          From everyday cars to specialised commercial vehicles — all on one platform.
          Pay with MTN MoMo, Airtel Money or card.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {CATEGORIES.map(cat => {
            const href = cat.href ?? `/rent/${cat.slug}`;
            return (
              <Link
                key={cat.slug || 'cars'}
                href={href}
                className="card overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-2 left-2 bg-white/90 text-text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {cat.badge}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-text-primary dark:text-white">{cat.label}</h2>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-text-secondary">{cat.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
