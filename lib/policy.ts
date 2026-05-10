/**
 * policy.ts
 * Gari rental policy constants and late-return fee calculator.
 */

/** Grace period (minutes) before late fees accrue */
export const GRACE_MINUTES = 30

/** Late fee per hour (RWF) after the grace period expires */
export const LATE_FEE_PER_HOUR = 5_000

/** Maximum number of days a trip can be extended beyond the original return date */
export const MAX_EXTENSION_DAYS = 7

/** Minimum trip duration in days */
export const MIN_TRIP_DAYS = 1

/**
 * Cancellation policy:
 * - Free cancellation if cancelled ≥ 24 h before pickup
 * - 50% refund if cancelled < 24 h before pickup
 * - No refund once trip is active
 */
export const CANCEL_FREE_HOURS  = 24
export const CANCEL_PARTIAL_PCT = 0.5

export interface LateFeeResult {
  minutesLate: number
  hoursLate: number
  gracePeriodActive: boolean
  lateFee: number   // RWF
}

/**
 * Calculate the late return fee.
 *
 * @param scheduledReturn  The original agreed return date/time.
 * @param actualReturn     The actual return date/time (or Date.now() for a live estimate).
 * @param _pricePerDay     Reserved for future per-car late fee scaling (unused).
 */
export function calcLateFee(
  scheduledReturn: Date,
  actualReturn: Date,
  _pricePerDay?: number,
): LateFeeResult {
  const msLate = actualReturn.getTime() - scheduledReturn.getTime()

  if (msLate <= 0) {
    return { minutesLate: 0, hoursLate: 0, gracePeriodActive: false, lateFee: 0 }
  }

  const minutesLate = msLate / 60_000

  if (minutesLate <= GRACE_MINUTES) {
    return { minutesLate: Math.round(minutesLate), hoursLate: 0, gracePeriodActive: true, lateFee: 0 }
  }

  // Charge full hours (ceiling) after the grace period
  const billableMinutes = minutesLate - GRACE_MINUTES
  const hoursLate = Math.ceil(billableMinutes / 60)
  const lateFee   = hoursLate * LATE_FEE_PER_HOUR

  return {
    minutesLate: Math.round(minutesLate),
    hoursLate,
    gracePeriodActive: false,
    lateFee,
  }
}

/**
 * Whether a renter qualifies for a full refund on cancellation.
 *
 * @param pickupDate  The scheduled pickup date.
 * @param cancelledAt  When the renter is cancelling (defaults to now).
 */
export function isFreeCancel(pickupDate: Date, cancelledAt: Date = new Date()): boolean {
  const hoursUntilPickup = (pickupDate.getTime() - cancelledAt.getTime()) / 3_600_000
  return hoursUntilPickup >= CANCEL_FREE_HOURS
}

/**
 * Calculate the refund amount for a cancellation.
 *
 * @param totalPaid   Amount the renter paid (excluding deposit).
 * @param pickupDate  The scheduled pickup date.
 * @param cancelledAt When the renter is cancelling.
 */
export function calcCancelRefund(
  totalPaid: number,
  pickupDate: Date,
  cancelledAt: Date = new Date(),
): number {
  if (isFreeCancel(pickupDate, cancelledAt)) return totalPaid
  return Math.round(totalPaid * CANCEL_PARTIAL_PCT)
}
