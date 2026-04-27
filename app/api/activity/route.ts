import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Fallback events used when DB has fewer than 3 real events
const FALLBACK = [
  '3 cars booked in Musanze this week 🦍 · Today',
  'Jean-Pierre earned RWF 225,000 this week · Today',
  '18 bookings made in the last 24 hours 🚗 · Just now',
  'New host listed a Mercedes C200 in Kicukiro · 35 min ago',
  'Patrick M. completed a 5-day Akagera safari trip · 3 hours ago',
];

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 2) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;
  if (diffD === 1) return 'Yesterday';
  return `${diffD} days ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export async function GET() {
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // last 14 days

    const [recentBookings, recentReviews] = await Promise.all([
      prisma.booking.findMany({
        where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
        include: {
          renter: { select: { name: true } },
          car: { select: { make: true, model: true, district: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.review.findMany({
        where: { createdAt: { gte: since } },
        include: {
          reviewer: { select: { name: true } },
          car: { select: { make: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
    ]);

    const events: string[] = [];

    for (const b of recentBookings) {
      if (!b.renter?.name || !b.car) continue;
      const renter = initials(b.renter.name);
      const district = b.car.district
        ? b.car.district.charAt(0).toUpperCase() + b.car.district.slice(1).toLowerCase()
        : 'Kigali';
      events.push(
        `${renter} just booked a ${b.car.make} ${b.car.model} in ${district} · ${relativeTime(b.createdAt)}`
      );
    }

    for (const r of recentReviews) {
      if (!r.reviewer?.name || !r.car) continue;
      const reviewer = initials(r.reviewer.name);
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      events.push(
        `${reviewer} gave a ${r.rating}${stars.slice(0, 1)} review for a ${r.car.make} ${r.car.model} · ${relativeTime(r.createdAt)}`
      );
    }

    // Supplement with fallback if we have fewer than 3 real events
    const combined = [...events];
    if (combined.length < 3) {
      combined.push(...FALLBACK.slice(0, 5 - combined.length));
    }

    return NextResponse.json({ events: combined.slice(0, 10) });
  } catch {
    // Always return something — ticker should never break the page
    return NextResponse.json({ events: FALLBACK });
  }
}
