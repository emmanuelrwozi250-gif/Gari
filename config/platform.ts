/**
 * Platform-wide fee and rate constants.
 * Single source of truth — import from here, never hardcode inline.
 */
export const PLATFORM = {
  /** Platform fee charged on each booking, deducted from host earnings */
  FEE_PERCENT: 12,
  FEE_RATE: 0.12,

  /** Rwanda Revenue Authority VAT rate */
  VAT_PERCENT: 18,
  VAT_RATE: 0.18,

  /** Optional Gari Protect insurance per day (RWF) */
  INSURANCE_PER_DAY: 5000,

  /** Monthly boost subscription price in RWF (~$10 at 1 USD = 1,450 RWF) */
  BOOST_PRICE_RWF: 14500,

  /** Boost subscription duration in days */
  BOOST_DURATION_DAYS: 30,
} as const;
