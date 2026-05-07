'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Eye, MousePointerClick, TrendingUp, Car, ArrowRight } from 'lucide-react';

interface DailyRow {
  date: string;
  views: number;
  clicks: number;
  bookings: number;
  revenue: number;
}

interface AnalyticsCar {
  id: string;
  make: string;
  model: string;
  year: number;
  viewCount: number;
  clickCount: number;
  totalTrips: number;
  isFeatured: boolean;
  cvr: number;
  analytics: DailyRow[];
}

function formatRWF(n: number) {
  return n >= 1000 ? `RWF ${(n / 1000).toFixed(0)}k` : `RWF ${n}`;
}

/** Inline SVG bar chart — no external deps */
function MiniBarChart({ data, field, color }: { data: DailyRow[]; field: 'views' | 'clicks' | 'bookings'; color: string }) {
  const max = Math.max(...data.map(d => d[field]), 1);
  const W = 300;
  const H = 60;
  const barW = Math.max(4, (W - data.length) / data.length);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {data.map((d, i) => {
        const h = Math.max(2, (d[field] / max) * H);
        const x = i * (W / data.length);
        return (
          <rect
            key={i}
            x={x}
            y={H - h}
            width={barW}
            height={h}
            fill={color}
            rx={1}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card p-5 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-text-primary dark:text-white">{value}</p>
        {sub && <p className="text-xs text-text-light">{sub}</p>}
      </div>
    </div>
  );
}

export default function OperatorAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cars, setCars] = useState<AnalyticsCar[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/operator/analytics')
      .then(r => r.json())
      .then(d => {
        const c = d.cars ?? [];
        setCars(c);
        if (c.length > 0) setSelected(c[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  const car = cars.find(c => c.id === selected);
  const last30Views   = car?.analytics.reduce((s, d) => s + d.views, 0)    ?? 0;
  const last30Clicks  = car?.analytics.reduce((s, d) => s + d.clicks, 0)   ?? 0;
  const last30Revenue = car?.analytics.reduce((s, d) => s + d.revenue, 0)  ?? 0;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Listing Analytics
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            30-day performance for your listings
          </p>
        </div>
        <Link href="/dashboard/host" className="text-sm text-primary hover:underline flex items-center gap-1">
          Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-16 text-text-secondary dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">No analytics data yet</p>
          <p className="text-sm">Analytics appear once your listings receive views or clicks.</p>
          <Link href="/host/new" className="text-primary text-sm hover:underline mt-2 block">
            List your first car →
          </Link>
        </div>
      ) : (
        <>
          {/* Car selector */}
          {cars.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {cars.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selected === c.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-400 hover:bg-primary/10'
                  }`}
                >
                  {c.year} {c.make} {c.model}
                  {c.isFeatured && <span className="ml-1">⭐</span>}
                </button>
              ))}
            </div>
          )}

          {car && (
            <>
              {/* Lifetime stats */}
              <h2 className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-3">
                Lifetime Totals
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Eye}              label="Total Views"   value={car.viewCount.toLocaleString()}  color="bg-blue-500" />
                <StatCard icon={MousePointerClick} label="Total Clicks"  value={car.clickCount.toLocaleString()} color="bg-indigo-500" />
                <StatCard icon={Car}              label="Total Trips"   value={car.totalTrips.toLocaleString()}  color="bg-green-500" />
                <StatCard icon={TrendingUp}       label="Conv. Rate"    value={`${car.cvr}%`} sub="clicks → bookings" color="bg-amber-500" />
              </div>

              {/* 30-day charts */}
              <h2 className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-3">
                Last 30 Days
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="card p-5">
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Views</p>
                  <p className="text-2xl font-bold text-text-primary dark:text-white mb-3">{last30Views.toLocaleString()}</p>
                  {car.analytics.length > 0
                    ? <MiniBarChart data={car.analytics} field="views" color="#3B82F6" />
                    : <p className="text-xs text-text-light">No data yet</p>}
                </div>
                <div className="card p-5">
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Clicks</p>
                  <p className="text-2xl font-bold text-text-primary dark:text-white mb-3">{last30Clicks.toLocaleString()}</p>
                  {car.analytics.length > 0
                    ? <MiniBarChart data={car.analytics} field="clicks" color="#6366F1" />
                    : <p className="text-xs text-text-light">No data yet</p>}
                </div>
                <div className="card p-5">
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Revenue (30d)</p>
                  <p className="text-2xl font-bold text-text-primary dark:text-white mb-3">{formatRWF(last30Revenue)}</p>
                  {car.analytics.length > 0
                    ? <MiniBarChart data={car.analytics} field="bookings" color="#10B981" />
                    : <p className="text-xs text-text-light">No data yet</p>}
                </div>
              </div>

              {/* Daily table */}
              {car.analytics.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-text-primary dark:text-white">Daily Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {['Date', 'Views', 'Clicks', 'Bookings', 'Revenue'].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-text-secondary dark:text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...car.analytics].reverse().slice(0, 14).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-2 text-text-secondary dark:text-gray-400">
                              {new Date(row.date).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-2">{row.views}</td>
                            <td className="px-4 py-2">{row.clicks}</td>
                            <td className="px-4 py-2">{row.bookings}</td>
                            <td className="px-4 py-2">{row.revenue > 0 ? formatRWF(row.revenue) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
