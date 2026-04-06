'use client';

import { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { formatRWF } from '@/lib/utils';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Inner form — must be inside <Elements>
function InnerForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [prAvailable, setPrAvailable] = useState(false);

  // Set up Apple Pay / Google Pay
  useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: 'RW',
      currency: 'rwf',
      total: { label: 'Gari Car Rental', amount },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setPrAvailable(true);
      }
    });
    pr.on('paymentmethod', async (e) => {
      const { error } = await stripe.confirmPayment({
        elements: elements!,
        redirect: 'if_required',
      });
      if (error) {
        e.complete('fail');
        toast.error(error.message || 'Payment failed');
      } else {
        e.complete('success');
        onSuccess();
      }
    });
  }, [stripe, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
      } else {
        toast.success('Payment successful!');
        onSuccess();
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-text-primary dark:text-white">Pay by Card</h2>
        <div className="ml-auto flex items-center gap-1 text-xs text-text-light">
          <Lock className="w-3 h-3" /> Secured by Stripe
        </div>
      </div>

      {/* Apple Pay / Google Pay button */}
      {prAvailable && paymentRequest && (
        <div className="space-y-3">
          <PaymentRequestButtonElement
            options={{ paymentRequest, style: { paymentRequestButton: { theme: 'dark', height: '48px' } } }}
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-light">or pay with card</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      )}

      {/* Stripe Elements — card, wallet, etc. */}
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      <button
        type="submit"
        disabled={paying || !stripe}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {paying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          `Pay ${formatRWF(amount)} securely`
        )}
      </button>

      <p className="text-xs text-center text-text-light">
        Accepted: Visa, Mastercard, Apple Pay, Google Pay
      </p>
    </form>
  );
}

interface StripePaymentFormProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
}

export function StripePaymentForm({ bookingId, amount, onSuccess }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error || 'Failed to initialize payment');
      })
      .catch(() => setError('Failed to connect to payment service'));
  }, [bookingId]);

  if (error) {
    return (
      <div className="card p-6 text-center text-red-500">
        <p className="font-medium">{error}</p>
        <p className="text-sm text-text-secondary mt-1">Please try again or choose a different payment method.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="card p-6 flex items-center justify-center gap-3 text-text-secondary">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Initializing secure payment...
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#1a7a4a',
            colorBackground: '#ffffff',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
        },
      }}
    >
      <InnerForm amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}
