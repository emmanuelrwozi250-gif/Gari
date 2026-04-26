import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VehicleCategoryPage, buildCategoryMetadata, type CategoryConfig } from '@/components/VehicleCategoryPage';

const config: CategoryConfig = {
  slug: 'cold-trucks',
  heading: 'Refrigerated Truck Hire Rwanda',
  subheading: 'Rent cold chain trucks and refrigerated vans for perishable goods across Rwanda. Maintain 0–8°C throughout transport — ideal for food, pharmaceuticals, and flowers.',
  heroImage: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1200',
  useCases: [
    'Fresh produce & vegetables',
    'Meat, fish & dairy distribution',
    'Pharmaceutical cold chain',
    'Flower & cut-flower export',
    'Brewery & beverage logistics',
    'Hospital & clinic supplies',
  ],
  searchTypes: ['COLD_TRUCK'],
  faqs: [
    {
      q: 'What temperature range can cold trucks maintain?',
      a: 'Most cold trucks on Gari maintain between 0°C and +8°C. Some units offer -18°C deep-freeze capability — look for the "Deep Freeze" badge in the listing.',
    },
    {
      q: 'Are cold trucks available for same-day hire?',
      a: 'Yes, instant-booking cold trucks are available in Kigali. For trips starting outside Kigali, a 24-hour advance notice is recommended.',
    },
    {
      q: 'Who is responsible if the cargo spoils due to equipment failure?',
      a: 'Hosts carry liability for equipment malfunction. Gari\'s dispute resolution handles claims within 48 hours. We recommend documenting cargo temperature at departure and arrival.',
    },
    {
      q: 'Can I book for a multi-day distribution route?',
      a: 'Absolutely — multi-day routes are common for food distributors. The daily rate applies; most hosts include unlimited km within Rwanda.',
    },
  ],
};

export const metadata: Metadata = buildCategoryMetadata(config);

export default async function ColdTrucksPage() {
  let vehicles: {
    id: string; make: string; model: string; year: number;
    pricePerDay: number; photos: string[]; district: string;
    rating: number; instantBooking: boolean;
  }[] = [];

  try {
    vehicles = await prisma.car.findMany({
      where: { type: 'COLD_TRUCK', isAvailable: true },
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, photos: true, district: true, rating: true, instantBooking: true },
      orderBy: { rating: 'desc' },
      take: 12,
    });
  } catch { /* demo fallback */ }

  return <VehicleCategoryPage config={config} vehicles={vehicles} />;
}
