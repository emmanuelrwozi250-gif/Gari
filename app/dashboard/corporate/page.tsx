import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, Users, Banknote, FileText, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatRWF, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Corporate Dashboard — Gari' };

export default async function CorporateDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/dashboard/corporate');

  const userId = (session.user as { id?: string }).id!;

  // Find corporate account where user is admin or member
  const account = await prisma.corporateAccount.findFirst({
    where: { OR: [{ adminUserId: userId }, { members: { some: { userId } } }] },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  }).catch(() => null);

  if (!account) {
    // No account — show prompt to apply
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-text-primary dark:text-white mb-2">No business account yet</h1>
          <p className="text-text-secondary text-sm mb-6">
            Apply for a Gari Business account to access monthly invoicing, team management, and spend reports.
          </p>
          <Link href="/corporate/apply" className="btn-primary w-full justify-center py-3">
            Apply for a business account
          </Link>
          <Link href="/corporate" className="block mt-3 text-sm text-text-secondary hover:text-primary transition-colors">
            Learn more about Gari Business
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = account.adminUserId === userId;

  // Fetch team bookings (last 30)
  const teamBookings = await prisma.booking.findMany({
    where: { corporateAccountId: account.id },
    include: { renter: { select: { name: true } }, car: { select: { make: true, model: true, year: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  }).catch(() => []);

  // Spend stats
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthSpend = teamBookings
    .filter(b => b.createdAt >= thisMonth && b.paymentStatus === 'PAID')
    .reduce((s, b) => s + b.totalAmount, 0);
  const totalSpend = teamBookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((s, b) => s + b.totalAmount, 0);
  const activeBookings = teamBookings.filter(b => ['CONFIRMED', 'ACTIVE', 'PENDING'].includes(b.status));

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">{account.orgName}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                account.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : account.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-red-100 text-red-700'
              }`}>
                {account.status}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{account.orgType} · {account.billingEmail}</p>
          </div>
          {isAdmin && (
            <Link href="/search" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
              Book a vehicle
            </Link>
          )}
        </div>

        {/* Pending approval notice */}
        {account.status === 'PENDING' && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 flex gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Application under review</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Our team will contact you within 1 business day via WhatsApp to activate your account.
                <a href="https://wa.me/250788123000" target="_blank" rel="noopener noreferrer"
                  className="ml-1 underline">WhatsApp us to follow up</a>.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Banknote, label: 'This month', value: formatRWF(monthSpend), color: 'text-primary' },
            { icon: FileText, label: 'Total spend', value: formatRWF(totalSpend), color: 'text-text-primary dark:text-white' },
            { icon: CheckCircle, label: 'Active bookings', value: String(activeBookings.length), color: 'text-green-600' },
            { icon: Users, label: 'Team members', value: String(account.members.length), color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Team bookings */}
          <div className="md:col-span-2 card p-5">
            <h2 className="font-bold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Team Bookings
            </h2>
            {teamBookings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-text-light/40 mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No bookings yet.</p>
                <Link href="/search" className="btn-primary text-sm py-2 px-4 mt-3 inline-flex">
                  Book first vehicle
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {teamBookings.slice(0, 10).map(b => (
                  <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary dark:text-white truncate">
                        {b.car.year} {b.car.make} {b.car.model}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {b.renter.name} · {formatDate(b.pickupDate)}
                        {b.corporateRef && <span className="ml-1 text-text-light">PO: {b.corporateRef}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-text-primary dark:text-white">{formatRWF(b.totalAmount)}</div>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${statusColor[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team members */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Team
              </h2>
              {isAdmin && (
                <a
                  href={`https://wa.me/250788123000?text=${encodeURIComponent(`Hi, I'd like to add team members to my Gari Business account (${account.orgName})`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  + Add member
                </a>
              )}
            </div>
            <div className="space-y-2">
              {account.members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {(m.user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-text-primary dark:text-white truncate">{m.user.name || m.user.email}</div>
                    <div className="text-xs text-text-light">{m.role} {m.costCenter ? `· ${m.costCenter}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-secondary mb-2">Credit usage</p>
                {account.creditLimit > 0 ? (
                  <>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (account.creditUsed / account.creditLimit) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-light mt-1">
                      <span>Used: {formatRWF(account.creditUsed)}</span>
                      <span>Limit: {formatRWF(account.creditLimit)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-light">Credit limit set on account activation.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/search" className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5">
            Browse vehicles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href={`https://wa.me/250788123000?text=${encodeURIComponent(`Hi, I need help with my Gari Business account (${account.orgName})`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-4"
          >
            WhatsApp account manager
          </a>
        </div>

      </div>
    </div>
  );
}
