export interface MoMoPaymentParams {
  phoneNumber: string; // format: 2507XXXXXXXX
  amount: number;      // RWF
  bookingId: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function initiateMoMoPayment(params: MoMoPaymentParams): Promise<PaymentResult> {
  // In development: simulate a 2 second delay and return success
  if (process.env.NODE_ENV !== 'production') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.05; // 95% success rate in dev
    if (success) {
      return {
        success: true,
        transactionId: `MOMO-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      };
    }
    return { success: false, error: 'Simulated payment failure. Please retry.' };
  }

  // Production: integrate with MTN Rwanda MoMo API
  // Docs: https://momodeveloper.mtn.com
  // TODO: Replace with real MTN MoMo API integration
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;

  if (!apiKey || !subscriptionKey) {
    return { success: false, error: 'MTN MoMo is not configured.' };
  }

  try {
    // Real implementation would:
    // 1. Request an access token from MTN MoMo auth endpoint
    // 2. Create a payment request with the token
    // 3. Poll for payment status or use a webhook
    throw new Error('MTN MoMo production integration not yet implemented.');
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'MTN MoMo payment failed.',
    };
  }
}

export function formatMoMoPhone(phone: string): string {
  // Strip spaces, hyphens, plus sign
  let cleaned = phone.replace(/[\s\-+]/g, '');
  // If starts with 0, replace with country code 250
  if (cleaned.startsWith('0')) cleaned = '250' + cleaned.slice(1);
  // If starts with 7, assume Rwanda
  if (cleaned.startsWith('7')) cleaned = '250' + cleaned;
  return cleaned;
}
