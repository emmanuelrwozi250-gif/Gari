'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function HostMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="lg:hidden fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-sm mx-auto pointer-events-auto">
        <Link
          href="/host/new"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold py-3.5 rounded-2xl shadow-2xl hover:bg-primary-dark transition-colors"
        >
          List Your Car Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
