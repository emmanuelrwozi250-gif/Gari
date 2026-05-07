import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ComplianceButton } from '@/components/admin/ComplianceButton';
import { ShieldCheck, Car, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Compliance Queue | Gari Admin',
};

export default async function AdminCompliancePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || user.role !== 'ADMIN') {
    redirect('/login');
  }

  const [pendingCars, recentlyActioned] = await Promise.all([
    prisma.car.findMany({
      where: { complianceStatus: 'PENDING' },
      include: {
        host: { select: { id: true, name: true, email: true, companyName: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.car.findMany({
      where: { complianceStatus: { in: ['APPROVED', 'REJECTED'] } },
      include: {
        host: { select: { id: true, name: true, email: true, companyName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Compliance Queue
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Review and approve operator vehicle compliance submissions
          </p>
        </div>
        <Link href="/dashboard/admin" className="text-sm text-primary hover:underline flex items-center gap-1">
          Admin Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary dark:text-gray-400">Pending Review</p>
            <p className="text-xl font-extrabold text-text-primary dark:text-white">{pendingCars.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary dark:text-gray-400">Recently Approved</p>
            <p className="text-xl font-extrabold text-text-primary dark:text-white">
              {recentlyActioned.filter(c => c.complianceStatus === 'APPROVED').length}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary dark:text-gray-400">Recently Rejected</p>
            <p className="text-xl font-extrabold text-text-primary dark:text-white">
              {recentlyActioned.filter(c => c.complianceStatus === 'REJECTED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Pending queue */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-text-primary dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Awaiting Review ({pendingCars.length})
        </h2>

        {pendingCars.length === 0 ? (
          <div className="card p-8 text-center text-text-secondary dark:text-gray-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm mt-1">No vehicles pending compliance review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCars.map(car => (
              <div key={car.id} className="card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Car className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary dark:text-white text-sm">
                        {car.year} {car.make} {car.model}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                        {car.host.companyName ?? car.host.name ?? car.host.email}
                        {car.host.email && (
                          <span className="text-text-light ml-1">· {car.host.email}</span>
                        )}
                      </p>
                      {car.commercialLicenseNo && (
                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                          License: <span className="font-mono text-text-primary dark:text-white">{car.commercialLicenseNo}</span>
                        </p>
                      )}
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {car.vehicleType}
                        </span>
                        {car.insuranceType && (
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {car.insuranceType} Insurance
                          </span>
                        )}
                        <span className="text-xs text-text-light">
                          Submitted {new Date(car.createdAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ComplianceButton carId={car.id} action="approve" />
                    <ComplianceButton carId={car.id} action="reject" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently actioned */}
      {recentlyActioned.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-primary dark:text-white uppercase tracking-wide mb-4">
            Recently Actioned
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Vehicle', 'Operator', 'Status', 'Updated'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-text-secondary dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentlyActioned.map(car => (
                  <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 font-medium text-text-primary dark:text-white">
                      {car.year} {car.make} {car.model}
                    </td>
                    <td className="px-4 py-2 text-text-secondary dark:text-gray-400">
                      {car.host.companyName ?? car.host.name ?? car.host.email}
                    </td>
                    <td className="px-4 py-2">
                      {car.complianceStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-text-secondary dark:text-gray-400 text-xs">
                      {new Date(car.updatedAt).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
