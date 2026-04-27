import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatRWF, formatDate, getBookingStatusColor, getCarTypeLabel } from '@/lib/utils';
import { Users, Car, CalendarDays, TrendingUp, BadgeCheck, AlertCircle, Shield, BarChart3, Tag, Building2, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin Panel — Gari' };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const results = await Promise.allSettled([
    prisma.user.count(),
    prisma.car.count({ where: { isAvailable: true } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.car.findMany({ where: { isVerified: false, isAvailable: true }, take: 10, include: { host: { select: { name: true, email: true } } } }),
    prisma.booking.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: { car: true, renter: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ take: 20, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, nidaVerified: true, createdAt: true } }),
    prisma.salesListing.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { seller: { select: { name: true, email: true, nidaVerified: true } } } }),
    prisma.buyEarnLead.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
    prisma.financingApplication.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true, phone: true } } } }),
    prisma.trustCircle.findMany({ include: { _count: { select: { members: true } } } }),
  ]);

  const pick = (i: number, fb: any) =>
    results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value : fb;

  const userCount      = pick(0, 0) as number;
  const carCount       = pick(1, 0) as number;
  const bookingCount   = pick(2, 0) as number;
  const pendingCars    = pick(3, []) as any[];
  const recentBookings = pick(4, []) as any[];
  const users          = pick(5, []) as any[];
  const salesListings  = pick(6, []) as any[];
  const earnLeads      = pick(7, []) as any[];
  const financingApps  = pick(8, []) as any[];
  const trustCircles   = pick(9, []) as any[];

  const totalRevenue = await prisma.booking.aggregate({
    where: { paymentStatus: 'PAID' },
    _sum: { platformFee: true },
  }).catch(() => ({ _sum: { platformFee: 0 } }));

  const gmv = await prisma.booking.aggregate({
    where: { paymentStatus: 'PAID' },
    _sum: { totalAmount: true },
  }).catch(() => ({ _sum: { totalAmount: 0 } }));

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Admin Panel</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: userCount.toLocaleString(), icon: Users, color: 'text-blue-600' },
            { label: 'Active Listings', value: carCount.toLocaleString(), icon: Car, color: 'text-primary' },
            { label: 'Completed Trips', value: bookingCount.toLocaleString(), icon: CalendarDays, color: 'text-purple-600' },
            { label: 'Platform Revenue', value: formatRWF(totalRevenue._sum.platformFee || 0), icon: TrendingUp, color: 'text-accent-yellow' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <Icon className={`w-6 h-6 ${color} mb-3`} />
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-text-secondary mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="text-sm text-text-secondary">
            Total GMV: <strong className="text-primary">{formatRWF(gmv._sum.totalAmount || 0)}</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/earn" className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
              <TrendingUp className="w-3.5 h-3.5" /> Buy &amp; Earn Listings
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
            <Link href="/admin/trust-circles" className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Trust Circles
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
            <Link href="/admin/foreign-verifications" className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
              <Globe className="w-3.5 h-3.5" /> Foreign Verifications
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cars awaiting verification */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Listings Awaiting Verification ({pendingCars.length})
            </h2>
            {pendingCars.length > 0 ? (
              <div className="space-y-3">
                {pendingCars.map(car => (
                  <div key={car.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <img src={car.photos[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200'} alt={car.make}
                      className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{car.year} {car.make} {car.model}</div>
                      <div className="text-xs text-text-secondary">Host: {(car as any).host?.name} ({(car as any).host?.email})</div>
                      <div className="text-xs text-text-secondary">{getCarTypeLabel(car.type)} • {formatRWF(car.pricePerDay)}/day</div>
                    </div>
                    <div className="flex gap-2">
                      <VerifyCarButton carId={car.id} verify />
                      <VerifyCarButton carId={car.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-text-secondary">
                <BadgeCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                All listings verified!
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Recent Bookings
            </h2>
            <div className="space-y-2 overflow-auto max-h-80">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{b.renter.name} → {b.car.make} {b.car.model}</div>
                    <div className="text-xs text-text-light">{formatDate(b.createdAt)} • {formatRWF(b.totalAmount)}</div>
                  </div>
                  <span className={`badge text-xs ${getBookingStatusColor(b.status)}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recent Users
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-light border-b border-border">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">NIDA</th>
                    <th className="pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-2 font-medium">{u.name}</td>
                      <td className="py-2 text-text-secondary">{u.email}</td>
                      <td className="py-2">
                        <span className={`badge text-xs ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          u.role === 'HOST' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'BOTH' ? 'bg-purple-100 text-purple-700' : 'badge-green'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-2">
                        {u.nidaVerified
                          ? <BadgeCheck className="w-4 h-4 text-primary" />
                          : <span className="text-xs text-text-light">Pending</span>}
                      </td>
                      <td className="py-2 text-text-secondary">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* end grid lg:grid-cols-2 */}

        {/* ── Sales Listings ───────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-text-primary dark:text-white">Sales Listings ({salesListings.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Vehicle', 'Price', 'Tier', 'Status', 'Seller', 'Listed', 'Expires'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salesListings.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium"><Link href={`/buy/${l.id}`} className="text-primary hover:underline">{l.year} {l.make} {l.model}</Link></td>
                    <td className="px-4 py-3">{formatRWF(l.askingPrice)}</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{l.listingTier.toLowerCase()}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : l.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{l.seller.name}{l.seller.nidaVerified ? ' ✓' : ''}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(l.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Buy & Earn Leads ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-text-primary dark:text-white">Buy & Earn Leads ({earnLeads.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {earnLeads.slice(0, 8).map(lead => (
                <div key={lead.id} className="px-5 py-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm text-text-primary dark:text-white">{lead.name}</div>
                    <div className="text-xs text-text-secondary">{lead.whatsapp} · {lead.preferredType.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-text-light">{formatRWF(lead.budgetMin)} – {formatRWF(lead.budgetMax)} · {lead.timeline}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${lead.status === 'new' ? 'bg-blue-100 text-blue-700' : lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
              {earnLeads.length === 0 && <p className="px-5 py-4 text-sm text-text-secondary">No leads yet</p>}
            </div>
          </div>

          {/* ── Financing Applications ────────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-text-primary dark:text-white">Drive to Own Applications ({financingApps.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {financingApps.slice(0, 8).map(app => (
                <div key={app.id} className="px-5 py-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm text-text-primary dark:text-white">{app.fullName}</div>
                    <div className="text-xs text-text-secondary">{app.user.email} · {formatRWF(app.monthlyIncome)}/mo</div>
                    <div className="text-xs text-text-light">{app.desiredCarType.replace(/_/g, ' ')} · Down: {formatRWF(app.downPayment)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'referred' ? 'bg-blue-100 text-blue-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>{app.status}</span>
                </div>
              ))}
              {financingApps.length === 0 && <p className="px-5 py-4 text-sm text-text-secondary">No applications yet</p>}
            </div>
          </div>
        </div>

        {/* ── Trust Circles ─────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-text-primary dark:text-white">Trust Circles ({trustCircles.length})</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Name', 'Type', 'Code', 'Members', 'Earnings'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trustCircles.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 capitalize text-text-secondary">{c.type}</td>
                    <td className="px-4 py-3 font-mono text-primary">{c.referralCode}</td>
                    <td className="px-4 py-3">{(c as any)._count.members}</td>
                    <td className="px-4 py-3">{formatRWF(c.totalEarnings)}</td>
                  </tr>
                ))}
                {trustCircles.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-text-secondary text-sm">No trust circles yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function VerifyCarButton({ carId, verify = false }: { carId: string; verify?: boolean }) {
  return (
    <form action={`/api/cars/${carId}`} method="POST">
      <input type="hidden" name="_method" value="PUT" />
      <input type="hidden" name="isVerified" value={String(verify)} />
      <button type="submit" className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
        verify ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}>
        {verify ? 'Approve' : 'Reject'}
      </button>
    </form>
  );
}
