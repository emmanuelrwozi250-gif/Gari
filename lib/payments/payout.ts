/**
 * lib/payments/payout.ts
 * Host payout via MTN MoMo Disbursement API v1.
 *
 * Called after a trip is marked returned safely (return-safe route).
 * Calculates host earnings = totalAmount − vatAmount − platformFee, then
 * transfers via MoMo disbursement to the host's registered phone.
 *
 * Env vars required (separate from Collection):
 *   MTN_MOMO_SUBSCRIPTION_KEY     - from developer.mtn.com app
 *   MTN_MOMO_DISBURSEMENT_KEY     - optional separate subscription key for disbursements
 *   MTN_MOMO_API_USER             - UUID created via provisioning API
 *   MTN_MOMO_API_KEY              - API key for the API user
 *   MTN_MOMO_ENVIRONMENT          - "sandbox" | "production"
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getMoMoToken } from '@/lib/payments/momo';

function getDisbursementBaseUrl(): string {
  return process.env.MTN_MOMO_ENVIRONMENT === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com';
}

/**
 * Process host payout for a completed booking.
 * - Calculates host earnings after platform fee and VAT deduction
 * - Sends MTN MoMo disbursement to host's phone
 * - Updates booking with payout status, reference, and amount
 *
 * Non-blocking — call with void and .catch() from return-safe route.
 */
export async function processHostPayout(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      totalAmount: true,
      vatAmount: true,
      platformFee: true,
      payoutStatus: true,
      car: {
        select: {
          hostId: true,
          make: true,
          model: true,
          host: {
            select: {
              id: true,
              name: true,
              phone: true,
              whatsappNumber: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    console.error(`[payout] Booking not found: ${bookingId}`);
    return;
  }

  // Idempotency — skip if already paid out
  if (booking.payoutStatus === 'PROCESSED') {
    console.log(`[payout] Already processed for booking ${bookingId}`);
    return;
  }

  const hostPhone = booking.car.host.whatsappNumber ?? booking.car.host.phone;
  if (!hostPhone) {
    console.warn(`[payout] No phone registered for host ${booking.car.host.id} — booking ${bookingId}. Payout must be processed manually.`);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { payoutStatus: 'FAILED' },
    });
    return;
  }

  // Host earnings = total − VAT (held for RRA) − platform fee (held by Gari)
  const hostEarnings = booking.totalAmount - (booking.vatAmount ?? 0) - booking.platformFee;

  if (hostEarnings <= 0) {
    console.warn(`[payout] Calculated hostEarnings ≤ 0 for booking ${bookingId}. Skipping.`);
    return;
  }

  // Mark as PENDING before attempting
  await prisma.booking.update({
    where: { id: bookingId },
    data: { payoutStatus: 'PENDING', hostEarnings },
  });

  const subscriptionKey =
    process.env.MTN_MOMO_DISBURSEMENT_KEY ??
    process.env.MTN_MOMO_SUBSCRIPTION_KEY;

  if (!subscriptionKey) {
    // Dev mode — log and simulate
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[payout] DEV: simulating disbursement of RWF ${hostEarnings} to ${hostPhone} for booking ${bookingId}`);
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          payoutStatus: 'PROCESSED',
          payoutReference: `SIM-PAYOUT-${Date.now()}`,
          payoutAt: new Date(),
          hostEarnings,
        },
      });
      return;
    }
    console.error('[payout] MTN MoMo subscription key not configured for production payout');
    await prisma.booking.update({ where: { id: bookingId }, data: { payoutStatus: 'FAILED' } });
    return;
  }

  try {
    const token = await getMoMoToken();
    const transferId = randomUUID();
    const environment = process.env.MTN_MOMO_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

    // Normalise phone number (strip non-digits, handle 0 prefix)
    let phone = hostPhone.replace(/[\s\-+() ]/g, '');
    if (phone.startsWith('0')) phone = '250' + phone.slice(1);
    if (phone.startsWith('7') || phone.startsWith('8')) phone = '250' + phone;

    const res = await fetch(`${getDisbursementBaseUrl()}/disbursement/v1_0/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Reference-Id': transferId,
        'X-Target-Environment': environment,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(hostEarnings),
        currency: 'RWF',
        externalId: bookingId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: phone,
        },
        payerMessage: `Gari payout for booking ${bookingId.slice(-6).toUpperCase()}`,
        payeeNote: `Earnings for ${booking.car.make} ${booking.car.model} rental`,
      }),
    });

    if (res.status !== 202) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`MoMo disbursement failed (${res.status}): ${text}`);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        payoutStatus: 'PROCESSED',
        payoutReference: transferId,
        payoutAt: new Date(),
        hostEarnings,
      },
    });

    console.log(`[payout] Disbursed RWF ${hostEarnings} to host ${booking.car.host.id} (booking ${bookingId})`);
  } catch (err) {
    console.error(`[payout] Disbursement failed for booking ${bookingId}:`, err);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { payoutStatus: 'FAILED' },
    });
    // Re-throw so the caller can log the full error chain
    throw err;
  }
}
