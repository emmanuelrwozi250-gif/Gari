import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VehicleCategoryPage, buildCategoryMetadata, type CategoryConfig } from '@/components/VehicleCategoryPage';

const config: CategoryConfig = {
  slug: 'buses',
  heading: 'Bus & Minibus Hire Rwanda',
  subheading: 'Rent buses, coasters, and minibuses for group travel across Rwanda. From 14-seater matatus to 60-seat coaches — with or without a driver. MICE, weddings, school trips and more.',
  heroImage: 'https://images.pexels.com/photos/3764569/pexels-photo-3764569.jpeg?auto=compress&cs=tinysrgb&w=1200',
  useCases: [
    'Conference & MICE transfers',
    'Wedding guest transport',
    'School trips & excursions',
    'Church & community groups',
    'Airport shuttle groups',
    'Corporate staff shuttles',
  ],
  searchTypes: ['MINIBUS', 'BUS'],
  faqs: [
    {
      q: 'What sizes of buses are available?',
      a: 'Gari lists 14-seater minibuses (Toyota HiAce), 25-seater coasters (Toyota Coaster), and full-size 45–60 seat coaches. Each listing shows the exact seat count.',
    },
    {
      q: 'Is a driver always included with a bus?',
      a: 'For full-size buses a professional driver is mandatory. For 14-seater minibuses, self-drive is possible with a valid Category B licence and host approval.',
    },
    {
      q: 'Can I book a bus for a multi-day tour?',
      a: 'Yes — buses are frequently booked for 3–10 day conference or gorilla trekking circuits. Multi-day rates are usually negotiated directly with the host.',
    },
    {
      q: 'Is the bus wheelchair accessible?',
      a: 'Accessible buses are not currently widespread but can be requested. Message the host before booking to confirm accessibility features.',
    },
  ],
};

export const metadata: Metadata = buildCategoryMetadata(config);

export default async function BusesPage() {
  let vehicles: {
    id: string; make: string; model: string; year: number;
    pricePerDay: number; photos: string[]; district: string;
    rating: number; instantBooking: boolean;
  }[] = [];

  try {
    vehicles = await prisma.car.findMany({
      where: { type: { in: ['MINIBUS', 'BUS'] }, isAvailable: true },
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, photos: true, district: true, rating: true, instantBooking: true },
      orderBy: { rating: 'desc' },
      take: 12,
    });
  } catch { /* demo fallback */ }

  return <VehicleCategoryPage config={config} vehicles={vehicles} />;
}
