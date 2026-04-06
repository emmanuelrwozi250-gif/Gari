import Link from 'next/link';
import { Car, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-bg dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <Car className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-3">Page Not Found</h2>
        <p className="text-text-secondary mb-8">
          Looks like this car drove off the map. The page you're looking for doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/search" className="btn-secondary">
            <Search className="w-4 h-4" /> Browse Cars
          </Link>
        </div>
      </div>
    </div>
  );
}
