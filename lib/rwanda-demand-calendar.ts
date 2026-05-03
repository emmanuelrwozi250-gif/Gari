export interface DemandEvent {
  date: string;             // 'YYYY-MM-DD' ISO date
  endDate?: string;         // inclusive end date for multi-day events
  name: string;
  demandMultiplier: number; // 1.0–2.5
  type: 'holiday' | 'event' | 'season';
  districts?: string[];     // affected districts (undefined = nationwide)
}

// Key Rwanda demand events for 2026
export const RWANDA_DEMAND_CALENDAR: DemandEvent[] = [
  // Public holidays — nationwide high demand
  { date: '2026-01-01', name: "New Year's Day", demandMultiplier: 1.8, type: 'holiday' },
  { date: '2026-01-02', name: 'New Year Holiday', demandMultiplier: 1.6, type: 'holiday' },
  { date: '2026-04-07', name: 'Genocide Memorial Day', demandMultiplier: 1.4, type: 'holiday' },
  { date: '2026-05-01', name: 'Labour Day', demandMultiplier: 1.5, type: 'holiday' },
  { date: '2026-07-01', name: 'Independence Day', demandMultiplier: 1.9, type: 'holiday' },
  { date: '2026-07-04', name: 'Liberation Day', demandMultiplier: 1.9, type: 'holiday' },
  { date: '2026-08-15', name: 'Assumption Day', demandMultiplier: 1.4, type: 'holiday' },
  { date: '2026-12-25', name: 'Christmas Day', demandMultiplier: 2.0, type: 'holiday' },
  { date: '2026-12-26', name: 'Boxing Day', demandMultiplier: 1.8, type: 'holiday' },
  { date: '2026-12-31', name: "New Year's Eve", demandMultiplier: 1.7, type: 'holiday' },

  // Major events
  { date: '2026-06-01', endDate: '2026-06-30', name: 'Kigali Jazz Junction', demandMultiplier: 1.5,
    type: 'event', districts: ['GASABO', 'KICUKIRO', 'NYARUGENGE'] },
  { date: '2026-09-01', endDate: '2026-09-07', name: 'Gorilla Tracking Peak Season',
    demandMultiplier: 1.7, type: 'season', districts: ['MUSANZE', 'BURERA'] },
  { date: '2026-10-01', endDate: '2026-10-31', name: 'Akagera Game Drive Season',
    demandMultiplier: 1.5, type: 'season', districts: ['KAYONZA', 'NGOMA', 'KIREHE'] },

  // Dry seasons — best driving conditions, elevated demand nationwide
  { date: '2026-07-01', endDate: '2026-09-30', name: 'Dry Season', demandMultiplier: 1.3, type: 'season' },
  { date: '2026-12-01', endDate: '2026-12-31', name: 'Short Dry Season', demandMultiplier: 1.2, type: 'season' },
];

/**
 * Returns all events active on the given date, optionally filtered by district.
 */
export function getEventsForDate(date: Date, district?: string): DemandEvent[] {
  const d = date.toISOString().slice(0, 10);
  return RWANDA_DEMAND_CALENDAR.filter(e => {
    const inRange = d >= e.date && d <= (e.endDate ?? e.date);
    const districtMatch = !e.districts || !district || e.districts.includes(district);
    return inRange && districtMatch;
  });
}

/**
 * Returns the highest demand multiplier for a given date + district.
 * Returns 1.0 if no events apply.
 */
export function getMultiplierForDate(date: Date, district?: string): number {
  const events = getEventsForDate(date, district);
  if (!events.length) return 1.0;
  return Math.max(...events.map(e => e.demandMultiplier));
}

/**
 * Returns upcoming high-demand events (multiplier ≥ minMultiplier) within daysAhead days.
 * Deduplicates overlapping season ranges — returns the first start date of each named event.
 */
export function getUpcomingHighDemandDates(
  daysAhead = 60,
  minMultiplier = 1.4,
): DemandEvent[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return RWANDA_DEMAND_CALENDAR.filter(e => {
    const start = new Date(e.date);
    return start >= now && start <= cutoff && e.demandMultiplier >= minMultiplier;
  }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}

/**
 * Given a price per day and a date, returns the suggested adjusted price.
 */
export function suggestPrice(pricePerDay: number, date: Date, district?: string): number {
  const multiplier = getMultiplierForDate(date, district);
  return Math.round(pricePerDay * multiplier);
}
