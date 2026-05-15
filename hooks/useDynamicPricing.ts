'use client';

import { useState, useEffect, useRef } from 'react';

export interface AppliedRuleInfo {
  ruleId: string;
  name: string;
  type: string;
  multiplier: number;
  delta: number;
}

export interface DynamicPricingResult {
  finalMultiplier: number;
  adjustmentPercent: number;
  appliedRules: AppliedRuleInfo[];
  totalDays: number;
}

export function useDynamicPricing(
  pickupDate: string | null,
  returnDate: string | null,
  debounceMs = 400
) {
  const [result, setResult] = useState<DynamicPricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!pickupDate || !returnDate) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timerRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const res = await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupDate, returnDate }),
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error('pricing fetch failed');
        const data: DynamicPricingResult = await res.json();
        setResult(data);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Could not load pricing');
          setResult(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [pickupDate, returnDate, debounceMs]);

  return { result, isLoading, error };
}
