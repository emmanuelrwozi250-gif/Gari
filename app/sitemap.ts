import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = process.env.NEXTAUTH_URL || 'https://gari.rw';

function url(path: string): string {
  return `${BASE}${path}`;
}

const STATIC: MetadataRoute.Sitemap = [
  { url: url('/'),                changeFrequency: 'daily',   priority: 1.0 },
  { url: url('/search'),          changeFrequency: 'hourly',  priority: 0.95 },
  { url: url('/safari'),          changeFrequency: 'weekly',  priority: 0.85 },
  { url: url('/airport-transfer'),changeFrequency: 'weekly',  priority: 0.85 },
  { url: url('/map'),             changeFrequency: 'daily',   priority: 0.80 },
  { url: url('/host'),            changeFrequency: 'monthly', priority: 0.75 },
  { url: url('/corporate'),       changeFrequency: 'monthly', priority: 0.70 },
  { url: url('/rent'),            changeFrequency: 'weekly',  priority: 0.70 },
  { url: url('/rent/trucks'),     changeFrequency: 'weekly',  priority: 0.65 },
  { url: url('/rent/vans'),       changeFrequency: 'weekly',  priority: 0.65 },
  { url: url('/rent/buses'),      changeFrequency: 'weekly',  priority: 0.65 },
  { url: url('/rent/tractors'),   changeFrequency: 'weekly',  priority: 0.60 },
  { url: url('/rent/cold-trucks'),changeFrequency: 'weekly',  priority: 0.60 },
  { url: url('/faq'),             changeFrequency: 'monthly', priority: 0.60 },
  { url: url('/safety'),          changeFrequency: 'monthly', priority: 0.60 },
  { url: url('/insurance'),       changeFrequency: 'monthly', priority: 0.55 },
  { url: url('/contact'),         changeFrequency: 'monthly', priority: 0.55 },
  { url: url('/terms'),           changeFrequency: 'monthly', priority: 0.40 },
  { url: url('/privacy'),         changeFrequency: 'monthly', priority: 0.40 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let carRoutes: MetadataRoute.Sitemap = [];

  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, isVerified: true },
      select: { id: true, slug: true, updatedAt: true },
    });

    carRoutes = cars.map(car => ({
      url: url(`/cars/${car.slug ?? car.id}`),
      lastModified: car.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.80,
    }));
  } catch {
    // DB not available during build — skip dynamic routes
  }

  return [...STATIC, ...carRoutes];
}
