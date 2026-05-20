/**
 * lib/payments/momo.ts
 * MTN MoMo Collection API v1 — real async payment integration.
 *
 * Flow:
 *   1. getMoMoToken()      → bearer token (cached ~55 min)
 *   2. requestPayment()    → POST requesttopay, returns { requestId }
 *   3. getPaymentStatus()  → GET requesttopay/{id}, returns PENDING|SUCCESSFUL|FAILED
 *   4. refundPayment()     → POST refund (for cancellations/returns)
 *
 * Env vars required:
 *   MTN_MOMO_SUBSCRIPTION_KEY   - from developer.mtn.com app
 *   MTN_MOMO_API_USER            - UUID created via provisioning API
 *   MTN_MOMO_API_KEY             - API key for the API user
 *   MTN_MOMO_ENVIRONMENT         - "sandbox" | "production"
 *   MTN_MOMO_CALLBACK_URL        - https://gari-africa.com/api/webhooks/momo
 */

import { randomUUID } from 'crypto';

// ── Base URL ─────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return process.env.MTN_MOMO_ENVIRONMENT === 'production'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com';
}

function getEnv(): { subscriptionKey: string; apiUser: string; apiKey: string } {
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  if (!subscriptionKey || !apiUser || !apiKey) {
    throw new Error('MTN MoMo env vars not configured (MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER, MTN_MOMO_API_KEY)');
  }
  return { subscriptionKey, apiUser, apiKey };
}

// ── Token cache (in-memory, refreshes 5 min before expiry) ───────────────────

let _tokenCache: { token: string; expiresAt: number } | null = null;

export async function getMoMoToken(): Promise<string> {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return _tokenCache.token;
  }

  const { subscriptionKey, apiUser, apiKey } = getEnv();
  const basicAuth = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

  const res = await fetch(`${getBaseUrl()}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MoMo token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const expiresIn: number = data.expires_in ?? 3600; // seconds
  _tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };
  return _tokenCache.token;
}

// ── Request to Pay ────────────────────────────────────────────────────────────

export interface MoMoPaymentParams {
  phoneNumber: string;  // E.164 without +, e.g. "2507XXXXXXXX"
  amount: number;       // RWF integer
  bookingId: string;    // used as externalId for webhook correlation
  description: string;
}

export interface RequestPaymentResult {
  requestId: string;   // the X-Reference-Id UUID to poll with
}

export async function requestPayment(params: MoMoPaymentParams): Promise<RequestPaymentResult> {
  const { subscriptionKey } = getEnv();
  const token = await getMoMoToken();
  const requestId = randomUUID();
  const environment = process.env.MTN_MOMO_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  const callbackUrl = process.env.MTN_MOMO_CALLBACK_URL;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'X-Reference-Id': requestId,
    'X-Target-Environment': environment,
    'Content-Type': 'application/json',
  };
  if (callbackUrl) headers['X-Callback-Url'] = callbackUrl;

  const body = {
    amount: String(params.amount),
    currency: 'RWF',
    externalId: params.bookingId,
    payer: {
      partyIdType: 'MSISDN',
      partyId: params.phoneNumber,
    },
    payerMessage: params.description,
    payeeNote: `Gari booking ${params.bookingId.slice(-6).toUpperCase()}`,
  };

  const res = await fetch(`${getBaseUrl()}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (res.status !== 202) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MoMo requesttopay failed (${res.status}): ${text}`);
  }

  return { requestId };
}

// ── Get Payment Status ────────────────────────────────────────────────────────

export type MoMoStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface PaymentStatusResult {
  status: MoMoStatus;
  financialTransactionId?: string;  // MoMo internal ID (present when SUCCESSFUL)
  reason?: string;                  // failure reason (present when FAILED)
}

export async function getPaymentStatus(requestId: string): Promise<PaymentStatusResult> {
  const { subscriptionKey } = getEnv();
  const token = await getMoMoToken();
  const environment = process.env.MTN_MOMO_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  const res = await fetch(`${getBaseUrl()}/collection/v1_0/requesttopay/${requestId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'X-Target-Environment': environment,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MoMo status check failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const status: MoMoStatus =
    data.status === 'SUCCESSFUL' ? 'SUCCESSFUL' :
    data.status === 'FAILED' ? 'FAILED' : 'PENDING';

  return {
    status,
    financialTransactionId: data.financialTransactionId,
    reason: data.reason,
  };
}

// ── Refund ────────────────────────────────────────────────────────────────────

export async function refundPayment(params: {
  referenceIdToRefund: string;  // financialTransactionId from SUCCESSFUL status
  amount: number;
  bookingId: string;
  reason: string;
}): Promise<void> {
  const { subscriptionKey } = getEnv();
  const token = await getMoMoToken();
  const environment = process.env.MTN_MOMO_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  const refundReferenceId = randomUUID();

  const res = await fetch(`${getBaseUrl()}/collection/v1_0/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'X-Reference-Id': refundReferenceId,
      'X-Target-Environment': environment,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: 'RWF',
      externalId: params.bookingId,
      payerMessage: params.reason,
      payeeNote: `Gari refund for booking ${params.bookingId.slice(-6).toUpperCase()}`,
      referenceIdToRefund: params.referenceIdToRefund,
    }),
  });

  if (res.status !== 202) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MoMo refund failed (${res.status}): ${text}`);
  }
}

// ── Phone formatting utility ──────────────────────────────────────────────────

export function formatMoMoPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-+() ]/g, '');
  if (cleaned.startsWith('0')) cleaned = '250' + cleaned.slice(1);
  if (cleaned.startsWith('7') || cleaned.startsWith('8')) cleaned = '250' + cleaned;
  return cleaned;
}

// ── Dev-mode simulation (when env vars not set) ───────────────────────────────
// The real functions above will throw if env vars are missing.
// For local dev without MoMo sandbox creds, use this wrapper:

export async function initiateMoMoPayment(params: MoMoPaymentParams): Promise<{
  success: boolean;
  requestId?: string;
  transactionId?: string;
  error?: string;
}> {
  // If MoMo is not configured, simulate in dev only
  if (!process.env.MTN_MOMO_SUBSCRIPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, error: 'MTN MoMo is not configured for production.' };
    }
    await new Promise(r => setTimeout(r, 1500));
    return {
      success: true,
      requestId: `sim-${randomUUID()}`,
      transactionId: `MOMO-SIM-${Date.now()}`,
    };
  }

  try {
    const { requestId } = await requestPayment(params);
    return { success: true, requestId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'MoMo payment request failed.',
    };
  }
}
