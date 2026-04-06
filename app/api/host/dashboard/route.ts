import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['HOST', 'BOTH', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Host access required' }, { status: 403 });
  }

  try {
    const hostId = (session.user as any).id;

    const cars = await prisma.car.findMany({
      where: { hostId },
      include: {
        _count: { select: { bookings: true } },
      },
    });

    const carIds = cars.map(c => c.id);

    const allBookings = await prisma.booking.findMany({
      where: { carId: { in: carIds } },
      include: { renter: { select: { name: true, avatar: true, email: true } }, car: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    const thisMonthBookings = allBookings.filter(
      b => b.createdAt >= thisMonthStart && b.createdAt <= thisMonthEnd && b.paymentStatus === 'PAID'
    );
    const thisMonthEarnings = thisMonthBookings.reduce((s, b) => s + b.totalAmount * 0.90, 0); // after 10% fee

    const pendingBookings = allBookings.filter(b => b.status === 'PENDING');
    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');

    const avgRating = cars.reduce((s, c) => s + c.rating, 0) / (cars.length || 1);

    // Monthly earnings chart (last 6 months)
    const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthBookings = allBookings.filter(
        b => b.createdAt >= start && b.createdAt <= end && b.paymentStatus === 'PAID'
      );
      return {
        month: format(date, 'MMM'),
        earnings: Math.round(monthBookings.reduce((s, b) => s + b.totalAmount * 0.90, 0)),
        trips: monthBookings.length,
      };
    });

    return NextResponse.json({
      stats: {
        totalEarningsThisMonth: Math.round(thisMonthEarnings),
        pendingPayouts: Math.round(pendingBookings.reduce((s, b) => s + b.totalAmount * 0.90, 0)),
        completedTrips: completedBookings.length,
        avgRating: Math.round(avgRating * 10) / 10,
        totalListings: cars.length,
        pendingRequests: pendingBookings.length,
      },
      cars,
      recentBookings: allBookings.slice(0, 20),
      pendingBookings,
      monthlyEarnings,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch host dashboard' }, { status: 500 });
  }
}
