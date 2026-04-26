/**
 * Gari cancellation policy tiers.
 *
 * Hosts choose a policy when listing their car.
 * The policy is enforced by /api/bookings/[id]/cancel.
 */
export type PolicyTier = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export interface TierConfig {
  /** Label shown in the UI */
  label: string;
  /** Short description for the listing page */
  description: string;
  /** Hours before PICKUP that renter can cancel for a full refund */
  freeWindowHoursBeforePickup: number;
  /** Hours after BOOKING CREATION that renter can cancel for a full refund
   *  (applies regardless of pickup date — the "cooling-off" window) */
  coolingOffHours: number;
  /** Refund % outside the free window (and after cooling-off) */
  partialRefundPercent: number;
}

export const POLICY_TIERS: Record<PolicyTier, TierConfig> = {
  FLEXIBLE: {
    label: 'Flexible',
    description: 'Full refund up to 24 h before pickup.',
    freeWindowHoursBeforePickup: 24,
    coolingOffHours: 48,
    partialRefundPercent: 50,
  },
  MODERATE: {
    label: 'Moderate',
    description: 'Full refund up to 3 days before pickup.',
    freeWindowHoursBeforePickup: 72,
    coolingOffHours: 24,
    partialRefundPercent: 50,
  },
  STRICT: {
    label: 'Strict',
    description: 'Full refund within 24 h of booking only.',
    freeWindowHoursBeforePickup: 0,   // No free window based on pickup date
    coolingOffHours: 24,
    partialRefundPercent: 0,
  },
};

/** Legacy flat constants — kept for backward compat, maps to MODERATE */
export const CANCELLATION_POLICY = {
  RENTER_FREE_WINDOW_HOURS: 24,
  RENTER_PARTIAL_REFUND_PERCENT: 50,
  HOST_CANCEL_RENTER_REFUND: 100,
  HOST_CANCEL_PENALTY: true,
  HOST_NO_RESPONSE_HOURS: 24,
  HOST_NO_RESPONSE_REFUND: 100,
  DEPOSIT_REFUND_HOURS: 48,
} as const;

/**
 * Calculate the renter refund percentage for a given policy + timing.
 *
 * @param policy       The car's cancellation policy tier
 * @param pickupDate   ISO timestamp of the pickup date
 * @param createdAt    ISO timestamp of when the booking was created
 * @returns            Refund percentage (0–100)
 */
export function calcRenterRefundPct(
  policy: PolicyTier,
  pickupDate: string,
  createdAt: string,
): number {
  const cfg = POLICY_TIERS[policy];
  const now = Date.now();
  const pickupMs = new Date(pickupDate).getTime();
  const createdMs = new Date(createdAt).getTime();

  const hoursUntilPickup = (pickupMs - now) / (1000 * 60 * 60);
  const hoursSinceCreated = (now - createdMs) / (1000 * 60 * 60);

  // Still in cooling-off window → full refund
  if (hoursSinceCreated <= cfg.coolingOffHours) return 100;

  // Still within the pickup-relative free window → full refund
  if (cfg.freeWindowHoursBeforePickup > 0 && hoursUntilPickup >= cfg.freeWindowHoursBeforePickup) return 100;

  // Outside both windows → partial (or zero for STRICT)
  return cfg.partialRefundPercent;
}
