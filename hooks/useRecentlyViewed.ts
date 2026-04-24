'use client';

import { useEffect, useState } from 'react';

export type RecentlyViewedCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  type: string;
  district: string;
  photos: string[];
  rating?: number;
};

const STORAGE_KEY = 'gari_recently_viewed';
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
  const [viewed, setViewed] = useState<RecentlyViewedCar[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setViewed(JSON.parse(stored));
    } catch {
      // localStorage unavailable — silently skip
    }
  }, []);

  function addViewed(car: RecentlyViewedCar) {
    setViewed(prev => {
      const filtered = prev.filter(c => c.id !== car.id);
      const next = [car, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  return { viewed, addViewed };
}
