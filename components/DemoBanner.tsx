'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DemoBannerInner() {
  const [visible, setVisible] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    // ONLY show if ?demo=true is in the URL RIGHT NOW
    // No sessionStorage — banner disappears when URL changes
    setVisible(params.get('demo') === 'true');
  }, [params]);

  if (!visible) return null;

  return (
    <div className="w-full bg-amber-500 text-white text-xs sm:text-sm py-2.5 px-4 flex items-center justify-between gap-4 sticky top-0 z-[100]">
      <span>
        🚀 <strong>Investor Demo Mode</strong>
        {' — '}Payments simulated · No real transactions ·{' '}
        <a
          href="https://gari-nu.vercel.app"
          className="underline opacity-90 hover:opacity-100"
          target="_blank"
          rel="noopener noreferrer"
        >
          gari-nu.vercel.app
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
