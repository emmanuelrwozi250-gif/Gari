import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ArrowLeft, Users } from 'lucide-react';
import { TrustCircleForm } from '@/components/admin/TrustCircleForm';

export const metadata: Metadata = { title: 'Trust Circles — Admin' };

export default async function AdminTrustCirclesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const circles = await prisma.trustCircle.findMany({
    include: {
      members: {
        include: { user: { select: { name: true, email: true, trustScore: true, nidaVerified: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Trust Circles</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Form */}
          <div>
            <div className="card p-6">
              <h2 className="font-bold text-text-primary dark:text-white mb-5">Create New Trust Circle</h2>
              <TrustCircleForm />
            </div>
          </div>

          {/* Existing Circles */}
          <div className="space-y-4">
            <h2 className="font-bold text-text-primary dark:text-white">
              {circles.length} Circle{circles.length !== 1 ? 's' : ''}
            </h2>

            {circles.length === 0 && (
              <div className="card p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
                <p className="text-text-secondary text-sm">No trust circles yet.</p>
              </div>
            )}

            {circles.map(circle => {
              const pending = circle.members.filter(m => m.status === 'pending');
              const approved = circle.members.filter(m => m.status === 'approved');

              return (
                <div key={circle.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-text-primary dark:text-white">{circle.name}</div>
                      <div className="text-xs text-text-secondary mt-0.5 capitalize">{circle.type}</div>
                    </div>
                    <div className="font-mono text-primary text-sm font-bold bg-primary-light dark:bg-primary/10 px-3 py-1 rounded-full">
                      {circle.referralCode}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <div className="font-bold text-text-primary dark:text-white">{approved.length}</div>
                      <div className="text-text-secondary">Approved</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
                      <div className="font-bold text-yellow-700">{pending.length}</div>
                      <div className="text-text-secondary">Pending</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <div className="font-bold text-text-primary dark:text-white">{(circle.totalEarnings / 1000).toFixed(0)}K</div>
                      <div className="text-text-secondary">RWF Earned</div>
                    </div>
                  </div>

                  {/* Member list */}
                  {circle.members.length > 0 && (
                    <div className="space-y-1.5">
                      {circle.members.slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium">{m.user.name}</span>
                            <span className="text-text-secondary ml-1">{m.user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-secondary">Score: {m.user.trustScore}</span>
                            <MemberActionForm memberId={m.id} circleId={circle.id} status={m.status} />
                          </div>
                        </div>
                      ))}
                      {circle.members.length > 5 && (
                        <p className="text-xs text-text-secondary">+{circle.members.length - 5} more members</p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-text-light">Created {formatDate(circle.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberActionForm({ memberId, circleId, status }: { memberId: string; circleId: string; status: string }) {
  if (status === 'approved') {
    return (
      <form action={`/api/trust-circles/${circleId}/members`} method="POST">
        <input type="hidden" name="_method" value="PUT" />
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="action" value="suspend" />
        <button type="submit" className="text-xs text-red-500 hover:underline">Suspend</button>
      </form>
    );
  }
  return (
    <form action={`/api/trust-circles/${circleId}/members`} method="POST">
      <input type="hidden" name="_method" value="PUT" />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="action" value="approve" />
      <button type="submit" className="text-xs text-primary hover:underline font-semibold">Approve</button>
    </form>
  );
}
