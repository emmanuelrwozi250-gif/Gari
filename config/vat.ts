/**
 * Rwanda VAT — 18%
 *
 * Gari acts as a tax collection agent for every host:
 *  - VAT is charged on top of the rental service value (subtotal + driver fee)
 *  - Gari holds the VAT and remits it to Rwanda Revenue Authority (RRA)
 *  - Both renter and host receive an EBM receipt at transaction completion
 *
 * NOT applied to: security deposit, platform/service fee, or insurance.
 */

export const VAT_RATE = 0.18;
export const VAT_LABEL = 'VAT (18% — RRA)';
export const VAT_AUTHORITY = 'Rwanda Revenue Authority (RRA)';

/**
 * Calculate VAT on the host's rental service value.
 * Base = subtotal (daily rate × days) + driverFee (if driver included).
 */
export function calculateVAT(subtotal: number, driverFee = 0): number {
  return Math.round((subtotal + driverFee) * VAT_RATE);
}
