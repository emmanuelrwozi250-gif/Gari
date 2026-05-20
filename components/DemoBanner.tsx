'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DemoBannerInner() {
  const [visible, setVisible] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    // Show if ?demo=true in URL OR NEXT_PUBLIC_DEMO_MODE=true env var
    const isDemoMode = params.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    setVisible(isDemoMode);
  }, [params]);

  if (!visible) return null;

  return (
    <div className="w-full bg-amber-500 text-white text-xs sm:text-sm py-2.5 px-4 flex items-center justify-between gap-4 sticky top-0 z-[100]">
      <span>
        🚧 <strong>Pilot Mode</strong>
        {' — '}Limited fleet available · Real bookings on select vehicles ·{' '}
        <a
          href="https://gari-africa.com"
          className="underline opacity-90 hover:opacity-100"
          target="_blank"
          rel="noopener noreferrer"
        >
          gari-africa.com
        </a>
      </span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="text-white font-bold text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function DemoBanner() {
  return (
    <Suspense fallback={null}>
      <DemoBannerInner />
    </Suspense>
  );
}
