/**
 * Live USD/RWF exchange rate utility
 *
 * Fetches the rate from open.er-api.com (free, no key required).
 * Caches the result in a module-level variable for 24 hours so we
 * never spam the upstream API across server requests.
 *
 * Falls back to the hardcoded RWF_TO_USD constant from utils.ts if
 * the fetch fails, ensuring the app is always functional offline.
 */

import { RWF_TO_USD } from '@/lib/utils';

interface CacheEntry {
  rate: number;       // RWF per 1 USD
  fetchedAt: number;  // Date.now() timestamp
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Module-level cache (lives for the lifetime of the Node.js process /
// serverless instance — warm invocations reuse the cached value).
let cache: CacheEntry | null = null;

/**
 * Returns the current RWF/USD rate (how many RWF equal 1 USD).
 * Uses a 24-hour in-process cache; falls back to the hardcoded rate.
 */
export async function getRWFPerUSD(): Promise<number> {
  // Return cached value if fresh
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.rate;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 86400 }, // also benefit from Next.js fetch cache
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as { rates?: Record<string, number> };
    const rate = json.rates?.RWF;

    if (!rate || typeof rate !== 'number' || rate < 100) {
      throw new Error('Invalid rate in response');
    }

    cache = { rate, fetchedAt: Date.now() };
    return rate;
  } catch (err) {
    console.warn('[exchange-rate] fetch failed, using fallback:', (err as Error).message);
    return RWF_TO_USD; // hardcoded fallback
  }
}

/**
 * Converts an RWF amount to a USD string (e.g. "≈ $82").
 * Uses the live rate; falls back to the hardcoded rate.
 */
export async function toUSDLive(rwfAmount: number): Promise<string> {
  const rate = await getRWFPerUSD();
  const usd = Math.round(rwfAmount / rate);
  return `≈ $${usd.toLocaleString('en-US')}`;
}

/**
 * Synchronous helper using the cached rate (or hardcoded fallback).
 * Safe to call anywhere without await — returns the last known rate.
 */
export function getCachedRateOrFallback(): number {
  return cache?.rate ?? RWF_TO_USD;
}
