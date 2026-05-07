import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/operator/analytics
 * Auth: HOST/BOTH/ADMIN required.
 *
 * Returns 30 days of daily CarAnalytics for all cars owned by the
 * current operator, plus lifetime totals from the Car model.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || !['HOST', 'BOTH', 'ADMIN'].includes(user.role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Fetch operator's cars with lifetime counters
  const cars = await prisma.car.findMany({
    where: { hostId: user.id },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      viewCount:  true,
      clickCount: true,
      totalTrips: true,
      isFeatured: true,
      featuredUntil: true,
      complianceStatus: true,
      analytics: {
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, views: true, clicks: true, bookings: true, revenue: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute CVR per car
  const result = cars.map(car => ({
    ...car,
    cvr: car.clickCount > 0
      ? Math.round((car.totalTrips / car.clickCount) * 100)
      : 0,
  }));

  return NextResponse.json({ cars: result });
}
