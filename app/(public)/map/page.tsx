import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mobility Map — Gari',
  description: 'Live car availability, road conditions, and smart routing across Rwanda.',
};

// Map must be client-only (no SSR)
const MobilityMap = dynamic(
  () => import('@/components/map/MobilityMap').then(m => m.MobilityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading Mobility Map…</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <MobilityMap />
    </div>
  );
}
