'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2, Info } from 'lucide-react';
import { formatRWF } from '@/lib/utils';

interface PricingFactor {
  name: string;
  delta: number;
  reason: string;
}

interface PricingData {
  basePrice: number;
  adjustedPricePerDay: number;
  multiplier: number;
  multiplierLabel: string;
  reason: string;
  factors: PricingFactor[];
  totalDays: number;
  subtotal: number;
  driverFee: number;
  platformFee: number;
  totalAmount: number;
}

interface Props {
  carId: string;
  pickupDate: string;
  returnDate: string;
  withDriver: boolean;
  onPriceLoaded?: (data: PricingData) => void;
}

export function PricingWidget({ carId, pickupDate, returnDate, withDriver, onPriceLoaded }: Props) {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  useEffect(() => {
    if (!pickupDate || !returnDate || !carId) return;
    if (new Date(returnDate) <= new Date(pickupDate)) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(
      `/api/cars/${carId}/pricing?pickupDate=${pickupDate}&returnDate=${returnDate}&withDriver=${withDriver}`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setData(d);
        onPriceLoaded?.(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [carId, pickupDate, returnDate, withDriver]);

  if (!pickupDate || !returnDate) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 size={15} className="animate-spin" />
        Calculating price...
      </div>
    );
  }
  if (!data) return null;

  const isSurge = data.multiplier > 1.01;
  const isDiscount = data.multiplier < 0.99;
  const SurgeIcon = isSurge ? TrendingUp : isDiscount ? TrendingDown : Minus;
  const surgeColor = isSurge ? 'text-orange-600' : isDiscount ? 'text-green-600' : 'text-gray-500';
  const surgeBg = isSurge ? 'bg-orange-50 border-orange-200' : isDiscount ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';

  return (
    <div className="space-y-3">
      {/* Surge/discount indicator */}
      {(isSurge || isDiscount) && (
        <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${surgeBg}`}>
          <div className="flex items-center gap-2">
            <SurgeIcon size={15} className={surgeColor} />
            <span className={`text-sm font-semibold ${surgeColor}`}>{data.multiplierLabel}</span>
          </div>
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Info size={12} />
            {showFactors ? 'Hide' : 'Why?'}
          </button>
        </div>
      )}

      {/* Factor breakdown */}
      {showFactors && data.factors.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          {data.factors.map((f, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-gray-600">{f.name}</span>
              <span className={f.delta > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                {f.delta > 0 ? '+' : ''}{Math.round(f.delta * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {formatRWF(data.adjustedPricePerDay)} × {data.totalDays} day{data.totalDays !== 1 ? 's' : ''}
            {isSurge && (
              <span className="ml-1.5 text-xs line-through text-gray-400">{formatRWF(data.basePrice)}/day</span>
            )}
          </span>
          <span>{formatRWF(data.subtotal)}</span>
        </div>
        {data.driverFee > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Driver fee</span>
            <span>{formatRWF(data.driverFee)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Platform fee (12%)</span>
          <span>{formatRWF(data.platformFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-1">
          <span>Total</span>
          <span className="text-primary">{formatRWF(data.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
