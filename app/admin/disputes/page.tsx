import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, formatRWF } from '@/lib/utils';
import { AdminDisputeActions } from './AdminDisputeActions';

export const metadata: Metadata = { title: 'Disputes — Admin · Gari' };

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const disputes = await prisma.dispute.findMany({
    where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    include: {
      booking: {
        include: {
          car: { select: { make: true, model: true, year: true } },
          renter: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
          Disputes
        </h1>
        <p className="text-text-secondary mb-8">
          {disputes.length} open dispute{disputes.length !== 1 ? 's' : ''} awaiting resolution
        </p>

        {disputes.length === 0 ? (
          <div className="card p-12 text-center text-text-secondary">
            No open disputes — all clear ✅
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map(d => (
              <div key={d.id} className="card p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="font-bold text-text-primary dark:text-white">
                      {d.booking.car.year} {d.booking.car.make} {d.booking.car.model}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Renter: {d.booking.renter.name} ({d.booking.renter.email}) ·
                      Deposit: {formatRWF(d.booking.depositAmount ?? 0)}
                    </div>
                    <div className="text-xs text-text-light mt-0.5">
                      Raised {formatDate(d.createdAt)} · ID: {d.id.slice(-8)}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    d.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {d.status === 'UNDER_REVIEW' ? 'Under Review' : d.status}
                  </span>
                </div>

                {/* Evidence */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
                    <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">
                      Host Claim
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{d.description}</p>
                    {d.evidenceUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {d.evidenceUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary underline">
                            Photo {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {d.partialAmount && (
                      <div className="mt-2 text-xs font-semibold text-red-700">
                        Estimated cost: {formatRWF(d.partialAmount)}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">
                      Renter Response
                    </div>
                    {d.renterResponse ? (
                      <>
                        <p className="text-sm text-text-secondary leading-relaxed">{d.renterResponse}</p>
                        {d.responseUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {d.responseUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary underline">
                                Photo {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-text-light italic">Awaiting renter response…</p>
                    )}
                  </div>
                </div>

                {/* Admin actions */}
                <AdminDisputeActions
                  disputeId={d.id}
                  depositAmount={d.booking.depositAmount ?? 0}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
