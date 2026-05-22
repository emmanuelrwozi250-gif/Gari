export interface PricingRule {
  id: string;
  name?: string;
  type: string;           // 'season' | 'holiday' | 'day_of_week' | 'long_stay'
  enabled: boolean;
  multiplier: number;     // e.g. 1.15
  priority: number;
  startDate: Date | null;
  endDate: Date | null;
  dayOfWeek: number[];    // 0=Sun, 1=Mon … 6=Sat
  minDays: number | null;
  year?: number | null;
  description?: string | null;
}

export interface PricingEngineInput {
  pickupDate: Date;
  returnDate: Date;
  totalDays: number;
  rules: PricingRule[];
}

export interface AppliedRule {
  ruleId: string;
  name: string;
  multiplier: number;
  type: string;
  delta: number;          // how much this rule moved the multiplier (e.g. +0.15)
}

export interface PricingEngineResult {
  baseMultiplier: number;     // always 1.0
  finalMultiplier: number;    // clamped to [0.80, 1.20]
  appliedRules: AppliedRule[];
  adjustmentPercent: number;  // e.g. +15 or -8 (relative to 1.0)
}

const FLOOR = 0.80;
const CEILING = 1.20;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function iterateDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const finish = new Date(end);
  finish.setUTCHours(0, 0, 0, 0);
  while (cursor < finish) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days.length > 0 ? days : [new Date(start)];
}

function matchesDateRange(date: Date, startDate: Date | null, endDate: Date | null, year?: number | null): boolean {
  if (!startDate || !endDate) return false;

  // Year-specific rules: only fire in the specified calendar year
  if (year !== null && year !== undefined && date.getUTCFullYear() !== year) return false;

  // Year-specific: use exact UTC date comparison (no MM-DD wrap-around ambiguity)
  if (year !== null && year !== undefined) {
    const check = date.getTime();
    const s = new Date(Date.UTC(year, startDate.getUTCMonth(), startDate.getUTCDate())).getTime();
    const e = new Date(Date.UTC(year, endDate.getUTCMonth(), endDate.getUTCDate())).getTime();
    return check >= s && check <= e;
  }

  // Year-agnostic MM-DD comparison (existing behaviour — fixed annual holidays)
  const m = (d: Date) => d.getUTCMonth() * 100 + d.getUTCDate();
  const dateMD = m(date);
  const startMD = m(startDate);
  const endMD = m(endDate);

  if (startMD <= endMD) {
    // Normal range within a year
    return dateMD >= startMD && dateMD <= endMD;
  } else {
    // Wraps year boundary (e.g. Dec 20 → Jan 3)
    return dateMD >= startMD || dateMD <= endMD;
  }
}

export function computePricing(input: PricingEngineInput): PricingEngineResult {
  const { pickupDate, returnDate, totalDays, rules } = input;

  const enabledRules = rules.filter(r => r.enabled);
  const appliedMap = new Map<string, AppliedRule>();
  let totalDelta = 0;

  const days = iterateDays(pickupDate, returnDate);

  // ── Per-day rules: season, holiday, day_of_week ──────────────────────────
  for (const day of days) {
    const dow = day.getUTCDay(); // 0=Sun…6=Sat

    for (const rule of enabledRules) {
      let matches = false;

      if (rule.type === 'season' || rule.type === 'holiday') {
        matches = matchesDateRange(day, rule.startDate, rule.endDate, rule.year);
      } else if (rule.type === 'day_of_week') {
        matches = rule.dayOfWeek.includes(dow);
      }

      if (matches && !appliedMap.has(rule.id)) {
        const delta = rule.multiplier - 1;
        appliedMap.set(rule.id, {
          ruleId: rule.id,
          name: rule.name ?? rule.id,
          multiplier: rule.multiplier,
          type: rule.type,
          delta,
        });
        totalDelta += delta;
      }
    }
  }

  // ── Long-stay rules: apply the single best matching rule ─────────────────
  // Sort by minDays descending so the most specific (highest threshold) wins
  const longStayRules = enabledRules
    .filter(r => r.type === 'long_stay' && r.minDays !== null && totalDays >= (r.minDays ?? 0))
    .sort((a, b) => (b.minDays ?? 0) - (a.minDays ?? 0));

  if (longStayRules.length > 0) {
    const best = longStayRules[0];
    if (!appliedMap.has(best.id)) {
      const delta = best.multiplier - 1;
      appliedMap.set(best.id, {
        ruleId: best.id,
        name: best.name ?? best.id,
        multiplier: best.multiplier,
        type: best.type,
        delta,
      });
      totalDelta += delta;
    }
  }

  const rawMultiplier = 1 + totalDelta;
  const finalMultiplier = Math.min(CEILING, Math.max(FLOOR, rawMultiplier));
  const adjustmentPercent = Math.round((finalMultiplier - 1) * 100);

  return {
    baseMultiplier: 1.0,
    finalMultiplier: Math.round(finalMultiplier * 1000) / 1000, // 3 dp
    appliedRules: Array.from(appliedMap.values()).sort((a, b) => b.delta - a.delta),
    adjustmentPercent,
  };
}
