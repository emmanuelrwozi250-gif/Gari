import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

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
    if (carIds.length === 0) {
      return NextResponse.json({
        stats: { totalEarningsThisMonth: 0, pendingPayouts: 0, completedTrips: 0, avgRating: 0, totalListings: 0, pendingRequests: 0 },
        cars: [],
        recentBookings: [],
        pendingBookings: [],
        monthlyEarnings: [],
      });
    }

    const now = new Date();
    // Scope to last 6 months only — avoids full table scans on large booking histories
    const sixMonthsAgo = subMonths(now, 6);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    // Single query scoped to 6-month window with lean select
    const allBookings = await prisma.booking.findMany({
      where: {
        carId: { in: carIds },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        platformFee: true,
        vatAmount: true,
        createdAt: true,
        pickupDate: true,
        returnDate: true,
        pickupLocation: true,
        withDriver: true,
        totalDays: true,
        carId: true,
        renterId: true,
        renter: { select: { name: true, avatar: true, email: true } },
        car: { select: { id: true, make: true, model: true, year: true, photos: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Pending bookings (no date filter — could be older)
    const pendingBookings = await prisma.booking.findMany({
      where: { carId: { in: carIds }, status: 'PENDING' },
      select: {
        id: true, status: true, paymentStatus: true, totalAmount: true,
        platformFee: true, vatAmount: true, createdAt: true,
        pickupDate: true, returnDate: true, pickupLocation: true,
        withDriver: true, totalDays: true, carId: true, renterId: true,
        renter: { select: { name: true, avatar: true, email: true } },
        car: { select: { id: true, make: true, model: true, year: true, photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const thisMonthBookings = allBookings.filter(
      b => b.createdAt >= thisMonthStart && b.createdAt <= thisMonthEnd && b.paymentStatus === 'PAID'
    );
    const hostNet = (b: { totalAmount: number; vatAmount: number | null; platformFee: number }) =>
      b.totalAmount - (b.vatAmount ?? 0) - b.platformFee;

    const thisMonthEarnings = thisMonthBookings.reduce((s, b) => s + hostNet(b), 0);
    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
    const avgRating = cars.reduce((s, c) => s + c.rating, 0) / (cars.length || 1);

    // Monthly earnings chart — computed from the already-fetched 6-month window
    const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthBookings = allBookings.filter(
        b => b.createdAt >= start && b.createdAt <= end && b.paymentStatus === 'PAID'
      );
      return {
        month: format(date, 'MMM'),
        earnings: Math.round(monthBookings.reduce((s, b) => s + hostNet(b), 0)),
        trips: monthBookings.length,
      };
    });

    return NextResponse.json({
      stats: {
        totalEarningsThisMonth: Math.round(thisMonthEarnings),
        pendingPayouts: Math.round(pendingBookings.reduce((s, b) => s + hostNet(b), 0)),
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
