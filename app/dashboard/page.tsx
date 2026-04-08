import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatRWF, formatDate, getBookingStatusColor } from '@/lib/utils';
import {
  Car, Calendar, BadgeCheck, Star, Bell, ChevronRight,
  Clock, MapPin, Shield, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = { title: 'My Dashboard — Gari' };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard');

  const userId = (session.user as any).id;

  let user: any = null, bookings: any[] = [], notifications: any[] = [];
  try {
    [user, bookings, notifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, avatar: true, role: true, nidaVerified: true, licenseVerified: true, createdAt: true },
      }),
      prisma.booking.findMany({
        where: { renterId: userId },
        include: { car: { include: { host: { select: { name: true, avatar: true } } } }, review: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
  } catch {
    // DB not connected yet — show empty dashboard
  }

  if (!user) redirect('/login');

  const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(b.status));
  const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));
  const pendingReviews = pastBookings.filter(b => b.status === 'COMPLETED' && !b.review);

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
              Welcome back, {user.name?.split(' ')[0]}!
            </h1>
            <p className="text-text-secondary mt-1">Manage your bookings and account</p>
          </div>
          {(user.role === 'HOST' || user.role === 'BOTH' || user.role === 'ADMIN') && (
            <Link href="/dashboard/host" className="btn-secondary">
              Host Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {user.name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-text-primary dark:text-white">{user.name}</div>
                  <div className="text-text-secondary text-sm">{user.email}</div>
                  <div className="text-text-light text-xs mt-0.5">Member since {formatDate(user.createdAt)}</div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-2">Verification Status</h3>
                {[
                  { label: 'National ID (NIDA)', verified: user.nidaVerified, icon: Shield },
                  { label: 'Driving Licence', verified: user.licenseVerified, icon: Car },
                ].map(({ label, verified, icon: Icon }) => (
                  <div key={label} className={`flex items-center justify-between p-2.5 rounded-xl ${verified ? 'bg-primary-light' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className={`w-4 h-4 ${verified ? 'text-primary' : 'text-text-light'}`} />
                      <span className={verified ? 'text-primary font-medium' : 'text-text-secondary'}>{label}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verified ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                ))}
                {!user.nidaVerified && (
                  <Link href="/profile/verify" className="block w-full text-center py-2 text-xs text-primary font-medium hover:underline">
                    Complete verification →
                  </Link>
                )}
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" /> Notifications
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </h3>
                </div>
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 bg-primary-light dark:bg-primary/10 rounded-xl">
                      <div className="font-medium text-sm text-text-primary dark:text-white">{n.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="card p-5">
              <h3 className="font-semibold mb-3 text-text-primary dark:text-white">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/search" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Car className="w-4 h-4 text-primary" /> Browse Cars
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light" />
                </Link>
                <Link href="/host/new" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <BadgeCheck className="w-4 h-4 text-primary" /> List Your Car
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-light" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Bookings */}
            <div>
              <h2 className="font-bold text-lg text-text-primary dark:text-white mb-4">
                Active Bookings ({activeBookings.length})
              </h2>
              {activeBookings.length > 0 ? (
                <div className="space-y-4">
                  {activeBookings.map(booking => (
                    <div key={booking.id} className="card p-5">
                      <div className="flex gap-4">
                        <img
                          src={booking.car.photos[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200'}
                          alt={booking.car.make}
                          className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-text-primary dark:text-white">
                                {booking.car.year} {booking.car.make} {booking.car.model}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                                <MapPin className="w-3 h-3" /> {booking.pickupLocation}
                              </div>
                            </div>
                            <span className={`badge text-xs ${getBookingStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}
                            </div>
                            <div className="font-semibold text-primary">
                              {formatRWF(booking.totalAmount)}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link href={`/cars/${booking.carId}`} className="text-xs text-primary hover:underline">
                              View Car
                            </Link>
                            {booking.status === 'PENDING' && (
                              <span className="text-xs text-text-light">• Awaiting host confirmation</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <Car className="w-10 h-10 text-text-light mx-auto mb-3" />
                  <p className="text-text-secondary">No active bookings</p>
                  <Link href="/search" className="btn-primary mt-4 text-sm py-2 px-5">
                    Browse Cars
                  </Link>
                </div>
              )}
            </div>

            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-text-primary dark:text-white mb-4">
                  Pending Reviews ({pendingReviews.length})
                </h2>
                <div className="space-y-3">
                  {pendingReviews.map(booking => (
                    <div key={booking.id} className="card p-4 flex items-center gap-4">
                      <img
                        src={booking.car.photos[0] || '/images/car-placeholder.jpg'}
                        alt=""
                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{booking.car.make} {booking.car.model}</div>
                        <div className="text-xs text-text-secondary">{formatDate(booking.returnDate)}</div>
                      </div>
                      <Link href={`/review/${booking.id}`} className="btn-primary text-xs py-2 px-4">
                        <Star className="w-3 h-3" /> Write Review
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-text-primary dark:text-white mb-4">
                  Past Bookings
                </h2>
                <div className="space-y-3">
                  {pastBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="card p-4 flex items-center gap-4 opacity-75">
                      <img
                        src={booking.car.photos[0] || '/images/car-placeholder.jpg'}
                        alt=""
                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-text-primary dark:text-white">
                          {booking.car.year} {booking.car.make} {booking.car.model}
                        </div>
                        <div className="text-xs text-text-secondary">{formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm text-text-primary dark:text-white">{formatRWF(booking.totalAmount)}</div>
                        <span className={`badge text-xs ${getBookingStatusColor(booking.status)}`}>{booking.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
