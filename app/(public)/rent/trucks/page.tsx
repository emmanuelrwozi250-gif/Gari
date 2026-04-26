import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VehicleCategoryPage, buildCategoryMetadata, type CategoryConfig } from '@/components/VehicleCategoryPage';

const config: CategoryConfig = {
  slug: 'trucks',
  heading: 'Truck Hire in Rwanda',
  subheading: 'Rent cargo trucks, flatbeds and heavy-duty vehicles across Rwanda. Perfect for moving goods, construction materials, and large freight. Pay with MTN MoMo or Airtel Money.',
  heroImage: 'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=1200',
  useCases: [
    'Moving house or office',
    'Construction material delivery',
    'Agricultural produce transport',
    'Industrial equipment haulage',
    'Event setup & teardown',
    'Cross-border cargo (EAC)',
  ],
  searchTypes: ['TRUCK', 'PICKUP'],
  faqs: [
    {
      q: 'Do I need a special licence to rent a truck?',
      a: 'For trucks over 3.5 tonnes you need a Category C driving licence. For lighter pickups a standard B licence is sufficient. Hosts specify the licence requirement on their listing.',
    },
    {
      q: 'Can I hire a truck with a driver?',
      a: 'Yes — many hosts offer a professional driver for an additional daily rate. Select "With Driver" when booking and the driver handles all loading logistics.',
    },
    {
      q: 'What is the minimum hire period?',
      a: 'Most trucks are available from 1 day. Some hosts require a minimum of 3 days for long-haul or cross-border trips.',
    },
    {
      q: 'Is the security deposit refundable?',
      a: 'Yes. The deposit is held during the rental and fully refunded within 48 hours of safe return, provided there is no damage.',
    },
  ],
};

export const metadata: Metadata = buildCategoryMetadata(config);

export default async function TrucksPage() {
  let vehicles: {
    id: string; make: string; model: string; year: number;
    pricePerDay: number; photos: string[]; district: string;
    rating: number; instantBooking: boolean;
  }[] = [];

  try {
    vehicles = await prisma.car.findMany({
      where: { type: { in: ['TRUCK', 'PICKUP'] }, isAvailable: true },
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, photos: true, district: true, rating: true, instantBooking: true },
      orderBy: { rating: 'desc' },
      take: 12,
    });
  } catch { /* demo fallback */ }

  return <VehicleCategoryPage config={config} vehicles={vehicles} />;
}
