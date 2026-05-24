import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config/company';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/admin',
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/messages',
          '/bookings',
          '/host/new',
          '/host/cars',
          '/sell/new',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
