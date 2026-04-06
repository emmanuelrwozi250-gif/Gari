/**
 * Dynamic Pricing Engine
 *
 * Calculates a surge multiplier (0.90 – 2.50) for a given date range and district.
 * Factors:
 *  1. Rwanda public holidays & peak tourism seasons
 *  2. Day-of-week premium (Fri–Sun +15%)
 *  3. Lead-time discount (book 14+ days ahead → 5% off)
 *  4. Demand-based surge (uses live DB booking count per district)
 *
 * Usage:
 *   import { getDynamicMultiplier, applyMultiplier } from '@/lib/pricing';
 *   const { multiplier, reason } = await getDynamicMultiplier(pickupDate, returnDate, district, prisma);
 *   const adjustedPrice = applyMultiplier(basePrice, multiplier);
 */

import type { PrismaClient } from '@prisma/client';

export interface PricingResult {
  multiplier: number;       // e.g. 1.35
  baseMultiplier: number;   // before lead-time discount
  factors: PricingFactor[];
  reason: string;           // human-readable summary
}

export interface PricingFactor {
  name: string;
  delta: number;  // additive delta to multiplier, e.g. +0.25
  reason: string;
}

// ─── Rwanda Public Holidays (fixed dates, MM-DD format) ────────────────────────
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': "New Year's Day",
  '01-02': "New Year Holiday",
  '02-01': 'Heroes Day',
  '04-07': 'Genocide Memorial Day',
  '05-01': 'Labour Day',
  '07-01': 'Independence Day',
  '07-04': 'Liberation Day',
  '08-15': 'Assumption Day',
  '12-25': 'Christmas Day',
  '12-26': 'Boxing Day',
};

// ─── Rwanda Peak Tourism Seasons (MM-DD to MM-DD, approximate) ─────────────────
interface Season {
  name: string;
  startMD: string; // MM-DD
  endMD: string;
  delta: number;
}

const PEAK_SEASONS: Season[] = [
  { name: 'Gorilla Naming (Kwita Izina)', startMD: '09-01', endMD: '09-10', delta: 0.40 },
  { name: 'Christmas & New Year Season', startMD: '12-20', endMD: '01-03', delta: 0.50 },
  { name: 'Easter Weekend',              startMD: '03-28', endMD: '04-06', delta: 0.30 },
  { name: 'African Union Summit Season', startMD: '01-28', endMD: '02-02', delta: 0.25 },
  { name: 'Rwanda Music Festivals',      startMD: '08-01', endMD: '08-15', delta: 0.20 },
  { name: 'School Holiday (Jul)',        startMD: '07-01', endMD: '07-31', delta: 0.15 },
];

function toMD(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function isInSeason(date: Date, season: Season): boolean {
  const md = toMD(date);
  const { startMD, endMD } = season;
  if (startMD <= endMD) {
    return md >= startMD && md <= endMD;
  }
  // wraps year boundary (e.g. 12-20 to 01-03)
  return md >= startMD || md <= endMD;
}

function getHolidayDelta(date: Date): number {
  const md = toMD(date);
  return FIXED_HOLIDAYS[md] ? 0.30 : 0;
}

function getSeasonDelta(date: Date): { delta: number; name: string } {
  for (const season of PEAK_SEASONS) {
    if (isInSeason(date, season)) {
      return { delta: season.delta, name: season.name };
    }
  }
  return { delta: 0, name: '' };
}

function getWeekendDelta(date: Date): number {
  const dow = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
  if (dow === 5 || dow === 6 || dow === 0) return 0.15;
  return 0;
}

/** Returns all dates in [start, end) */
function datesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur < end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function getDynamicMultiplier(
  pickupDate: Date | string,
  returnDate: Date | string,
  district: string,
  prisma: PrismaClient
): Promise<PricingResult> {
  const pickup = new Date(pickupDate);
  const ret = new Date(returnDate);
  const now = new Date();
  const factors: PricingFactor[] = [];

  // ── 1. Date-based factors (average across all days in rental) ──────────────
  const days = datesInRange(pickup, ret);
  if (days.length === 0) days.push(pickup);

  let totalHolidayDelta = 0;
  const seenSeasons = new Set<string>();
  let totalWeekendDays = 0;

  for (const d of days) {
    totalHolidayDelta += getHolidayDelta(d);
    const { delta: sDelta, name: sName } = getSeasonDelta(d);
    if (sDelta > 0 && !seenSeasons.has(sName)) {
      seenSeasons.add(sName);
      factors.push({ name: sName, delta: sDelta, reason: 'Peak tourism season' });
    }
    if (getWeekendDelta(d) > 0) totalWeekendDays++;
  }

  if (totalHolidayDelta > 0) {
    const avgHoliday = totalHolidayDelta / days.length;
    factors.push({ name: 'Public Holiday', delta: avgHoliday, reason: 'Rwanda public holiday' });
  }
  if (totalWeekendDays > 0) {
    const weekendWeight = (totalWeekendDays / days.length) * 0.15;
    factors.push({ name: 'Weekend Premium', delta: weekendWeight, reason: `${totalWeekendDays} of ${days.length} days are Fri–Sun` });
  }

  // ── 2. Demand-based surge (bookings in same district overlapping dates) ─────
  try {
    const overlapping = await prisma.booking.count({
      where: {
        car: { district },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        pickupDate: { lte: ret },
        returnDate: { gte: pickup },
      },
    });

    if (overlapping >= 20) {
      factors.push({ name: 'High Demand', delta: 0.30, reason: `${overlapping} active bookings in ${district}` });
    } else if (overlapping >= 10) {
      factors.push({ name: 'Moderate Demand', delta: 0.15, reason: `${overlapping} active bookings in ${district}` });
    }
  } catch {
    // DB unavailable in some contexts — skip demand factor
  }

  // ── 3. Sum multiplier ──────────────────────────────────────────────────────
  const totalDelta = factors.reduce((sum, f) => sum + f.delta, 0);
  const baseMultiplier = Math.min(2.50, Math.max(0.90, 1 + totalDelta));

  // ── 4. Lead-time discount ──────────────────────────────────────────────────
  const daysUntilPickup = Math.floor((pickup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let multiplier = baseMultiplier;
  if (daysUntilPickup >= 14) {
    const discount = 0.05;
    factors.push({ name: 'Early Bird Discount', delta: -discount, reason: 'Booked 14+ days in advance' });
    multiplier = Math.max(0.90, baseMultiplier - discount);
  } else if (daysUntilPickup <= 1) {
    const surcharge = 0.10;
    factors.push({ name: 'Last-Minute Surcharge', delta: surcharge, reason: 'Pickup within 24 hours' });
    multiplier = Math.min(2.50, baseMultiplier + surcharge);
  }

  // ── 5. Human-readable summary ───────────────────────────────────────────────
  const surgeFactors = factors.filter(f => f.delta > 0).map(f => f.name);
  const reason = surgeFactors.length > 0
    ? `Adjusted for: ${surgeFactors.join(', ')}`
    : 'Standard pricing — no active surges';

  return { multiplier: Math.round(multiplier * 100) / 100, baseMultiplier, factors, reason };
}

/** Apply a multiplier to a base price, returning the adjusted price. */
export function applyMultiplier(basePrice: number, multiplier: number): number {
  return Math.round(basePrice * multiplier);
}

/** Format the multiplier as a human-readable string, e.g. "+35% surge" or "−5% discount". */
export function formatMultiplier(multiplier: number): string {
  const pct = Math.round((multiplier - 1) * 100);
  if (pct === 0) return 'Standard price';
  if (pct > 0) return `+${pct}% surge`;
  return `${pct}% discount`;
}
