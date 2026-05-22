import { describe, it, expect } from 'vitest';
import { computePricing } from '../engine';
import type { PricingRule } from '../engine';

function makeRule(overrides: Partial<PricingRule> & { id: string; type: string; multiplier: number }): PricingRule {
  return {
    name: overrides.id,
    enabled: true,
    priority: 5,
    startDate: null,
    endDate: null,
    dayOfWeek: [],
    minDays: null,
    year: null,
    ...overrides,
  };
}

function d(iso: string) {
  return new Date(iso + 'T00:00:00Z');
}

describe('computePricing', () => {
  it('1. no rules → multiplier = 1.0', () => {
    const result = computePricing({
      pickupDate: d('2024-06-10'),
      returnDate: d('2024-06-12'),
      totalDays: 2,
      rules: [],
    });
    expect(result.finalMultiplier).toBe(1.0);
    expect(result.appliedRules).toHaveLength(0);
    expect(result.adjustmentPercent).toBe(0);
  });

  it('2. season rule matching pickup date → correct multiplier applied', () => {
    const rule = makeRule({
      id: 'r1',
      type: 'season',
      multiplier: 1.15,
      startDate: d('2024-09-01'),
      endDate: d('2024-09-10'),
    });
    const result = computePricing({
      pickupDate: d('2024-09-05'),
      returnDate: d('2024-09-07'),
      totalDays: 2,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBeCloseTo(1.15, 3);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0].ruleId).toBe('r1');
    expect(result.adjustmentPercent).toBe(15);
  });

  it('3. season rule NOT matching → multiplier remains 1.0', () => {
    const rule = makeRule({
      id: 'r2',
      type: 'season',
      multiplier: 1.20,
      startDate: d('2024-12-20'),
      endDate: d('2025-01-03'),
    });
    const result = computePricing({
      pickupDate: d('2024-06-10'),
      returnDate: d('2024-06-12'),
      totalDays: 2,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBe(1.0);
    expect(result.appliedRules).toHaveLength(0);
  });

  it('4. holiday rule on exact date → applied', () => {
    const rule = makeRule({
      id: 'h1',
      type: 'holiday',
      multiplier: 1.25,
      startDate: d('2024-07-04'),
      endDate: d('2024-07-04'),
    });
    const result = computePricing({
      pickupDate: d('2024-07-04'),
      returnDate: d('2024-07-05'),
      totalDays: 1,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBeCloseTo(1.20, 3); // clamped at ceiling
    expect(result.appliedRules[0].ruleId).toBe('h1');
  });

  it('5. day_of_week rule matching Friday → applied', () => {
    const rule = makeRule({
      id: 'dow1',
      type: 'day_of_week',
      multiplier: 1.15,
      dayOfWeek: [5, 6, 0], // Fri=5, Sat=6, Sun=0
    });
    // 2024-06-07 is a Friday
    const result = computePricing({
      pickupDate: d('2024-06-07'),
      returnDate: d('2024-06-08'),
      totalDays: 1,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBeCloseTo(1.15, 3);
    expect(result.appliedRules).toHaveLength(1);
  });

  it('6. day_of_week rule NOT matching Wednesday → not applied', () => {
    const rule = makeRule({
      id: 'dow2',
      type: 'day_of_week',
      multiplier: 1.15,
      dayOfWeek: [5, 6, 0], // Fri, Sat, Sun only
    });
    // 2024-06-05 is a Wednesday
    const result = computePricing({
      pickupDate: d('2024-06-05'),
      returnDate: d('2024-06-06'),
      totalDays: 1,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBe(1.0);
    expect(result.appliedRules).toHaveLength(0);
  });

  it('7. long_stay 7 days with ≥7-day rule → applied', () => {
    const rule = makeRule({
      id: 'ls7',
      type: 'long_stay',
      multiplier: 0.92,
      minDays: 7,
    });
    const result = computePricing({
      pickupDate: d('2024-06-01'),
      returnDate: d('2024-06-08'),
      totalDays: 7,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBeCloseTo(0.92, 3);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0].ruleId).toBe('ls7');
    expect(result.adjustmentPercent).toBe(-8);
  });

  it('8. long_stay 3 days with 7-day-only rule → NOT applied', () => {
    const rule = makeRule({
      id: 'ls7b',
      type: 'long_stay',
      multiplier: 0.92,
      minDays: 7,
    });
    const result = computePricing({
      pickupDate: d('2024-06-01'),
      returnDate: d('2024-06-04'),
      totalDays: 3,
      rules: [rule],
    });
    expect(result.finalMultiplier).toBe(1.0);
    expect(result.appliedRules).toHaveLength(0);
  });

  it('9. multiple stacking rules → clamped to 1.20 ceiling', () => {
    const rules: PricingRule[] = [
      makeRule({ id: 's1', type: 'season',   multiplier: 1.20, startDate: d('2024-12-20'), endDate: d('2025-01-03') }),
      makeRule({ id: 'h1', type: 'holiday',  multiplier: 1.25, startDate: d('2024-12-25'), endDate: d('2024-12-25') }),
      makeRule({ id: 'd1', type: 'day_of_week', multiplier: 1.15, dayOfWeek: [5, 6, 0] }),
    ];
    // 2024-12-25 is a Wednesday — dow rule should NOT fire for a single-day booking
    const result = computePricing({
      pickupDate: d('2024-12-25'),
      returnDate: d('2024-12-26'),
      totalDays: 1,
      rules,
    });
    // season (+0.20) + holiday (+0.25) = raw 1.45 → clamped to 1.20
    expect(result.finalMultiplier).toBe(1.20);
    expect(result.appliedRules.length).toBeGreaterThanOrEqual(2);
  });

  it('10. year-specific rule: fires on correct year', () => {
    const rule = makeRule({
      id: 'yr1', type: 'holiday', multiplier: 1.15,
      startDate: d('2025-04-18'), endDate: d('2025-04-18'), year: 2025,
    });
    const r = computePricing({
      pickupDate: d('2025-04-18'), returnDate: d('2025-04-19'), totalDays: 1, rules: [rule],
    });
    expect(r.appliedRules).toHaveLength(1);
    expect(r.finalMultiplier).toBeCloseTo(1.15);
  });

  it('11. year-specific rule: does NOT fire on wrong year', () => {
    const rule = makeRule({
      id: 'yr2', type: 'holiday', multiplier: 1.15,
      startDate: d('2025-04-18'), endDate: d('2025-04-18'), year: 2025,
    });
    const r = computePricing({
      pickupDate: d('2026-04-18'), returnDate: d('2026-04-19'), totalDays: 1, rules: [rule],
    });
    expect(r.appliedRules).toHaveLength(0);
    expect(r.finalMultiplier).toBe(1.0);
  });
});
