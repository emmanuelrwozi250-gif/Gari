/**
 * Late return, extension, and on-my-way WhatsApp/SMS message templates.
 * All messages reference RENTAL_POLICY constants — never hardcode fees here.
 */

import { RENTAL_POLICY } from '@/config/rental-policy';
import { formatRWF } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gari-nu.vercel.app';

// ── Renter reminders ─────────────────────────────────────────────────────────

export function msg_reminder2h(
  renterName: string,
  carName: string,
  returnDate: Date,
  bookingId: string
): string {
  const time = format(returnDate, 'h:mm a');
  return [
    `Hi ${renterName}! Quick reminder — your *${carName}* is due back at *${time}* (in ~2 hours).`,
    ``,
    `Running on schedule? Great! 🚗`,
    ``,
    `Need more time? Extend your booking now to avoid late fees:`,
    `${BASE_URL}/bookings/${bookingId}`,
    ``,
    `— Gari | +250 788 123 000`,
  ].join('\n');
}

export function msg_reminder30m(
  renterName: string,
  carName: string,
  returnDate: Date,
  bookingId: string
): string {
  const time = format(returnDate, 'h:mm a');
  const graceEnd = format(addMinutes(returnDate, RENTAL_POLICY.GRACE_PERIOD_MINUTES), 'h:mm a');
  return [
    `Hi ${renterName}, your *${carName}* is due back in *30 minutes* at ${time}.`,
    ``,
    `You have a ${RENTAL_POLICY.GRACE_PERIOD_MINUTES}-min grace period until ${graceEnd}.`,
    `After that, late fees of ${formatRWF(RENTAL_POLICY.LATE_FEE_PER_HOUR_RWF)}/hr apply.`,
    ``,
    `Extend now → ${BASE_URL}/bookings/${bookingId}`,
    ``,
    `— Gari`,
  ].join('\n');
}

export function msg_atReturnTime(
  renterName: string,
  carName: string,
  returnDate: Date,
  bookingId: string
): string {
  const graceEnd = format(addMinutes(returnDate, RENTAL_POLICY.GRACE_PERIOD_MINUTES), 'h:mm a');
  return [
    `Hi ${renterName}, your booking for *${carName}* has just ended.`,
    ``,
    `⏱ Grace period until *${graceEnd}* — no charge until then.`,
    `After that: ${formatRWF(RENTAL_POLICY.LATE_FEE_PER_HOUR_RWF)}/hr late fee applies automatically.`,
    ``,
    `Extend booking → ${BASE_URL}/bookings/${bookingId}`,
    `Tap "I'm on my way" → ${BASE_URL}/bookings/${bookingId}`,
    ``,
    `— Gari`,
  ].join('\n');
}

export function msg_late30m(
  renterName: string,
  carName: string,
  minutesLate: number,
  feeAccrued: number,
  bookingId: string
): string {
  return [
    `⚠️ Hi ${renterName}, your *${carName}* is now *${minutesLate} minutes overdue*.`,
    ``,
    `Late fees running: *${formatRWF(feeAccrued)}*`,
    `Your host has been notified.`,
    ``,
    `Stop the clock — extend your booking now:`,
    `${BASE_URL}/bookings/${bookingId}`,
    ``,
    `Ignoring this may restrict your account.`,
    ``,
    `— Gari Support | +250 788 123 000`,
  ].join('\n');
}

export function msg_late1h(
  renterName: string,
  carName: string,
  minutesLate: number,
  feeAccrued: number,
  bookingId: string
): string {
  return [
    `🚨 *URGENT*: ${renterName}, your *${carName}* is *${minutesLate} minutes overdue*.`,
    ``,
    `Late fees: *${formatRWF(feeAccrued)}*`,
    ``,
    `Return the car or extend your booking immediately:`,
    `${BASE_URL}/bookings/${bookingId}`,
    ``,
    `If you do not respond within 1 hour, your host can report a no-show`,
    `and your account may be suspended.`,
    ``,
    `Contact Gari urgently: *+250 788 123 000*`,
    ``,
    `— Gari`,
  ].join('\n');
}

export function msg_escalation(
  renterName: string,
  carName: string,
  hostName: string,
  hoursLate: number
): string {
  return [
    `🚨 *URGENT — Gari Support*`,
    ``,
    `${renterName}, your booking for ${hostName}'s *${carName}* ended *${hoursLate} hours ago* with no contact.`,
    ``,
    `This is a serious breach of our terms. Gari support is now involved.`,
    ``,
    `Call us *immediately*: +250 788 123 000`,
    ``,
    `Failure to respond within 12 hours may result in a formal report`,
    `to authorities using your NIDA-verified identity.`,
    ``,
    `— Gari Operations Team`,
  ].join('\n');
}

// ── Host notifications ────────────────────────────────────────────────────────

export function msg_host_lateWarning(
  hostName: string,
  renterName: string,
  carName: string,
  minutesLate: number,
  bookingId: string
): string {
  return [
    `Hi ${hostName}, *${renterName}* has not returned your *${carName}* yet.`,
    `They are *${minutesLate} minutes overdue*.`,
    ``,
    `Late fees are accruing automatically. We have sent ${renterName} multiple reminders.`,
    ``,
    `View booking: ${BASE_URL}/dashboard/host`,
    ``,
    `— Gari`,
  ].join('\n');
}

export function msg_host_noShowUnlock(
  hostName: string,
  renterName: string,
  carName: string,
  bookingId: string
): string {
  return [
    `Hi ${hostName}, *${renterName}* still has not returned your *${carName}* and has not responded.`,
    ``,
    `You can now report a no-show from your dashboard:`,
    `${BASE_URL}/dashboard/host`,
    ``,
    `Gari support is already involved. Call us: *+250 788 123 000*`,
    ``,
    `— Gari Operations`,
  ].join('\n');
}

// ── Extension notifications ───────────────────────────────────────────────────

export function msg_extensionConfirmed(
  renterName: string,
  carName: string,
  hoursAdded: number,
  newReturnDate: Date,
  feePaid: number
): string {
  const newTime = format(newReturnDate, "h:mm a, EEE d MMM");
  return [
    `✅ *Booking extended!*`,
    ``,
    `Hi ${renterName}, your *${carName}* booking has been extended by *${hoursAdded} hour${hoursAdded > 1 ? 's' : ''}*.`,
    ``,
    `New return time: *${newTime}*`,
    `Extension fee paid: ${formatRWF(feePaid)}`,
    ``,
    `Your host has been notified. Safe travels! 🚗`,
    ``,
    `— Gari`,
  ].join('\n');
}

export function msg_extensionHostNotif(
  hostName: string,
  renterName: string,
  carName: string,
  hoursAdded: number,
  newReturnDate: Date
): string {
  const newTime = format(newReturnDate, "h:mm a, EEE d MMM");
  return [
    `Hi ${hostName}, *${renterName}* has extended their booking for your *${carName}*.`,
    ``,
    `Extended by: *${hoursAdded} hour${hoursAdded > 1 ? 's' : ''}*`,
    `New return time: *${newTime}*`,
    ``,
    `The extension fee has been collected automatically.`,
    ``,
    `— Gari`,
  ].join('\n');
}

// ── On-my-way notification ────────────────────────────────────────────────────

export function msg_host_onMyWay(
  hostName: string,
  renterName: string,
  carName: string,
  message?: string | null
): string {
  return [
    `Hi ${hostName}, *${renterName}* has confirmed they are on their way back with your *${carName}*.`,
    message ? `\nMessage: "${message}"` : '',
    ``,
    `Expected arrival soon. Late fees will stop accruing upon return.`,
    ``,
    `— Gari`,
  ].filter(Boolean).join('\n');
}
