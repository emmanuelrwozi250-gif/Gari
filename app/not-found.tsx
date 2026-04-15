import Link from 'next/link';
import { Car } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Car className="w-8 h-8 text-primary" />
        <span className="text-2xl font-bold text-text-primary dark:text-white">
          Gar<span className="text-accent-yellow">i</span>
        </span>
      </div>

      {/* 404 number */}
      <div className="text-8xl md:text-9xl font-extrabold text-primary mb-2 leading-none">404</div>

      {/* Car SVG illustration */}
      <svg viewBox="0 0 200 80" className="w-48 h-20 my-6 text-gray-200 dark:text-gray-700" fill="currentColor">
        <rect x="20" y="35" width="160" height="30" rx="8" />
        <rect x="45" y="20" width="90" height="25" rx="6" />
        <rect x="52" y="24" width="35" height="16" rx="3" fill="white" opacity="0.6" />
        <rect x="95" y="24" width="35" height="16" rx="3" fill="white" opacity="0.6" />
        <circle cx="55" cy="65" r="14" fill="#1a7a4a" />
        <circle cx="55" cy="65" r="8" fill="white" opacity="0.3" />
        <circle cx="145" cy="65" r="14" fill="#1a7a4a" />
        <circle cx="145" cy="65" r="8" fill="white" opacity="0.3" />
        <rect x="170" y="38" width="12" height="8" rx="2" fill="#f5c518" />
        <rect x="18" y="38" width="12" height="8" rx="2" fill="#ef4444" />
      </svg>

      <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
        This road doesn&apos;t exist.
      </h1>
      <p className="text-text-secondary mb-8">Let&apos;s get you back on track.</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/search" className="btn-primary px-8 py-3 font-bold">
          Browse Cars →
        </Link>
        <Link href="/" className="btn-secondary px-8 py-3 font-bold">
          Go Home
        </Link>
      </div>
    </div>
  );
}
