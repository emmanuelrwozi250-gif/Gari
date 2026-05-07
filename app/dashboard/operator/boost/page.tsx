'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Zap, Clock, Car, ArrowRight, CheckCircle } from 'lucide-react';
import { PLATFORM } from '@/config/platform';

interface CarWithBoost {
  id: string;
  make: string;
  model: string;
  year: number;
  isFeatured: boolean;
  featuredUntil: string | null;
  complianceStatus: string;
  viewCount: number;
  clickCount: number;
  totalTrips: number;
}

function formatRWF(n: number) {
  return `RWF ${n.toLocaleString()}`;
}

function daysLeft(until: string) {
  const diff = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function BoostManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cars, setCars] = useState<CarWithBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/operator/analytics')
      .then(r => r.json())
      .then(d => { setCars(d.cars ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  async function activateBoost(carId: string) {
    setBoosting(carId);
    setError(null);
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Boost failed');
      // Refresh car list
      const updated = await fetch('/api/operator/analytics').then(r => r.json());
      setCars(updated.cars ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Boost activation failed');
    } finally {
      setBoosting(null);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const boostedCars = cars.filter(c => c.isFeatured);
  const unboostedCars = cars.filter(c => !c.isFeatured);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" /> Boost Management
          </h1>
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Boosted listings appear first in search results — more views, more bookings.
          </p>
        </div>
        <Link href="/dashboard/host" className="text-sm text-primary hover:underline flex items-center gap-1">
          Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Pricing card */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6" />
          <span className="font-bold text-lg">Priority Placement</span>
        </div>
        <p className="text-amber-100 text-sm mb-4">
          Your listing appears at the top of search results for 30 days.
          Boosted cars get on average 3× more views and 2× more bookings.
        </p>
        <div className="text-3xl font-extrabold">
          {formatRWF(PLATFORM.BOOST_PRICE_RWF)}
          <span className="text-lg font-normal text-amber-100"> / month</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Boosted cars */}
      {boostedCars.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-text-primary dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Currently Boosted
          </h2>
          <div className="space-y-3">
            {boostedCars.map(car => (
              <div key={car.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary dark:text-white text-sm">
                      {car.year} {car.make} {car.model}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {car.featuredUntil
                        ? `${daysLeft(car.featuredUntil)} days remaining`
                        : 'Active'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                  <p className="text-xs text-text-light mt-1">
                    {car.viewCount} views · {car.clickCount} clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Un-boosted cars */}
      {unboostedCars.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-primary dark:text-white uppercase tracking-wide mb-4">
            Available to Boost
          </h2>
          <div className="space-y-3">
            {unboostedCars.map(car => (
              <div key={car.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary dark:text-white text-sm">
                      {car.year} {car.make} {car.model}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                      {car.viewCount} views · {car.clickCount} clicks · {car.totalTrips} trips
                    </p>
                  </div>
                </div>
                {car.complianceStatus === 'APPROVED' ? (
                  <button
                    onClick={() => activateBoost(car.id)}
                    disabled={boosting === car.id}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1 disabled:opacity-60"
                  >
                    <Zap className="w-3 h-3" />
                    {boosting === car.id ? 'Activating…' : `Boost — ${formatRWF(PLATFORM.BOOST_PRICE_RWF)}/mo`}
                  </button>
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                    Pending approval
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {cars.length === 0 && (
        <div className="text-center py-16 text-text-secondary dark:text-gray-400">
          <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold mb-2">No cars listed yet</p>
          <Link href="/host/new" className="text-primary text-sm hover:underline">
            List your first car →
          </Link>
        </div>
      )}
    </main>
  );
}
