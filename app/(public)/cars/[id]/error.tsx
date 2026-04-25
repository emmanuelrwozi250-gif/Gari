'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { useEffect } from 'react';

export default function CarDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CarDetailError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
          Couldn&apos;t load this listing
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mb-8 text-sm leading-relaxed">
          Something went wrong while loading the car details. This is usually a temporary issue — please try again.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/search"
            className="btn-ghost flex items-center gap-2 px-6 py-2.5"
          >
            <Search className="w-4 h-4" /> Browse all cars
          </Link>
        </div>
      </div>
    </div>
  );
}
