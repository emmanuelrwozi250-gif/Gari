'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DemoBannerInner() {
  const [visible, setVisible] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    // ONLY activate demo mode if ?demo=true is in the URL right now
    const demoInUrl = params.get('demo') === 'true';

    if (demoInUrl) {
      // User arrived via the investor demo link — store it for this session
      sessionStorage.setItem('gari-demo-mode', 'true');
    }

    // Show banner only if demo was activated this session AND has not been dismissed
    const demoActive =
      demoInUrl ||
      sessionStorage.getItem('gari-demo-mode') === 'true';
    const dismissed =
      sessionStorage.getItem('gari-demo-dismissed') === 'true';

    if (demoActive && !dismissed) {
      setVisible(true);
    }
  }, [params]);

  // Return null when not visible — keeps text out of DOM entirely
  if (!visible) return null;

  return (
    <div className="w-full bg-amber-500 text-white text-xs sm:text-sm py-2.5 px-4 flex items-center justify-between gap-4 sticky top-0 z-[100]">
      <span>
        🚀 <strong>Investor Demo Mode</strong>
        {' — '}Payments are simulated · No real transactions ·{' '}
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
        onClick={() => {
          sessionStorage.setItem('gari-demo-dismissed', 'true');
          setVisible(false);
        }}
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
