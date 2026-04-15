import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  // Simple class merger without clsx dependency
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RWF_TO_USD = 1100;

export function formatRWF(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`;
}

export function toUSD(rwfAmount: number): string {
  return `≈ $${Math.round(rwfAmount / RWF_TO_USD).toLocaleString()}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateDays(pickupDate: Date | string, returnDate: Date | string): number {
  const pickup = new Date(pickupDate);
  const ret = new Date(returnDate);
  const diff = ret.getTime() - pickup.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculateBookingFees(
  pricePerDay: number,
  totalDays: number,
  driverPricePerDay: number = 0,
  withDriver: boolean = false
) {
  const subtotal = pricePerDay * totalDays;
  const driverFee = withDriver ? driverPricePerDay * totalDays : 0;
  const platformFee = Math.round((subtotal + driverFee) * 0.10);
  const totalAmount = subtotal + driverFee + platformFee;
  return { subtotal, driverFee, platformFee, totalAmount };
}

export function getCarTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ECONOMY: 'Economy',
    SEDAN: 'Sedan',
    SUV_4X4: 'SUV / 4x4',
    EXECUTIVE: 'Executive',
    MINIBUS: 'Minibus',
    PICKUP: 'Pickup',
    LUXURY: 'Luxury',
  };
  return labels[type] || type;
}

export function getTransmissionLabel(t: string): string {
  return t === 'AUTOMATIC' ? 'Automatic' : 'Manual';
}

export function getFuelLabel(fuel: string): string {
  const labels: Record<string, string> = {
    PETROL: 'Petrol',
    DIESEL: 'Diesel',
    HYBRID: 'Hybrid',
    ELECTRIC: 'Electric',
  };
  return labels[fuel] || fuel;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    MTN_MOMO: 'MTN Mobile Money',
    AIRTEL_MONEY: 'Airtel Money',
    CARD: 'Credit / Debit Card',
  };
  return labels[method] || method;
}

export function getBookingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-primary-light text-primary',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function generateReferralCode(userId: string): string {
  // GARI-XXXXXX — 6 chars derived from userId + random salt for uniqueness
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seed = userId.slice(-4);
  let code = 'GARI-';
  for (let i = 0; i < 6; i++) {
    const idx = (seed.charCodeAt(i % seed.length) + i * 17 + Math.floor(Math.random() * 32)) % chars.length;
    code += chars[idx];
  }
  return code;
}

export function generateCarSlug(make: string, model: string, year: number, district: string, id: string): string {
  const base = `${year}-${make}-${model}-${district}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${id.slice(-4)}`;
}

export function generateBookingRef(): string {
  return `GARI-${Date.now().toString(36).toUpperCase()}`;
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}
