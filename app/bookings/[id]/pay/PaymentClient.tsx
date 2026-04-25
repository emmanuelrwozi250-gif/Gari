'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Phone, CreditCard, CheckCircle,
  Loader2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';

type Method = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';

interface Props {
  bookingId: string;
  method: Method;
  totalDue: number;
  carLabel: string;
}

type Stage = 'form' | 'processing' | 'success' | 'error';

const METHOD_CONFIG = {
  MTN_MOMO: {
    label: 'MTN Mobile Money',
    color: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    prompt: 'MTN MoMo number',
    placeholder: '07XX XXX XXX',
    prefix: '🟡',
  },
  AIRTEL_MONEY: {
    label: 'Airtel Money',
    color: 'bg-red-500',
    textColor: 'text-white',
    prompt: 'Airtel Money number',
    placeholder: '073X XXX XXX',
    prefix: '🔴',
  },
  CARD: {
    label: 'Visa / Mastercard',
    color: 'bg-gray-800',
    textColor: 'text-white',
    prompt: 'Card number',
    placeholder: '1234 5678 9012 3456',
    prefix: '💳',
  },
};

function MoMoForm({
  method, amount, onSubmit,
}: { method: 'MTN_MOMO' | 'AIRTEL_MONEY'; amount: number; onSubmit: (phone: string) => void }) {
  const cfg = METHOD_CONFIG[method];
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\s/g, '').length >= 9;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-text-secondary uppercase tracking-wide block mb-2">
          <Phone className="w-3.5 h-3.5 inline mr-1" />{cfg.prompt}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder={cfg.placeholder}
          className="input text-lg tracking-widest w-full"
          autoFocus
        />
        <p className="text-xs text-text-light mt-1">Enter the number registered to your {cfg.label} account</p>
      </div>

      <button
        onClick={() => valid && onSubmit(phone)}
        disabled={!valid}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${method === 'MTN_MOMO' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' : 'bg-red-500 text-white hover:bg-red-600'}`}
      >
        Pay {formatRWF(amount)}
      </button>
    </div>
  );
}

function CardForm({ amount, onSubmit }: { amount: number; onSubmit: () => void }) {
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const valid = card.replace(/\s/g, '').length >= 16 && expiry.length >= 5 && cvv.length >= 3 && name.length >= 2;

  function fmtCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Name on card</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="JEAN-PAUL GASANA" className="input w-full" />
      </div>
      <div>
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Card number</label>
        <input value={card} onChange={e => setCard(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" className="input tracking-widest w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">Expiry</label>
          <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" className="input w-full" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">CVV</label>
          <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" className="input w-full" type="password" />
        </div>
      </div>
      <button
        onClick={() => valid && onSubmit()}
        disabled={!valid}
        className="w-full py-4 rounded-xl font-bold text-base bg-gray-800 text-white hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Pay {formatRWF(amount)}
      </button>
    </div>
  );
}

function ProcessingScreen({ method, phone }: { method: Method; phone: string }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const isMoMo = method !== 'CARD';

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      {isMoMo ? (
        <>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Check your phone</h2>
          <p className="text-text-secondary mb-2">
            A payment prompt has been sent to <span className="font-semibold">{phone}</span>
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Enter your {method === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} PIN to confirm payment.
          </p>
          <div className="bg-gray-bg dark:bg-gray-800 rounded-xl p-4 inline-block">
            <div className="text-3xl font-bold text-primary tabular-nums">{seconds}s</div>
            <div className="text-xs text-text-light">Time remaining</div>
          </div>
          <p className="text-xs text-text-light mt-4">
            Didn&apos;t receive a prompt?{' '}
            <button className="text-primary hover:underline">Resend</button>
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Processing payment…</h2>
          <p className="text-text-secondary">Please wait while we securely process your card.</p>
        </>
      )}
    </div>
  );
}

function SuccessScreen({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push(`/bookings/${bookingId}/confirmed`), 2000);
    return () => clearTimeout(t);
  }, [bookingId, router]);

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-primary mb-2">Payment Confirmed!</h2>
      <p className="text-text-secondary">Redirecting to your booking confirmation…</p>
      <Loader2 className="w-5 h-5 text-text-light animate-spin mx-auto mt-4" />
    </div>
  );
}

export function PaymentClient({ bookingId, method, totalDue, carLabel }: Props) {
  const [stage, setStage] = useState<Stage>('form');
  const [activeMethod, setActiveMethod] = useState<Method>(method);
  const [phone, setPhone] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function markPaid() {
    try {
      await fetch(`/api/bookings/${bookingId}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' }),
      });
    } catch {
      // Non-critical — booking is created, payment will be reconciled
    }
  }

  function startPayment(ph = '') {
    setPhone(ph);
    setStage('processing');
    // Simulate 4-second payment processing then success
    timerRef.current = setTimeout(async () => {
      await markPaid();
      setStage('success');
    }, 4000);
  }

  const cfg = METHOD_CONFIG[activeMethod];
  const methods: Method[] = ['MTN_MOMO', 'AIRTEL_MONEY', 'CARD'];

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Back */}
        {stage === 'form' && (
          <Link href={`/bookings/${bookingId}`}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        )}

        {stage === 'form' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-1">Pay for your booking</h1>
              <p className="text-text-secondary text-sm">{carLabel}</p>
            </div>

            {/* Amount banner */}
            <div className="bg-primary text-white rounded-2xl p-5 text-center mb-6">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Total due</div>
              <div className="text-4xl font-extrabold">{formatRWF(totalDue)}</div>
            </div>

            {/* Method switcher */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {methods.map(m => {
                const c = METHOD_CONFIG[m];
                return (
                  <button
                    key={m}
                    onClick={() => setActiveMethod(m)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      activeMethod === m
                        ? `${c.color} ${c.textColor} border-transparent shadow`
                        : 'bg-transparent border-border text-text-secondary hover:border-primary/40'
                    }`}
                  >
                    {c.prefix} {m === 'MTN_MOMO' ? 'MTN' : m === 'AIRTEL_MONEY' ? 'Airtel' : 'Card'}
                  </button>
                );
              })}
            </div>

            {/* Active payment form */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                {activeMethod === 'CARD' ? (
                  <CreditCard className="w-5 h-5 text-primary" />
                ) : (
                  <Phone className="w-5 h-5 text-primary" />
                )}
                <span className="font-bold text-text-primary dark:text-white">{cfg.label}</span>
              </div>

              {activeMethod !== 'CARD' ? (
                <MoMoForm method={activeMethod} amount={totalDue} onSubmit={startPayment} />
              ) : (
                <CardForm amount={totalDue} onSubmit={() => startPayment('')} />
              )}
            </div>

            <div className="flex items-start gap-2 mt-5 text-xs text-text-light">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                This is a simulated payment for demo purposes. No real money will be charged.
                Full MoMo integration is enabled in production.
              </span>
            </div>
          </>
        )}

        {stage === 'processing' && (
          <ProcessingScreen method={activeMethod} phone={phone} />
        )}

        {stage === 'success' && (
          <SuccessScreen bookingId={bookingId} />
        )}

        {stage === 'error' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Payment failed</h2>
            <p className="text-text-secondary mb-6">Please try again or choose a different payment method.</p>
            <button
              onClick={() => { setStage('form'); toast.error('Payment failed — please try again'); }}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
