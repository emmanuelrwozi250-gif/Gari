import Link from 'next/link';
import { Car } from 'lucide-react';

/**
 * Segment-level not-found — placed here so Next.js 14 App Router
 * correctly returns HTTP 404 (not 200) when notFound() is called
 * from the car detail page or its generateMetadata.
 */
export default function CarNotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-20 pb-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Car className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-text-primary dark:text-white">
            Gar<span className="text-accent-yellow">i</span>
          </span>
        </div>

        <div className="text-8xl font-extrabold text-primary mb-4 leading-none">404</div>

        <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
          Car not found
        </h1>
        <p className="text-text-secondary mb-8">
          This listing doesn&apos;t exist or has been removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="btn-primary px-8 py-3 font-bold">
            Browse Cars →
          </Link>
          <Link href="/" className="btn-secondary px-8 py-3 font-bold">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
