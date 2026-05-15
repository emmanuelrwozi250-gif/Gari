'use client';

import type { AppliedRuleInfo } from '@/hooks/useDynamicPricing';

interface Props {
  basePrice: number;
  totalDays: number;
  driverFee: number;
  finalMultiplier: number;
  adjustmentPercent: number;
  appliedRules: AppliedRuleInfo[];
  vatRate?: number;
  priceIncludesVat?: boolean;
}

function formatRWF(n: number) {
  return 'RWF ' + Math.round(n).toLocaleString('en-RW');
}

function badgeColor(delta: number) {
  return delta > 0
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

function ruleTypeLabel(type: string) {
  switch (type) {
    case 'season': return 'Season';
    case 'holiday': return 'Holiday';
    case 'day_of_week': return 'Day rate';
    case 'long_stay': return 'Long stay';
    default: return type;
  }
}

export function PriceBreakdown({
  basePrice,
  totalDays,
  driverFee,
  finalMultiplier,
  adjustmentPercent,
  appliedRules,
  vatRate = 0.18,
  priceIncludesVat = false,
}: Props) {
  const safeDays = Math.max(totalDays, 1);
  const baseSubtotal = basePrice * safeDays;
  const adjustedSubtotal = Math.round(baseSubtotal * finalMultiplier);
  const dynamicAdjustment = adjustedSubtotal - baseSubtotal;
  const vatBase = adjustedSubtotal + driverFee;
  const vat = priceIncludesVat ? 0 : Math.round(vatBase * vatRate);

  const hasAdjustment = finalMultiplier !== 1.0;

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface/50 p-3 text-sm space-y-2">
      <p className="font-semibold text-text-primary text-xs uppercase tracking-wide">Price breakdown</p>

      {/* Base rate */}
      <div className="flex justify-between text-text-secondary">
        <span>{formatRWF(basePrice)}/day × {safeDays} day{safeDays !== 1 ? 's' : ''}</span>
        <span>{formatRWF(baseSubtotal)}</span>
      </div>

      {/* Applied rules */}
      {appliedRules.map(rule => (
        <div key={rule.ruleId} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor(rule.delta)}`}>
              {ruleTypeLabel(rule.type)}
            </span>
            <span className="text-text-secondary truncate text-xs">{rule.name}</span>
          </div>
          <span className={`shrink-0 font-medium ${rule.delta > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
            {rule.delta > 0 ? '+' : ''}{Math.round(rule.delta * 100)}%
          </span>
        </div>
      ))}

      {/* Dynamic adjustment total */}
      {hasAdjustment && (
        <div className="flex justify-between border-t border-border pt-1">
          <span className="text-text-secondary">
            Dynamic adjustment ({adjustmentPercent > 0 ? '+' : ''}{adjustmentPercent}%)
          </span>
          <span className={dynamicAdjustment > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}>
            {dynamicAdjustment > 0 ? '+' : ''}{formatRWF(dynamicAdjustment)}
          </span>
        </div>
      )}

      {/* Driver fee */}
      {driverFee > 0 && (
        <div className="flex justify-between text-text-secondary">
          <span>Driver fee</span>
          <span>{formatRWF(driverFee)}</span>
        </div>
      )}

      {/* VAT */}
      {!priceIncludesVat && (
        <div className="flex justify-between text-text-secondary">
          <span>VAT (18% — RRA)</span>
          <span>{formatRWF(vat)}</span>
        </div>
      )}

      {/* Adjusted subtotal (pre-platform-fee) */}
      <div className="flex justify-between font-semibold border-t border-border pt-1">
        <span>Rental subtotal</span>
        <span className="text-primary">{formatRWF(adjustedSubtotal + driverFee + vat)}</span>
      </div>
    </div>
  );
}
