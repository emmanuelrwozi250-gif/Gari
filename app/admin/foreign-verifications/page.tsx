import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Globe, Shield, ChevronLeft } from 'lucide-react';
import { ForeignVerificationActions } from './ForeignVerificationActions';

export const metadata: Metadata = { title: 'Foreign Verifications — Admin | Gari' };

export default async function ForeignVerificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const verifications = await prisma.renterVerification.findMany({
    where: { idType: 'PASSPORT' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          nationality: true,
          foreignVerified: true,
          foreignVerifiedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const pending = verifications.filter(v => v.status === 'PENDING');
  const approved = verifications.filter(v => v.status === 'VERIFIED');
  const rejected = verifications.filter(v => v.status === 'REJECTED');

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Foreign Renter Verifications</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-yellow-600">{pending.length}</div>
            <div className="text-sm text-text-secondary mt-1">Pending Review</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-green-600">{approved.length}</div>
            <div className="text-sm text-text-secondary mt-1">Approved</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl font-extrabold text-red-600">{rejected.length}</div>
            <div className="text-sm text-text-secondary mt-1">Rejected</div>
          </div>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
              Awaiting Review
            </h2>
            <div className="space-y-4">
              {pending.map(v => (
                <VerificationCard key={v.id} v={v} showActions />
              ))}
            </div>
          </div>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">✅ Approved</h2>
            <div className="space-y-3">
              {approved.map(v => (
                <VerificationCard key={v.id} v={v} />
              ))}
            </div>
          </div>
        )}

        {/* Rejected */}
        {rejected.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">❌ Rejected</h2>
            <div className="space-y-3">
              {rejected.map(v => (
                <VerificationCard key={v.id} v={v} />
              ))}
            </div>
          </div>
        )}

        {verifications.length === 0 && (
          <div className="card p-12 text-center">
            <Globe className="w-10 h-10 text-text-light mx-auto mb-3" />
            <p className="text-text-secondary">No passport verification requests yet.</p>
            <p className="text-xs text-text-light mt-1">International renters will appear here when they register.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationCard({ v, showActions = false }: { v: any; showActions?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Passport image */}
        {v.idPhotoFrontUrl ? (
          <a href={v.idPhotoFrontUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity">
            <img src={v.idPhotoFrontUrl} alt="Passport" className="w-full h-full object-cover" />
          </a>
        ) : (
          <div className="flex-shrink-0 w-full sm:w-40 h-28 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Shield className="w-8 h-8 text-text-light" />
            <span className="text-xs text-text-light ml-1">No photo</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-bold text-text-primary dark:text-white">{v.user.name}</p>
              <p className="text-sm text-text-secondary">{v.user.email}</p>
              {v.user.phone && <p className="text-xs text-text-light">{v.user.phone}</p>}
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              v.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              v.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {v.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
            <div>
              <span className="text-text-light text-xs">Nationality</span>
              <p className="font-medium">{v.user.nationality || '—'}</p>
            </div>
            <div>
              <span className="text-text-light text-xs">Passport No.</span>
              <p className="font-mono font-medium">{v.idNumber || '—'}</p>
            </div>
            <div>
              <span className="text-text-light text-xs">Submitted</span>
              <p>{formatDate(v.createdAt)}</p>
            </div>
            {v.verifiedAt && (
              <div>
                <span className="text-text-light text-xs">Reviewed</span>
                <p>{formatDate(v.verifiedAt)}</p>
              </div>
            )}
          </div>

          {v.adminNotes && (
            <p className="text-xs text-text-secondary bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-3">
              {v.adminNotes}
            </p>
          )}

          {v.rejectionReason && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-3">
              Rejection reason: {v.rejectionReason}
            </p>
          )}

          {showActions && <ForeignVerificationActions verificationId={v.id} userId={v.user.id} />}
        </div>
      </div>
    </div>
  );
}
