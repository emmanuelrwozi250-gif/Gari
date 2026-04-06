/**
 * useLocationAwareness
 *
 * The core engine for Live Location Awareness.
 * Manages:
 * - POI fetching (with cache + debounce)
 * - Relevance scoring + direction calculation
 * - Audio announcement queue
 * - Cooldown tracking (never repeat within COOLDOWN_MS)
 * - User preference loading
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { scorePOIs, buildAnnouncementText, type ScoredPOI } from '@/lib/poiEngine';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 min — don't re-announce same POI
const FETCH_DEBOUNCE_MS = 3000;     // min 3s between Overpass fetches
const LAST_FETCH_RADIUS_M = 100;    // re-fetch when moved >100m from last fetch point

const FREQUENCY_LIMIT: Record<string, number> = {
  low: 2, medium: 4, high: 6, // max announcements per minute
};

export interface POIPreferences {
  audioEnabled: boolean;
  categories: string[];
  frequency: 'low' | 'medium' | 'high';
  radius: number;
}

interface UseLocationAwarenessOptions {
  userLat: number | null;
  userLng: number | null;
  heading: number;          // compass degrees; NaN if unknown
  enabled: boolean;
  preferences: POIPreferences;
}

interface UseLocationAwarenessReturn {
  nearbyPOIs: ScoredPOI[];
  currentAnnouncement: ScoredPOI | null;
  isAnnouncing: boolean;
  announcedCount: number;
}

export function useLocationAwareness({
  userLat,
  userLng,
  heading,
  enabled,
  preferences,
}: UseLocationAwarenessOptions): UseLocationAwarenessReturn {
  const [nearbyPOIs, setNearbyPOIs] = useState<ScoredPOI[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<ScoredPOI | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcedCount, setAnnouncedCount] = useState(0);

  const announcedRef = useRef<Map<string, number>>(new Map()); // osmId → timestamp
  const audioQueueRef = useRef<ScoredPOI[]>([]);
  const lastFetchRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const poiCacheRef = useRef<any[]>([]);
  const announcingRef = useRef(false);
  const minuteCountRef = useRef(0);
  const minuteResetRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset announcement minute counter every 60s
  useEffect(() => {
    minuteResetRef.current = setInterval(() => { minuteCountRef.current = 0; }, 60000);
    return () => {
      if (minuteResetRef.current) clearInterval(minuteResetRef.current);
    };
  }, []);

  // Fetch POIs from API
  const fetchPOIs = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    const last = lastFetchRef.current;

    // Debounce: skip if fetched recently and haven't moved far
    if (last) {
      const timeSince = now - last.ts;
      const R = 6371000;
      const dLat = (lat - last.lat) * Math.PI / 180;
      const dLng = (lng - last.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(last.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const moved = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (timeSince < FETCH_DEBOUNCE_MS || moved < LAST_FETCH_RADIUS_M) return;
    }

    lastFetchRef.current = { lat, lng, ts: now };

    try {
      const cats = preferences.categories.join(',');
      const res = await fetch(
        `/api/map/pois?lat=${lat}&lng=${lng}&radius=${preferences.radius}&categories=${cats}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      if (data.pois) poiCacheRef.current = data.pois;
    } catch {
      // Use stale cache silently
    }
  }, [preferences.radius, preferences.categories]);

  // Drain audio queue — process one announcement at a time
  function drainQueue() {
    if (announcingRef.current || audioQueueRef.current.length === 0) return;

    const poi = audioQueueRef.current.shift()!;
    if (!poi) return;

    announcingRef.current = true;
    setIsAnnouncing(true);
    setCurrentAnnouncement(poi);
    announcedRef.current.set(poi.osmId, Date.now());
    minuteCountRef.current++;
    setAnnouncedCount(c => c + 1);

    // Log interaction
    void fetch('/api/map/pois/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poiId: poi.osmId, type: 'announced' }),
    }).catch(() => {});

    const text = buildAnnouncementText(poi);
    speakText(text, () => {
      announcingRef.current = false;
      setIsAnnouncing(false);
      // Small gap between announcements
      setTimeout(() => {
        setCurrentAnnouncement(null);
        drainQueue();
      }, 1500);
    });
  }

  // Re-score cached POIs whenever user moves
  useEffect(() => {
    if (!enabled || userLat === null || userLng === null) return;

    // Fetch if needed
    fetchPOIs(userLat, userLng);

    // Score current POI cache
    const scored = scorePOIs(
      poiCacheRef.current,
      userLat,
      userLng,
      heading,
      preferences.categories,
      preferences.radius
    );

    // Only show top 5 for the visual layer
    setNearbyPOIs(scored.slice(0, 5));

    // Audio queue — top POIs not recently announced
    if (preferences.audioEnabled) {
      const limit = FREQUENCY_LIMIT[preferences.frequency] ?? 4;
      const candidates = scored.filter(poi => {
        const lastAnnounced = announcedRef.current.get(poi.osmId);
        return !lastAnnounced || (Date.now() - lastAnnounced) > COOLDOWN_MS;
      });

      // Enqueue top candidates (skip if queue already full)
      if (audioQueueRef.current.length === 0 && candidates.length > 0 && minuteCountRef.current < limit) {
        audioQueueRef.current = candidates.slice(0, 1); // one at a time
        drainQueue();
      }
    }
  }, [userLat, userLng, heading, enabled, preferences, fetchPOIs]); // eslint-disable-line react-hooks/exhaustive-deps

  function speakText(text: string, onEnd: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // clear any pending
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-GB'; // clear British English — good for African English speakers

    // Prefer a local voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  return { nearbyPOIs, currentAnnouncement, isAnnouncing, announcedCount };
}
