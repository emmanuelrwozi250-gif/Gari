/**
 * whatsapp.ts
 * Pre-filled WhatsApp deep-link generators for all Gari notification types.
 * Uses the shared waLink() helper from lib/config/company.ts.
 */

import { waLink } from '@/lib/config/company';

/** Shorten a booking ID to the last 6 chars, uppercase, for display */
function shortId(bookingId: string): string {
  return bookingId.slice(-6).toUpperCase();
}

// ---------------------------------------------------------------------------
// Renter → Host
// ---------------------------------------------------------------------------

/**
 * After a booking is created — renter greets the host.
 */
export function waBookingGreeting(
  car: { make: string; model: string },
  hostName: string,
  bookingId: string,
): string {
  return waLink(
    `Hi ${hostName}, I just booked your ${car.make} ${car.model} on Gari ` +
    `(ref #${shortId(bookingId)}). Looking forward to it! When can we arrange pickup?`,
  );
}

/**
 * When the host has confirmed — renter follows up on handover details.
 */
export function waBookingConfirmed(
  car: { make: string; model: string },
  hostName: string,
  bookingId: string,
): string {
  return waLink(
    `Hi ${hostName}, my Gari booking for your ${car.make} ${car.model} ` +
    `(#${shortId(bookingId)}) was confirmed. Where should we meet for pickup?`,
  );
}

/**
 * Renter wants to extend their trip.
 */
export function waExtendTrip(
  car: { make: string; model: string },
  hostName: string,
  extraDays: number,
): string {
  return waLink(
    `Hi ${hostName}, I'd like to extend my ${car.make} ${car.model} rental ` +
    `by ${extraDays} day${extraDays !== 1 ? 's' : ''}. Is it still available?`,
  );
}

/**
 * Renter is returning late — notifies host.
 */
export function waLateReturn(
  car: { make: string; model: string },
  hostName: string,
  bookingId: string,
  hoursLate: number,
): string {
  return waLink(
    `Hi ${hostName}, I'll be returning your ${car.make} ${car.model} ` +
    `(#${shortId(bookingId)}) approximately ${hoursLate}h late. Apologies for the delay!`,
  );
}

// ---------------------------------------------------------------------------
// Renter / Host → Gari Support
// ---------------------------------------------------------------------------

/**
 * Contact Gari support about a specific booking.
 */
export function waSupportBooking(bookingId: string): string {
  return waLink(`Hi Gari, I need help with booking #${shortId(bookingId)}.`);
}

/**
 * Contact Gari support for a general inquiry.
 */
export function waSupportGeneral(topic?: string): string {
  const suffix = topic ? ` regarding: ${topic}` : '.';
  return waLink(`Hi Gari, I have a question${suffix}`);
}

// ---------------------------------------------------------------------------
// Host → Renter
// ---------------------------------------------------------------------------

/**
 * Host confirms car is ready for pickup.
 */
export function waHostReady(
  car: { make: string; model: string },
  renterName: string,
  pickupLocation: string,
): string {
  return waLink(
    `Hi ${renterName}, your ${car.make} ${car.model} is ready for pickup ` +
    `at ${pickupLocation}. See you soon!`,
  );
}

/**
 * Host reports a late return to Gari support.
 */
export function waHostLateReturnReport(
  car: { make: string; model: string },
  bookingId: string,
): string {
  return waLink(
    `Hi Gari, I need to report a late return for booking #${shortId(bookingId)} ` +
    `(${car.make} ${car.model}). The renter hasn't returned on time.`,
  );
}
