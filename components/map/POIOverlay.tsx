'use client';

import { useEffect, useState } from 'react';
import type { ScoredPOI } from '@/lib/poiEngine';
import { getSubCategoryMeta } from '@/lib/overpass';
import { Volume2, X } from 'lucide-react';

interface Props {
  nearbyPOIs: ScoredPOI[];
  currentAnnouncement: ScoredPOI | null;
  isAnnouncing: boolean;
  audioEnabled: boolean;
  onDismiss?: (poi: ScoredPOI) => void;
}

const DIRECTION_LABELS: Record<string, string> = {
  ahead: 'Ahead',
  right: 'On your right',
  left:  'On your left',
};

function POICard({ poi, isAnnouncing, onDismiss }: {
  poi: ScoredPOI;
  isAnnouncing: boolean;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const meta = getSubCategoryMeta(poi.subCategory);
  const distStr = poi.distance < 50
    ? 'right here'
    : `${Math.round(poi.distance / 10) * 10}m`;
  const dirLabel = DIRECTION_LABELS[poi.direction] || poi.direction;

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 8 seconds
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 400);
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl shadow-xl px-4 py-3 border-l-4 transition-all duration-400 ${
        poi.isSponsored ? 'border-accent-yellow' : 'border-primary'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ maxWidth: '280px', transition: 'opacity 0.4s, transform 0.4s' }}
    >
      <div className="text-2xl flex-shrink-0">{meta.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-primary">{dirLabel}</span>
          {poi.isSponsored && (
            <span className="text-[10px] bg-accent-yellow/20 text-yellow-700 px-1.5 rounded font-semibold">Sponsored</span>
          )}
          {isAnnouncing && (
            <Volume2 className="w-3 h-3 text-primary animate-pulse flex-shrink-0" />
          )}
        </div>
        <div className="font-bold text-sm text-text-primary dark:text-white truncate">{poi.name}</div>
        <div className="text-xs text-text-secondary mt-0.5">{distStr}</div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 400); }}
        className="text-text-secondary hover:text-text-primary flex-shrink-0 ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function POIOverlay({ nearbyPOIs, currentAnnouncement, isAnnouncing, audioEnabled, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [prevAnnouncementId, setPrevAnnouncementId] = useState<string | null>(null);

  // Track when announcement changes so we show the card
  useEffect(() => {
    if (currentAnnouncement && currentAnnouncement.osmId !== prevAnnouncementId) {
      setPrevAnnouncementId(currentAnnouncement.osmId);
    }
  }, [currentAnnouncement, prevAnnouncementId]);

  // Show top 2 visual POIs (exclude dismissed)
  const visible = nearbyPOIs
    .filter(p => !dismissed.has(p.osmId))
    .slice(0, 2);

  if (visible.length === 0 && !currentAnnouncement) return null;

  const displayPOIs = audioEnabled && currentAnnouncement
    ? [currentAnnouncement, ...visible.filter(p => p.osmId !== currentAnnouncement.osmId)].slice(0, 2)
    : visible;

  return (
    <div className="absolute left-4 z-[990] space-y-2" style={{ bottom: '180px' }}>
      {displayPOIs.map(poi => (
        <POICard
          key={poi.osmId}
          poi={poi}
          isAnnouncing={isAnnouncing && currentAnnouncement?.osmId === poi.osmId}
          onDismiss={() => {
            setDismissed(prev => { const s = new Set(prev); s.add(poi.osmId); return s; });
            onDismiss?.(poi);
          }}
        />
      ))}
    </div>
  );
}
