import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { VehicleCategoryPage, buildCategoryMetadata, type CategoryConfig } from '@/components/VehicleCategoryPage';

const config: CategoryConfig = {
  slug: 'tractors',
  heading: 'Tractor Rental in Rwanda',
  subheading: 'Hire tractors and agricultural equipment across Rwanda\'s farming districts. Ideal for land preparation, harvesting, and large-scale farming. Book by the day or season.',
  heroImage: 'https://images.pexels.com/photos/158028/belinda-farm-rural-tractor-158028.jpeg?auto=compress&cs=tinysrgb&w=1200',
  useCases: [
    'Land preparation & ploughing',
    'Harvesting & threshing',
    'Irrigation & water pumping',
    'Tea & coffee farm operations',
    'Rice paddy cultivation',
    'School / NGO farm projects',
  ],
  searchTypes: ['TRACTOR'],
  faqs: [
    {
      q: 'Can I rent a tractor without experience?',
      a: 'All tractor rentals come with the option of a certified operator. If you have experience, self-operation is available — the host will assess your competency on site.',
    },
    {
      q: 'Which districts have tractors available?',
      a: 'Tractors are most commonly available in agricultural districts: Kayonza, Bugesera, Muhanga, Huye, and Musanze. Use the map or search filters to find tractors near your farm.',
    },
    {
      q: 'Can I hire a tractor for a full season?',
      a: 'Yes — seasonal rates (2–4 weeks) are available from many hosts at a discounted rate. Contact the host via WhatsApp after booking to arrange a seasonal agreement.',
    },
    {
      q: 'What attachments are included?',
      a: 'Standard attachments (plough, harrow) are usually included. Specialised implements such as seeders or subsoilers are noted in the listing description.',
    },
  ],
};

export const metadata: Metadata = buildCategoryMetadata(config);

export default async function TractorsPage() {
  let vehicles: {
    id: string; make: string; model: string; year: number;
    pricePerDay: number; photos: string[]; district: string;
    rating: number; instantBooking: boolean;
  }[] = [];

  try {
    vehicles = await prisma.car.findMany({
      where: { type: 'TRACTOR', isAvailable: true },
      select: { id: true, make: true, model: true, year: true, pricePerDay: true, photos: true, district: true, rating: true, instantBooking: true },
      orderBy: { rating: 'desc' },
      take: 12,
    });
  } catch { /* demo fallback */ }

  return <VehicleCategoryPage config={config} vehicles={vehicles} />;
}
