'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'gari_wishlist';

function readWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>(readWishlist);

  const toggle = useCallback((carId: string) => {
    setWishlist(prev => {
      const next = prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode, full, etc.) — still update state
      }
      return next;
    });
  }, []);

  const has = useCallback((carId: string) => wishlist.includes(carId), [wishlist]);

  return { wishlist, toggle, has };
}
