import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatRWF, formatDate, getBookingStatusColor, getCarTypeLabel } from '@/lib/utils';
import {
  TrendingUp, Car, Users, Star, PlusCircle, ChevronRight,
  CheckCircle, X, Clock, Banknote, ArrowRight, BarChart3, Lightbulb,
  Lock, AlertTriangle,
} from 'lucide-react';
import { EarningsDashboard } from '@/components/EarningsDashboard';
import { BookingActionButtons } from '@/components/BookingActionButtons';
import { LateReturnPanel } from '@/components/LateReturnPanel';
import { HostReviewForm } from '@/components/HostReviewForm';

export const metadata: Metadata = { title: 'Host Dashboard — Gari' };

async function getHostData(userId: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/host/dashboard`, {
    headers: { Cookie: '' }, // server-side, session handled differently
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function HostDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard/host');

  const role = (session.user as any).role;
  if (!['HOST', 'BOTH', 'ADMIN'].includes(role)) redirect('/dashboard');

  // For SSR, we'll fetch data directly via Prisma instead of the API
  const { prisma } = await import('@/lib/prisma');
  const { startOfMonth, endOfMonth, subMonths, format } = await import('date-fns');

  const userId = (session.user as any).id;
  const now = new Date();

  const cars = await prisma.car.findMany({
    where: { hostId: userId },
    include: { _count: { select: { bookings: true, reviews: true } } },
  });

  const carIds = cars.map(c => c.id);

  const allBookings = await prisma.booking.findMany({
    where: { carId: { in: carIds } },
    include: {
      renter: { select: { name: true, avatar: true, email: true, phone: true, whatsappNumber: true } },
      car: true,
      hostReview: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const thisMonthStart = startOfMonth(now);
  const thisMonthBookings = allBookings.filter(
    b => b.createdAt >= thisMonthStart && b.paymentStatus === 'PAID'
  );
  const thisMonthEarnings = Math.round(thisMonthBookings.reduce((s, b) => s + b.totalAmount * 0.90, 0));
  const pendingBookings = allBookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED');
  const activeBookings = allBookings.filter(b => b.status === 'ACTIVE');
  const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
  const avgRating = cars.length > 0 ? cars.reduce((s, c) => s + c.rating, 0) / cars.length : 0;

  // A) Total lifetime earnings — query all paid bookings (not limited to take: 50)
  const lifetimeAgg = await prisma.booking.aggregate({
    where: { carId: { in: carIds }, paymentStatus: 'PAID' },
    _sum: { totalAmount: true },
  });
  const lifetimeEarnings = Math.round((lifetimeAgg._sum.totalAmount ?? 0) * 0.9);

  // C) Deposit status summary — direct aggregates to cover all bookings
  const depositsHeldAgg = await prisma.booking.aggregate({
    where: { carId: { in: carIds }, depositStatus: 'HELD' },
    _sum: { depositAmount: true },
  });
  const depositsHeld = depositsHeldAgg._sum.depositAmount ?? 0;

  const depositsReleasedAgg = await prisma.booking.aggregate({
    where: { carId: { in: carIds }, depositStatus: 'RELEASED', updatedAt: { gte: thisMonthStart } },
    _sum: { depositAmount: true },
  });
  const depositsReleasedThisMonth = depositsReleasedAgg._sum.depositAmount ?? 0;

  // D) Unverified renter check — pending bookings where renter hasn't verified NIDA
  const pendingRenterIds = Array.from(new Set(pendingBookings.map(b => b.renterId)));
  const unverifiedRenters = pendingRenterIds.length > 0
    ? await prisma.user.count({
        where: { id: { in: pendingRenterIds }, nidaVerified: false },
      })
    : 0;

  // B) Per-car revenue table data — use groupBy aggregates so we aren't limited by take: 50
  const carAllTimeAgg = await prisma.booking.groupBy({
    by: ['carId'],
    where: { carId: { in: carIds }, paymentStatus: 'PAID' },
    _sum: { totalAmount: true },
  });
  const carCompletedAgg = await prisma.booking.groupBy({
    by: ['carId'],
    where: { carId: { in: carIds }, paymentStatus: 'PAID', status: 'COMPLETED' },
    _count: { id: true },
  });
  const carAllTimeMap = new Map(carAllTimeAgg.map(r => [r.carId, r._sum.totalAmount ?? 0]));
  const carCompletedMap = new Map(carCompletedAgg.map(r => [r.carId, r._count.id]));

  type CarRevenueRow = {
    id: string;
    name: string;
    isAvailable: boolean;
    bookingsCount: number;
    thisMonthRevenue: number;
    allTimeRevenue: number;
    avgPerBooking: number;
  };
  const carRevenueRows: CarRevenueRow[] = cars.map(car => {
    // This-month revenue still uses allBookings (recent 50 records) — acceptable for monthly view
    const carBookingsThisMonth = allBookings.filter(
      b => b.carId === car.id && b.paymentStatus === 'PAID' && b.createdAt >= thisMonthStart
    );
    const thisMonthCarRevenue = Math.round(
      carBookingsThisMonth.reduce((s, b) => s + b.totalAmount * 0.9, 0)
    );
    const completedCount = carCompletedMap.get(car.id) ?? 0;
    const allTimeCarRevenue = Math.round((carAllTimeMap.get(car.id) ?? 0) * 0.9);
    const avgPerBooking = Math.round(allTimeCarRevenue / Math.max(completedCount, 1));
    return {
      id: car.id,
      name: `${car.year} ${car.make} ${car.model}`,
      isAvailable: car.isAvailable,
      bookingsCount: completedCount,
      thisMonthRevenue: thisMonthCarRevenue,
      allTimeRevenue: allTimeCarRevenue,
      avgPerBooking,
    };
  });

  const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const mBookings = allBookings.filter(
      b => b.createdAt >= start && b.createdAt <= end && b.paymentStatus === 'PAID'
    );
    return {
      month: format(date, 'MMM'),
      earnings: Math.round(mBookings.reduce((s, b) => s + b.totalAmount * 0.90, 0)),
      trips: mBookings.length,
    };
  });

  const maxEarnings = Math.max(...monthlyEarnings.map(m => m.earnings), 1);

  // Build per-car earnings data for EarningsDashboard
  const now2 = new Date();
  const yearStart = new Date(now2.getFullYear(), 0, 1);
  const monthStart2 = new Date(now2.getFullYear(), now2.getMonth(), 1);

  const carEarnings = await Promise.all(
    cars.map(async car => {
      const carBookings = allBookings.filter(b => b.carId === car.id && b.paymentStatus === 'PAID');
      const monthE = carBookings.filter(b => b.createdAt >= monthStart2).reduce((s, b) => s + b.totalAmount * 0.9, 0);
      const yearE = carBookings.filter(b => b.createdAt >= yearStart).reduce((s, b) => s + b.totalAmount * 0.9, 0);
      const completed = carBookings.filter(b => b.status === 'COMPLETED').length;
      // Utilisation: booked days / total days this year
      const daysSinceYearStart = Math.max(1, Math.floor((now2.getTime() - yearStart.getTime()) / 86400000));
      const bookedDays = carBookings.reduce((s, b) => s + b.totalDays, 0);
      const utilisation = Math.min(100, Math.round((bookedDays / daysSinceYearStart) * 100));
      const nextBooking = allBookings.find(b => b.carId === car.id && b.status === 'CONFIRMED' && new Date(b.pickupDate) > now2);

      // Dead days: remaining days this month that have no booking
      const monthEnd = new Date(now2.getFullYear(), now2.getMonth() + 1, 0);
      const daysLeftThisMonth = Math.max(0, monthEnd.getDate() - now2.getDate() + 1);
      const activeCarBookings = allBookings.filter(b => b.carId === car.id && ['CONFIRMED', 'ACTIVE'].includes(b.status));
      // Count booked days within remaining days of this month
      let bookedDaysThisMonth = 0;
      for (const b of activeCarBookings) {
        const start = new Date(Math.max(b.pickupDate.getTime(), now2.getTime()));
        const end = new Date(Math.min(b.returnDate.getTime(), monthEnd.getTime()));
        if (end > start) bookedDaysThisMonth += Math.ceil((end.getTime() - start.getTime()) / 86400000);
      }
      const deadDaysThisMonth = Math.max(0, daysLeftThisMonth - bookedDaysThisMonth);
      const projectedAnnual = monthE > 0 ? Math.round(monthE * 12) : Math.round(yearE);

      return {
        id: car.id, make: car.make, model: car.model, year: car.year,
        source: (car as any).source || 'OWNER',
        vehicleValueRwf: (car as any).vehicleValueRwf || 0,
        pricePerDay: car.pricePerDay,
        totalTrips: car.totalTrips,
        monthEarnings: Math.round(monthE),
        yearEarnings: Math.round(yearE),
        utilisation,
        completedBookings: completed,
        deadDaysThisMonth,
        daysLeftThisMonth,
        projectedAnnual,
        nextBooking: nextBooking ? { pickupDate: nextBooking.pickupDate.toISOString(), returnDate: nextBooking.returnDate.toISOString() } : null,
      };
    })
  );

  // Pending pricing suggestions
  const pricingSuggestions = await prisma.pricingSuggestion.findMany({
    where: { status: 'pending', carId: { in: carIds } },
    include: { car: { select: { make: true, model: true, year: true } } },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Host Dashboard</h1>
            <p className="text-text-secondary">Manage your listings and bookings</p>
          </div>
          <Link href="/host/new" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> Add Listing
          </Link>
        </div>

        {/* D) Unverified renter banner */}
        {unverifiedRenters > 0 && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                Some pending renters haven&apos;t verified their identity.
              </span>{' '}
              <span className="text-amber-700 dark:text-amber-400">
                Check verification status before confirming their bookings.
              </span>
            </div>
            <Link
              href="/dashboard/host/renters"
              className="flex-shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap"
            >
              Review renters &rarr;
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Banknote, label: 'Earned This Month', value: formatRWF(thisMonthEarnings), color: 'text-primary' },
            { icon: TrendingUp, label: 'Total Earned', value: formatRWF(lifetimeEarnings), color: 'text-emerald-600' },
            { icon: Car, label: 'Total Listings', value: String(cars.length), color: 'text-blue-600' },
            { icon: Users, label: 'Completed Trips', value: String(completedBookings.length), color: 'text-purple-600' },
            { icon: Star, label: 'Average Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)}★` : 'N/A', color: 'text-accent-yellow' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-5">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-text-secondary mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Earnings Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-text-primary dark:text-white">Earnings — Last 6 Months</h2>
              </div>
              <div className="flex items-end gap-3 h-40">
                {monthlyEarnings.map(({ month, earnings, trips }) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-primary font-semibold whitespace-nowrap">
                      {earnings > 0 ? formatRWF(earnings).replace('RWF ', '') : ''}
                    </div>
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary-dark relative group"
                      style={{ height: `${Math.max(4, (earnings / maxEarnings) * 120)}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {trips} trip{trips !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-xs text-text-light">{month}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Booking Requests */}
            {pendingBookings.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-accent-yellow" />
                  Pending Requests ({pendingBookings.length})
                </h2>
                <div className="space-y-4">
                  {pendingBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{booking.renter.name} → {booking.car.make} {booking.car.model}</div>
                          <div className="text-xs text-text-secondary">
                            {formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)} · {formatRWF(booking.totalAmount)}
                            {booking.depositAmount > 0 && ` + RWF ${booking.depositAmount.toLocaleString()} deposit`}
                          </div>
                        </div>
                      </div>
                      <BookingActionButtons
                        bookingId={booking.id}
                        status={booking.status}
                        pickupDate={booking.pickupDate.toISOString()}
                        depositAmount={booking.depositAmount}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Bookings — ready to start */}
            {confirmedBookings.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  Confirmed Trips ({confirmedBookings.length})
                </h2>
                <div className="space-y-4">
                  {confirmedBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="font-medium text-sm">{booking.renter.name} → {booking.car.make} {booking.car.model}</div>
                      <div className="text-xs text-text-secondary mb-1">
                        Pickup: {formatDate(booking.pickupDate)} · {formatRWF(booking.totalAmount)}
                      </div>
                      <BookingActionButtons
                        bookingId={booking.id}
                        status={booking.status}
                        pickupDate={booking.pickupDate.toISOString()}
                        depositAmount={booking.depositAmount}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Trips */}
            {activeBookings.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2 mb-4">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  Active Trips ({activeBookings.length})
                </h2>
                <div className="space-y-4">
                  {activeBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="p-3 bg-primary/5 rounded-xl">
                      <div className="font-medium text-sm">{booking.renter.name} → {booking.car.make} {booking.car.model}</div>
                      <div className="text-xs text-text-secondary mb-1">
                        Return: {formatDate(booking.returnDate)}
                        {booking.depositAmount > 0 && ` · Deposit held: RWF ${booking.depositAmount.toLocaleString()}`}
                      </div>
                      <BookingActionButtons
                        bookingId={booking.id}
                        status={booking.status}
                        pickupDate={booking.pickupDate.toISOString()}
                        depositAmount={booking.depositAmount}
                      />
                      {booking.returnDate < now && (
                        <LateReturnPanel
                          bookingId={booking.id}
                          renterName={booking.renter.name ?? 'Renter'}
                          renterPhone={(booking.renter as any).whatsappNumber ?? (booking.renter as any).phone ?? null}
                          returnDate={booking.returnDate.toISOString()}
                          lateFeeAccrued={(booking as any).lateFeeAccrued ?? 0}
                          notif1hSentAt={(booking as any).notif1hLateSentAt?.toISOString() ?? null}
                          lateReturnReportedAt={(booking as any).lateReturnReportedAt?.toISOString() ?? null}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Trips awaiting host review */}
            {completedBookings.filter(b => !b.hostReview).length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-accent-yellow" />
                  Review Your Renters ({completedBookings.filter(b => !b.hostReview).length})
                </h2>
                <div className="space-y-4">
                  {completedBookings.filter(b => !b.hostReview).slice(0, 5).map(booking => (
                    <div key={booking.id} className="space-y-3">
                      <div className="text-sm font-medium text-text-primary dark:text-white">
                        {booking.car.make} {booking.car.model} ·{' '}
                        <span className="text-text-secondary font-normal">
                          {formatDate(booking.pickupDate)} – {formatDate(booking.returnDate)}
                        </span>
                      </div>
                      <HostReviewForm
                        bookingId={booking.id}
                        renterName={booking.renter.name ?? 'Renter'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Listings */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-text-primary dark:text-white">My Listings</h2>
                <Link href="/host/new" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" /> Add New
                </Link>
              </div>
              {cars.length > 0 ? (
                <div className="space-y-3">
                  {cars.map(car => (
                    <div key={car.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <img
                        src={car.photos[0] || '/images/car-placeholder.jpg'}
                        alt={car.make}
                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-text-primary dark:text-white">{car.year} {car.make} {car.model}</div>
                        <div className="text-xs text-text-secondary">{getCarTypeLabel(car.type)} • {formatRWF(car.pricePerDay)}/day</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-3 h-3 fill-accent-yellow text-accent-yellow" />
                          <span className="text-xs font-semibold">{car.rating > 0 ? car.rating.toFixed(1) : 'New'}</span>
                        </div>
                        <div className={`text-xs mt-0.5 ${car.isAvailable ? 'text-primary' : 'text-gray-400'}`}>
                          {car.isAvailable ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                      <Link href={`/cars/${car.id}`} className="text-text-light hover:text-primary transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-10 h-10 text-text-light mx-auto mb-3" />
                  <p className="text-text-secondary text-sm mb-4">No listings yet</p>
                  <Link href="/host/new" className="btn-primary text-sm py-2 px-5">
                    List Your First Car
                  </Link>
                </div>
              )}
            </div>

            {/* B) Revenue by Car */}
            {carRevenueRows.length > 0 && (
              <div className="card p-6 overflow-x-auto">
                <h2 className="font-bold text-text-primary dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Revenue by Car
                </h2>
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-xs text-text-secondary border-b border-border">
                      <th className="text-left pb-2 font-semibold">Car</th>
                      <th className="text-right pb-2 font-semibold">Bookings</th>
                      <th className="text-right pb-2 font-semibold">This Month</th>
                      <th className="text-right pb-2 font-semibold">All Time</th>
                      <th className="text-right pb-2 font-semibold">Avg / Booking</th>
                      <th className="text-right pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carRevenueRows.map(row => (
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-text-primary dark:text-white">
                          <Link href={`/cars/${row.id}`} className="hover:text-primary transition-colors">
                            {row.name}
                          </Link>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-text-secondary">{row.bookingsCount}</td>
                        <td className="py-2.5 text-right tabular-nums text-text-secondary">{formatRWF(row.thisMonthRevenue)}</td>
                        <td className="py-2.5 text-right tabular-nums font-semibold text-text-primary dark:text-white">{formatRWF(row.allTimeRevenue)}</td>
                        <td className="py-2.5 text-right tabular-nums text-text-secondary">{formatRWF(row.avgPerBooking)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.isAvailable ? 'bg-primary-light text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {row.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="card p-5">
              <h3 className="font-bold mb-4 text-text-primary dark:text-white">Recent Activity</h3>
              {allBookings.slice(0, 8).map(booking => (
                <div key={booking.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0 mb-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    booking.status === 'CONFIRMED' ? 'bg-blue-500' :
                    booking.status === 'COMPLETED' ? 'bg-primary' :
                    booking.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-text-primary dark:text-white truncate">
                      {booking.renter.name} booked {booking.car.make} {booking.car.model}
                    </div>
                    <div className="text-xs text-text-light">{formatDate(booking.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${getBookingStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    {booking.status === 'ACTIVE' && (
                      <Link
                        href={`/dashboard/inspect/${booking.id}`}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Inspect
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payout Settings */}
            <div className="card p-5">
              <h3 className="font-bold mb-3 text-text-primary dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" /> Payout Settings
              </h3>
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                <div>Payouts sent within 24h of trip completion</div>
                <div>via MTN MoMo or bank transfer</div>
              </div>
              <Link href="/profile/payout" className="btn-secondary text-sm py-2 w-full justify-center">
                Configure Payout
              </Link>
            </div>

            {/* C) Deposit Status Summary */}
            <div className="card p-5">
              <h3 className="font-bold mb-3 text-text-primary dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" /> Security Deposits
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Currently held</span>
                  <span className="font-bold text-text-primary dark:text-white">{formatRWF(depositsHeld)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Released this month</span>
                  <span className="font-semibold text-primary">{formatRWF(depositsReleasedThisMonth)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing Suggestions ─────────────────────────────────── */}
        {pricingSuggestions.length > 0 && (
          <div className="mt-8 card p-5">
            <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-accent-yellow" /> Pricing Suggestions
            </h2>
            <div className="space-y-3">
              {pricingSuggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl px-4 py-3">
                  <div>
                    <div className="font-medium text-sm text-text-primary dark:text-white">
                      {s.car.year} {s.car.make} {s.car.model}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      💡 Suggested: {formatRWF(s.suggestedPrice)}/day (+{Math.round((s.multiplier - 1) * 100)}%) · {s.reason}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <form action={`/api/pricing/suggestions/${s.id}`} method="POST">
                      <input type="hidden" name="action" value="apply" />
                      <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg">Apply</button>
                    </form>
                    <form action={`/api/pricing/suggestions/${s.id}`} method="POST">
                      <input type="hidden" name="action" value="ignore" />
                      <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg">Ignore</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Live Earnings Dashboard ─────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> My Cars
          </h2>
          <EarningsDashboard cars={carEarnings} />
        </div>

      </div>
    </div>
  );
}

