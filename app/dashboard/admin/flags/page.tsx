'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flag, ArrowRight, RefreshCw } from 'lucide-react';

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

const FLAG_DESCRIPTIONS: Record<string, string> = {
  p2p_listings:       'P2P car listings (off per RURA guidance — only commercial vehicles)',
  insurance_addons:   'Insurance add-on products (future Gari Protect integration)',
  dynamic_pricing:    'AI-driven dynamic pricing engine',
  corporate_accounts: 'Corporate PO/invoice billing for business clients',
  boost_marketplace:  'Priority placement boost (RWF 14,500/month)',
};

export default function AdminFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role !== 'ADMIN') router.push('/dashboard');
    }
  }, [status, session, router]);

  async function loadFlags() {
    setLoading(true);
    try {
      // Fetch all known flags in parallel
      const keys = Object.keys(FLAG_DESCRIPTIONS);
      const results = await Promise.all(
        keys.map(k => fetch(`/api/admin/flags/${k}`).then(r => r.json()))
      );
      const loaded: FeatureFlag[] = results
        .map((r, i) => r.flag ? { ...r.flag, key: keys[i] } : null)
        .filter(Boolean) as FeatureFlag[];
      setFlags(loaded);
    } catch {
      setError('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role === 'ADMIN') loadFlags();
    }
  }, [status, session]);

  async function toggleFlag(key: string, currentEnabled: boolean) {
    setToggling(key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Toggle failed');
      }
      // Optimistic update
      setFlags(prev =>
        prev.map(f =>
          f.key === key
            ? { ...f, enabled: !currentEnabled, updatedAt: new Date().toISOString() }
            : f
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toggle failed');
    } finally {
      setToggling(null);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" /> Feature Flags
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Toggle platform features without a deployment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadFlags}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link href="/dashboard/admin" className="text-sm text-primary hover:underline flex items-center gap-1">
            Admin Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Flags list */}
      <div className="space-y-3">
        {Object.keys(FLAG_DESCRIPTIONS).map(key => {
          const flag = flags.find(f => f.key === key);
          const enabled = flag?.enabled ?? false;
          const isToggling = toggling === key;

          return (
            <div key={key} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-text-primary dark:text-white text-sm font-mono">
                    {key}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    enabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  {FLAG_DESCRIPTIONS[key]}
                </p>
                {flag?.updatedAt && (
                  <p className="text-xs text-text-light mt-1">
                    Last updated: {new Date(flag.updatedAt).toLocaleDateString('en-RW', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleFlag(key, enabled)}
                disabled={isToggling}
                aria-label={`Toggle ${key}`}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${
                  enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    enabled ? 'left-7' : 'left-1'
                  } ${isToggling ? 'opacity-60' : ''}`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-light mt-6 text-center">
        DB flags override environment variables. Changes take effect on next request.
      </p>
    </main>
  );
}
