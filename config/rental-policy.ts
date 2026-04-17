/**
 * Rental Policy — single source of truth for all fee rules and timings.
 * Import this in every cron, API route, and UI component that calculates fees.
 * Never hardcode these values elsewhere.
 */

export const RENTAL_POLICY = {
  // ── Late return ─────────────────────────────────────────────────
  GRACE_PERIOD_MINUTES: 30,           // no charge within 30 min of return time
  LATE_FEE_PER_HOUR_RWF: 5000,       // RWF 5,000 per hour (pro-rated per minute)
  LATE_FULL_DAY_THRESHOLD_HOURS: 3,  // after 3h late → charge full daily rate
  LATE_ESCALATION_HOURS: 24,         // after 24h no contact → potential theft report

  // ── Extension pricing ───────────────────────────────────────────
  EXTENSION_RATE_MULTIPLIER: 1.0,    // same as daily rate, pro-rated per hour
  EXTENSION_MIN_HOURS: 1,
  EXTENSION_MAX_HOURS: 24,

  // ── Notification timing (minutes relative to returnDate) ────────
  NOTIF_2H_MINUTES: 120,             // send 2h before return
  NOTIF_30M_MINUTES: 30,             // send 30m before return
  NOTIF_AT_TIME_MINUTES: 5,          // send within ±5 min of return time
  NOTIF_LATE_30M_MINUTES: 30,        // send when 30m past return (after grace)
  NOTIF_LATE_1H_MINUTES: 60,         // send when 60m past return

  // ── Cancellation refund percentages ────────────────────────────
  CANCEL_FREE_WINDOW_HOURS: 24,           // free cancel if > 24h before pickup
  CANCEL_PARTIAL_REFUND_PCT: 50,          // 50% refund if < 24h before pickup
  HOST_CANCEL_RENTER_REFUND_PCT: 100,     // host cancels → 100% to renter
  HOST_CANCEL_RESPONSE_HOURS: 24,         // host must respond within 24h

  // ── Repeat offender thresholds ──────────────────────────────────
  LATE_FLAG_COUNT: 2,         // flagged after 2 late returns
  SUSPENSION_COUNT: 3,        // suspended after 3 late returns in 6 months
  SUSPENSION_DAYS: 30,        // suspension duration in days
} as const;

// ── Fee calculation helpers ──────────────────────────────────────────

/**
 * Calculate late fee in RWF.
 * Returns 0 within grace period.
 * Caps at the full daily rate after LATE_FULL_DAY_THRESHOLD_HOURS.
 */
export function calculateLateFee(
  minutesLate: number,
  dailyRateRwf: number
): number {
  if (minutesLate <= RENTAL_POLICY.GRACE_PERIOD_MINUTES) return 0;

  const billableMinutes = minutesLate - RENTAL_POLICY.GRACE_PERIOD_MINUTES;
  const billableHours = billableMinutes / 60;

  // After threshold → charge full daily rate
  if (billableHours >= RENTAL_POLICY.LATE_FULL_DAY_THRESHOLD_HOURS) {
    return dailyRateRwf;
  }

  // Otherwise → hourly rate, pro-rated
  return Math.round(billableHours * RENTAL_POLICY.LATE_FEE_PER_HOUR_RWF);
}

/**
 * Calculate extension fee in RWF, pro-rated from daily rate.
 */
export function calculateExtensionFee(
  hoursAdded: number,
  dailyRateRwf: number
): number {
  const hourlyRate = dailyRateRwf / 24;
  return Math.round(hoursAdded * hourlyRate * RENTAL_POLICY.EXTENSION_RATE_MULTIPLIER);
}
