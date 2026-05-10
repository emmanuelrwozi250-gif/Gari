/**
 * booking-calc.ts
 * Single-source pricing utility for the Gari booking flow.
 * All monetary values are in RWF (Rwandan Franc).
 */

export const GARI_FEE    = 0.12   // 12% platform fee
export const VAT_RATE    = 0.18   // 18% VAT (RRA)
export const PROTECT_DAY = 5000   // Gari Protect insurance per day (RWF)
export const USD_RATE    = 1450   // RWF per USD (approx)

export interface BookingCalcInput {
  pricePerDay: number
  days: number
  driverFee?: number
  withDriver?: boolean
  withProtect?: boolean
  deposit?: number
}

export interface BookingCalcResult {
  rental: number    // pricePerDay × days
  driver: number    // driver fee × days (0 if no driver)
  protect: number   // Gari Protect × days (0 if not selected)
  gariFee: number   // 12% platform fee on (rental + driver + protect)
  preVat: number    // subtotal before VAT = rental+driver+protect+gariFee
  vat: number       // 18% VAT on preVat
  total: number     // preVat + vat  (amount charged for the trip)
  deposit: number   // security deposit (held, refunded after trip)
  dueToday: number  // total + deposit
  usd: number       // dueToday converted to USD at USD_RATE
}

/**
 * Calculate the full price breakdown for a Gari booking.
 *
 * @example
 * calcBooking({ pricePerDay: 75000, days: 3, deposit: 50000 })
 * // → dueToday ≈ 347,475 RWF
 */
export function calcBooking({
  pricePerDay,
  days,
  driverFee = 0,
  withDriver = false,
  withProtect = false,
  deposit = 0,
}: BookingCalcInput): BookingCalcResult {
  const rental   = pricePerDay * days
  const driver   = withDriver && driverFee > 0 ? driverFee * days : 0
  const protect  = withProtect ? PROTECT_DAY * days : 0
  const base     = rental + driver + protect
  const gariFee  = Math.round(base * GARI_FEE)
  const preVat   = base + gariFee
  const vat      = Math.round(preVat * VAT_RATE)
  const total    = preVat + vat
  const dueToday = total + deposit

  return {
    rental,
    driver,
    protect,
    gariFee,
    preVat,
    vat,
    total,
    deposit,
    dueToday,
    usd: Math.round(dueToday / USD_RATE),
  }
}
