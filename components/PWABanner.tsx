'use client';

import { useEffect, useState } from 'react';

export default function PWABanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Don't show if already in standalone (PWA) mode
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Don't show if user already dismissed
    if (localStorage.getItem('pwa-banner-dismissed') === '1') return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', '1');
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 bg-dark-bg text-white rounded-t-2xl shadow-2xl px-4 py-3 flex items-center justify-between">
      {/* Left: icon + text */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🚗</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-tight">Add Gari to your home screen</span>
          <span className="text-xs text-gray-400 leading-tight">Get the full app experience</span>
        </div>
      </div>

      {/* Right: Add button + dismiss */}
      <div className="flex items-center shrink-0 ml-3">
        <button
          onClick={dismiss}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Add
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="ml-2 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
