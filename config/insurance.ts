/**
 * Insurance coverage constants — single source of truth.
 * Import these instead of hardcoding amounts across pages.
 */
export const INSURANCE = {
  /** Standard trip: third-party liability (RWF) */
  STANDARD_LIABILITY_RWF: 5_000_000,
  /** Standard trip: medical expenses (RWF) */
  STANDARD_MEDICAL_RWF: 500_000,
  /** International / high-value trips: third-party liability (RWF) */
  INTERNATIONAL_LIABILITY_RWF: 20_000_000,
  /** Gari Protect add-on: vehicle damage coverage (RWF) */
  PROTECT_VEHICLE_RWF: 2_000_000,
  /** International / premium trips: medical expenses (RWF) */
  INTERNATIONAL_MEDICAL_RWF: 3_000_000,
  /** Claim reporting window (hours) — must match FAQ + insurance page */
  CLAIM_WINDOW_HOURS: 48,
} as const;

/** Helper: format an RWF amount as "RWF X,XXX,XXX" */
export function formatInsuranceRWF(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`;
}
