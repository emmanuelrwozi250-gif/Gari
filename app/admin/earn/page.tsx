import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatRWF, formatDate } from '@/lib/utils';
import { TrendingUp, ArrowLeft, Plus } from 'lucide-react';
import { BuyEarnListingForm } from '@/components/admin/BuyEarnListingForm';

export const metadata: Metadata = { title: 'Buy & Earn Listings — Admin' };

export default async function AdminEarnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ADMIN') redirect('/dashboard');

  let listings: any[] = [];
  try {
    listings = await prisma.buyEarnListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { leads: true } } },
    });
  } catch {
    // DB tables not yet created — show empty state
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Buy &amp; Earn Listings</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Form */}
          <div>
            <div className="card p-6">
              <h2 className="font-bold text-text-primary dark:text-white mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add New Listing
              </h2>
              <BuyEarnListingForm />
            </div>
          </div>

          {/* Existing Listings */}
          <div className="space-y-4">
            <h2 className="font-bold text-text-primary dark:text-white">
              Active Listings ({listings.filter(l => l.isActive).length} / {listings.length} total)
            </h2>

            {listings.length === 0 && (
              <div className="card p-8 text-center">
                <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
                <p className="text-text-secondary text-sm">No listings yet. Create your first one.</p>
              </div>
            )}

            {listings.map(listing => {
              const roi = listing.roiData as any;
              return (
                <div key={listing.id} className={`card p-5 ${!listing.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-text-primary dark:text-white">
                        {listing.year} {listing.make} {listing.model}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {listing.district} · {listing.type.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        listing.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {(listing as any)._count.leads} lead{(listing as any)._count.leads !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <div className="text-text-secondary">Purchase Price</div>
                      <div className="font-semibold">{formatRWF(listing.purchasePriceRwf)}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <div className="text-text-secondary">Daily Rate</div>
                      <div className="font-semibold">{formatRWF(listing.comparableDailyRate)}</div>
                    </div>
                  </div>

                  {/* ROI data */}
                  {roi && (
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="bg-primary-light dark:bg-primary/10 rounded-lg p-2 text-center">
                        <div className="text-primary font-bold">{formatRWF(roi.monthlyNetRevenueRwf)}</div>
                        <div className="text-text-secondary">Net/mo</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <div className="font-bold">{roi.annualRoiPct}%</div>
                        <div className="text-text-secondary">Annual ROI</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <div className="font-bold">{roi.paybackMonths}mo</div>
                        <div className="text-text-secondary">Payback</div>
                      </div>
                    </div>
                  )}

                  {/* Confidence + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        listing.roiConfidence === 'high'
                          ? 'bg-green-100 text-green-700'
                          : listing.roiConfidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {listing.roiConfidence} confidence
                      </span>
                      <span className="text-xs text-text-secondary">{formatDate(listing.createdAt)}</span>
                    </div>
                    <ToggleListingForm id={listing.id} isActive={listing.isActive} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleListingForm({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action="/api/earn" method="POST">
      <input type="hidden" name="_method" value="PUT" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <button
        type="submit"
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-green-50 text-green-600 hover:bg-green-100'
        }`}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </form>
  );
}
