import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { MapClient } from '@/components/MapClient';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cars by District — Gari',
  description: 'Browse available rental cars across all 30 districts in Rwanda.',
};

export default async function MapPage() {
  let districtCounts: { district: string; count: number }[] = [];
  try {
    const rows = await prisma.car.groupBy({
      by: ['district'],
      where: { isAvailable: true },
      _count: { id: true },
    });
    districtCounts = rows.map(r => ({ district: r.district, count: r._count.id }));
  } catch {
    // DB unavailable — SVG map still renders with zero counts, no crash
  }

  const totalCars = districtCounts.reduce((s, d) => s + d.count, 0);
  const activeDistricts = districtCounts.filter(d => d.count > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Cars Across Rwanda
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {totalCars} {totalCars === 1 ? 'car' : 'cars'} available
            {activeDistricts > 0 ? ` in ${activeDistricts} district${activeDistricts !== 1 ? 's' : ''}` : ''}
          </p>
        </div>

        <MapClient districtCounts={districtCounts} />

        {/* District grid */}
        {districtCounts.filter(d => d.count > 0).length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {districtCounts
              .filter(d => d.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(d => (
                <Link
                  key={d.district}
                  href={`/search?district=${d.district}`}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary transition-colors text-sm"
                >
                  <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
                    {d.district}
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                    {d.count}
                  </span>
                </Link>
              ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/search" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
            Browse All Cars
          </Link>
        </div>
      </div>
    </div>
  );
}
