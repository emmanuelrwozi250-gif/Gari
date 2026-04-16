'use client';

import { useState } from 'react';
import { Heart, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const PRESET_AMOUNTS = [2000, 5000, 10000];

type TipStep = 'choose' | 'paying' | 'done';

interface TipWidgetProps {
  bookingId: string;
  hostName: string;
  paymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
  onSkip: () => void;
  onTipSent: () => void;
}

export function TipWidget({ bookingId, hostName, paymentMethod, onSkip, onTipSent }: TipWidgetProps) {
  const [step, setStep] = useState<TipStep>('choose');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const tipAmount = selectedAmount ?? (customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) : null);
  const isMobile = paymentMethod === 'MTN_MOMO' || paymentMethod === 'AIRTEL_MONEY';
  const methodLabel = paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Card';

  const handleSendTip = async () => {
    if (!tipAmount || tipAmount < 1000) {
      toast.error('Minimum tip is RWF 1,000');
      return;
    }
    if (isMobile && !phoneNumber) {
      toast.error(`Enter your ${methodLabel} phone number`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: tipAmount,
          paymentMethod,
          phoneNumber: phoneNumber || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to send tip');
        return;
      }

      // Card: show Stripe form
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep('paying');
        return;
      }

      // MoMo/Airtel: success immediately
      if (data.success) {
        setStep('done');
        toast.success(`Tip sent! ${hostName} will be notified.`);
        setTimeout(onTipSent, 1800);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = async () => {
    // Confirm tip amount in DB after Stripe payment
    await fetch('/api/payments/tip?action=confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount: tipAmount }),
    });
    setStep('done');
    toast.success(`Tip sent! ${hostName} will be notified.`);
    setTimeout(onTipSent, 1800);
  };

  if (step === 'done') {
    return (
      <div className="card p-5 text-center border-primary/20 bg-primary-light/10 mb-6">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
        <p className="font-bold text-text-primary dark:text-white">Tip sent! 🎉</p>
        <p className="text-sm text-text-secondary mt-1">{hostName} will be notified. Thank you for your generosity!</p>
      </div>
    );
  }

  if (step === 'paying' && clientSecret) {
    return (
      <div className="mb-6">
        <p className="text-sm font-medium text-text-secondary mb-3">
          Sending tip of <strong className="text-primary">{formatRWF(tipAmount!)}</strong> to {hostName}
        </p>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: { colorPrimary: '#1a7a4a', borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
            },
          }}
        >
          <TipStripeInner amount={tipAmount!} onSuccess={handleStripeSuccess} />
        </Elements>
        <button onClick={() => setStep('choose')} className="text-sm text-text-secondary hover:text-primary mt-3 transition-colors">
          ← Change amount
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5 border-primary/20 mb-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-text-primary dark:text-white">Leave a tip for {hostName}?</p>
          <p className="text-xs text-text-secondary mt-0.5">100% goes directly to your host — totally optional</p>
        </div>
      </div>

      {/* Preset amounts */}
      <div className="flex gap-2 mb-3">
        {PRESET_AMOUNTS.map(amt => (
          <button
            key={amt}
            onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              selectedAmount === amt
                ? 'bg-primary text-white border-primary'
                : 'border-border text-text-secondary hover:border-primary hover:text-primary'
            }`}
          >
            {formatRWF(amt)}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary font-medium">RWF</span>
          <input
            type="number"
            min={1000}
            max={100000}
            value={customAmount}
            onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            placeholder="Custom amount"
            className="input pl-12 text-sm"
          />
        </div>
        {tipAmount && tipAmount < 1000 && (
          <p className="text-xs text-red-500 mt-1">Minimum tip is RWF 1,000</p>
        )}
      </div>

      {/* Phone number for mobile money */}
      {isMobile && (
        <div className="mb-4">
          <label className="label text-xs">{methodLabel} number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-xl bg-gray-50 dark:bg-gray-800 text-text-secondary text-sm font-medium">
              +250
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="7XX XXX XXX"
              className="input rounded-l-none flex-1 text-sm"
            />
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSendTip}
          disabled={submitting || !tipAmount || tipAmount < 1000}
          className="flex-1 btn-primary py-2.5 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
          ) : (
            `Send${tipAmount && tipAmount >= 1000 ? ` ${formatRWF(tipAmount)}` : ''} tip`
          )}
        </button>
      </div>
    </div>
  );
}

// Inner Stripe form for tips — clientSecret already obtained, no extra fetch needed
function TipStripeInner({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const [paying, setPaying] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      const { error } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={paying || !stripe}
        className="btn-primary w-full justify-center py-3 text-sm"
      >
        {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ${formatRWF(amount)} tip`}
      </button>
    </form>
  );
}
