/**
 * EBM (Electronic Billing Machine) Receipt Generator
 *
 * Generates a structured receipt object at transaction completion.
 * Gari remits the VAT to Rwanda Revenue Authority (RRA) on behalf of hosts.
 *
 * issueEBMReceipt() — Option A: real RRA EBM API (env vars required).
 *                   — Option B fallback: logs receipt for manual submission.
 *
 * Env vars (Option A):
 *   RRA_EBM_API_URL    - RRA EBM API base URL
 *   RRA_EBM_API_KEY    - RRA EBM API key
 *   RRA_TAXPAYER_PIN   - Gari's RRA taxpayer PIN
 */

import { format } from 'date-fns';

export interface EBMReceiptItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface EBMReceipt {
  receiptNo: string;          // e.g. "EBM-A1B2C3D4-202604261230"
  issuedAt: Date;
  supplier: {
    name: string;
    tin: string;              // host's TIN (placeholder until RRA integration)
  };
  buyer: {
    name: string;
    phone: string;
  };
  items: EBMReceiptItem[];
  vatBase: number;            // amount VAT was applied to (subtotal + driverFee)
  vatAmount: number;          // 18% of vatBase
  platformFee: number;        // Gari service fee (10%)
  grandTotal: number;         // totalAmount including VAT
  currency: 'RWF';
  note: string;
}

interface BookingForReceipt {
  id: string;
  subtotal: number;
  driverFee: number;
  platformFee: number;
  insuranceFee: number;
  vatAmount: number;
  totalAmount: number;
  totalDays: number;
  withDriver: boolean;
  car: { make: string; model: string; year: number; pricePerDay: number };
  renter: { name: string | null; phone: string | null };
  host: { name: string | null };
}

export interface IssueReceiptResult {
  receiptNumber: string;
  receiptUrl?: string;
}

/**
 * Issue an EBM receipt for a completed booking.
 *
 * Option A — real RRA EBM API (when RRA_EBM_API_URL, RRA_EBM_API_KEY,
 *   and RRA_TAXPAYER_PIN are all set). Returns { receiptNumber, receiptUrl }.
 *
 * Option B fallback — logs the receipt JSON for manual RRA submission.
 *   Returns { receiptNumber } (no URL).
 */
export async function issueEBMReceipt(booking: BookingForReceipt): Promise<IssueReceiptResult> {
  const receipt = generateEBMReceipt(booking);

  const rraUrl = process.env.RRA_EBM_API_URL;
  const rraKey = process.env.RRA_EBM_API_KEY;
  const pin    = process.env.RRA_TAXPAYER_PIN;

  // Option A — real RRA EBM API
  if (rraUrl && rraKey && pin) {
    try {
      const res = await fetch(`${rraUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rraKey,
          'x-taxpayer-pin': pin,
        },
        body: JSON.stringify({
          receiptNo: receipt.receiptNo,
          issuedAt: receipt.issuedAt.toISOString(),
          supplier: receipt.supplier,
          buyer: receipt.buyer,
          items: receipt.items,
          vatBase: receipt.vatBase,
          vatAmount: receipt.vatAmount,
          grandTotal: receipt.grandTotal,
          currency: receipt.currency,
          note: receipt.note,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const receiptNumber: string = (data as { receiptNumber?: string; receiptNo?: string }).receiptNumber
          ?? (data as { receiptNumber?: string; receiptNo?: string }).receiptNo
          ?? receipt.receiptNo;
        const receiptUrl: string | undefined = (data as { receiptUrl?: string }).receiptUrl;
        console.log(`[EBM] Receipt issued via RRA API: ${receiptNumber}`);
        return { receiptNumber, receiptUrl };
      }

      const errText = await res.text().catch(() => res.statusText);
      console.error(`[EBM] RRA API error (${res.status}): ${errText} — falling back to manual`);
    } catch (err) {
      console.error('[EBM] RRA API call failed — falling back to manual submission:', err);
    }
  }

  // Option B — manual fallback: log for RRA submission queue
  console.log('[EBM] Receipt queued for manual RRA submission:', JSON.stringify(receipt, null, 2));
  return { receiptNumber: receipt.receiptNo };
}

export function generateEBMReceipt(booking: BookingForReceipt): EBMReceipt {
  const now = new Date();
  const receiptNo = `EBM-${booking.id.slice(0, 8).toUpperCase()}-${format(now, 'yyyyMMddHHmm')}`;

  const items: EBMReceiptItem[] = [
    {
      description: `Car rental — ${booking.car.year} ${booking.car.make} ${booking.car.model} × ${booking.totalDays} day${booking.totalDays !== 1 ? 's' : ''}`,
      qty: booking.totalDays,
      unitPrice: booking.car.pricePerDay,
      amount: booking.subtotal,
    },
  ];

  if (booking.withDriver && booking.driverFee > 0) {
    items.push({
      description: `Professional driver × ${booking.totalDays} day${booking.totalDays !== 1 ? 's' : ''}`,
      qty: booking.totalDays,
      unitPrice: Math.round(booking.driverFee / booking.totalDays),
      amount: booking.driverFee,
    });
  }

  if (booking.insuranceFee > 0) {
    items.push({
      description: `Gari Protect insurance × ${booking.totalDays} day${booking.totalDays !== 1 ? 's' : ''}`,
      qty: booking.totalDays,
      unitPrice: Math.round(booking.insuranceFee / booking.totalDays),
      amount: booking.insuranceFee,
    });
  }

  const vatBase = booking.subtotal + booking.driverFee;

  return {
    receiptNo,
    issuedAt: now,
    supplier: {
      name: booking.host.name ?? 'Gari Host',
      tin: 'PENDING-RRA-INTEGRATION',   // replaced with real TIN once RRA API live
    },
    buyer: {
      name: booking.renter.name ?? 'Gari Renter',
      phone: booking.renter.phone ?? '',
    },
    items,
    vatBase,
    vatAmount: booking.vatAmount,
    platformFee: booking.platformFee,
    grandTotal: booking.totalAmount,
    currency: 'RWF',
    note: 'VAT (18%) collected and remitted to Rwanda Revenue Authority by Gari on behalf of host.',
  };
}
