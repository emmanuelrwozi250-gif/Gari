export interface AirtelPaymentParams {
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

export async function initiateAirtelPayment(params: AirtelPaymentParams): Promise<PaymentResult> {
  // In development: simulate a 2 second delay and return success
  if (process.env.NODE_ENV !== 'production') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.05;
    if (success) {
      return {
        success: true,
        transactionId: `AIRTEL-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      };
    }
    return { success: false, error: 'Simulated payment failure. Please retry.' };
  }

  // Production: integrate with Airtel Africa API
  // Docs: https://developers.airtel.africa
  const clientId = process.env.AIRTEL_CLIENT_ID;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: 'Airtel Money is not configured.' };
  }

  try {
    throw new Error('Airtel Money production integration not yet implemented.');
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Airtel Money payment failed.',
    };
  }
}
