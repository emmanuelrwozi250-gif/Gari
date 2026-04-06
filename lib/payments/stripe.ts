import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
});

export async function createPaymentIntent(amount: number, bookingId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents; RWF has no subunits, so multiply by 100
    currency: 'rwf',
    metadata: { bookingId },
    automatic_payment_methods: { enabled: true },
  });
}
