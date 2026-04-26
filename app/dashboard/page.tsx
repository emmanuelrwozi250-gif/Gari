import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import {
  Car, BadgeCheck, Bell, ChevronRight, Shield, ArrowRight
} from 'lucide-react';
import { RenterBookingsList } from '@/components/RenterBookingsList';

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
        include: {
          car: { include: { host: { select: { name: true, avatar: true } } } },
          review: true,
          dispute: { select: { id: true, status: true, renterResponse: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
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
          <div className="lg:col-span-2">
            <h2 className="font-bold text-lg text-text-primary dark:text-white mb-4">My Bookings</h2>
            <RenterBookingsList
              bookings={bookings.map(b => ({
                id: b.id,
                carId: b.carId,
                status: b.status,
                pickupDate: b.pickupDate.toISOString(),
                returnDate: b.returnDate.toISOString(),
                createdAt: b.createdAt.toISOString(),
                pickupLocation: b.pickupLocation,
                totalAmount: b.totalAmount,
                depositAmount: b.depositAmount,
                depositStatus: b.depositStatus,
                depositRefundedAt: (b as any).depositRefundedAt?.toISOString() ?? null,
                depositRefundAmount: (b as any).depositRefundAmount ?? null,
                cancelledAt: (b as any).cancelledAt?.toISOString() ?? null,
                completedAt: (b as any).completedAt?.toISOString() ?? null,
                cancellationPolicy: ((b.car as any).cancellationPolicy ?? 'MODERATE') as 'FLEXIBLE' | 'MODERATE' | 'STRICT',
                car: {
                  year: b.car.year,
                  make: b.car.make,
                  model: b.car.model,
                  photos: b.car.photos,
                  pricePerDay: b.car.pricePerDay,
                },
                review: !!b.review,
                dispute: (b as any).dispute ?? null,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
