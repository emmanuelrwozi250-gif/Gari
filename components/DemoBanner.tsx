'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'gari_demo_dismissed';

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No useSearchParams — avoids Suspense CSR bailout; use window directly (client-only)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      sessionStorage.setItem('gari_demo_mode', 'true');
    }
    const inDemoMode = sessionStorage.getItem('gari_demo_mode') === 'true';
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (inDemoMode && !dismissed) setVisible(true);
  }, []);

  // Always render for SSR discoverability; hidden class conceals it until demo mode activates
  return (
    <div
      className={`relative z-50 bg-amber-400 text-amber-900 text-xs font-medium px-4 py-1.5 flex items-center justify-between gap-4${visible ? '' : ' hidden'}`}
      aria-hidden={!visible}
    >
      <div className="flex-1 text-center">
        🚀 <strong>Investor Demo Mode</strong> — Payments are simulated. No real transactions.{' '}
        Built for Rwanda ·{' '}
        <a href="https://gari-nu.vercel.app" className="underline font-semibold" target="_blank" rel="noopener noreferrer">
          gari-nu.vercel.app
        </a>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, 'true');
          setVisible(false);
        }}
        className="flex-shrink-0 p-0.5 rounded hover:bg-amber-500/50 transition-colors"
        aria-label="Dismiss demo banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
