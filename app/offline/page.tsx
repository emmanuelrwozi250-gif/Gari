'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Car icon with no-wifi overlay */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="w-24 h-24 bg-primary-light dark:bg-primary/10 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" className="text-primary" strokeWidth={1.5}>
              <path d="M8 10h8M7 14h10m-8-8 1-2h6l1 2M5 14l-2 3h18l-2-3M5 17v2m14-2v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" className="text-red-500" strokeWidth={2}>
              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
          You're offline
        </h1>
        <p className="text-text-secondary mb-6">
          Gari needs an internet connection to show live car listings and availability.
          Please check your connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="btn-primary mx-auto"
        >
          Try again
        </button>

        <p className="mt-6 text-xs text-text-light">
          Need help? Chat on WhatsApp when you're back online.
        </p>
      </div>
    </div>
  );
}
