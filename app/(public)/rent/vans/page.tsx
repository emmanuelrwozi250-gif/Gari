import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VehicleCategoryPage, buildCategoryMetadata, type CategoryConfig } from '@/components/VehicleCategoryPage';

const config: CategoryConfig = {
  slug: 'vans',
  heading: 'Van Rental in Rwanda',
  subheading: 'Hire cargo vans and panel vans across Rwanda for deliveries, office moves, catering, and events. More payload than a pickup, easier to drive than a truck.',
  heroImage: 'https://images.pexels.com/photos/4481323/pexels-photo-4481323.jpeg?auto=compress&cs=tinysrgb&w=1200',
  useCases: [
    'Office & home removals',
    'Event catering logistics',
    'E-commerce last-mile delivery',
    'Exhibition & market stall setup',
    'School & NGO supply runs',
    'Furniture & appliance delivery',
  ],
  searchTypes: ['VAN'],
  faqs: [
    {
      q: 'What is the typical payload capacity of vans on Gari?',
      a: 'Most cargo vans listed carry 800 kg to 1,500 kg. The exact payload and cargo volume (m³) are listed on each vehicle\'s page.',
    },
    {
      q: 'Do vans come with a driver or is self-drive only?',
      a: 'Both options are available. Self-drive vans are popular for local moves; vans with drivers are recommended for longer routes or when loading help is needed.',
    },
    {
      q: 'Can I rent a van for a few hours instead of a full day?',
      a: 'Some hosts offer half-day rates — check the listing notes or message the host via WhatsApp to arrange a custom rate for shorter hires.',
    },
    {
      q: 'Are branded or unmarked vans available?',
      a: 'Most vans are plain/unmarked. If you need a specific colour or livery, contact the host directly to discuss options.',
    },
  ],
};

export const metadata: Metadata = buildCategoryMetadata(config);

export default async function VansPage() {
  let vehicles: {
    id: string; make: string; model: string; year: number;
    pricePerDay: number; photos: string[]; district: string;
    rating: number; instantBooking: boolean;
  }[] = [];

  try {
    vehicles = await prisma.car.findMany({
      where: { type: 'VAN', isAvailable: true },
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, photos: true, district: true, rating: true, instantBooking: true },
      orderBy: { rating: 'desc' },
      take: 12,
    });
  } catch { /* demo fallback */ }

  return <VehicleCategoryPage config={config} vehicles={vehicles} />;
}
