/**
 * EBM (Electronic Billing Machine) Receipt Generator
 *
 * Generates a structured receipt object at transaction completion.
 * Gari remits the VAT to Rwanda Revenue Authority (RRA) on behalf of hosts.
 *
 * TODO: integrate with RRA EBM API once credentials are issued.
 * API endpoint (placeholder): https://rra.gov.rw/ebm/api/submit
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
