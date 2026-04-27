'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Globe } from 'lucide-react';

const STORAGE_KEY = 'gari_intl_banner_dismissed';

export function InternationalBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per session, and not if already dismissed
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Detect non-Rwandan browser language (heuristic)
    const lang = navigator.language || '';
    const isLikelyForeign = !lang.startsWith('rw') && !lang.startsWith('rw-');
    // Also show for common tourist/expat locales
    const showFor = ['en-US', 'en-GB', 'en-AU', 'de', 'fr', 'nl', 'zh', 'ja', 'ko', 'ar', 'pt'];
    const matchForeign = isLikelyForeign && (lang === '' || showFor.some(l => lang.startsWith(l)));

    if (matchForeign) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 text-lg">
            🌍
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-text-primary dark:text-white mb-0.5">
              Visiting Rwanda?
            </p>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
              Gari supports international renters — passport verification, card payments, English-speaking hosts &amp; airport pickup.
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/international"
                onClick={dismiss}
                className="text-xs font-semibold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" /> International guide →
              </Link>
              <button
                onClick={dismiss}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1 text-text-light hover:text-text-secondary transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
