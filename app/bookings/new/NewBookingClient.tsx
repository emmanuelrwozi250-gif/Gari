'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Car, Calendar, MapPin, ChevronLeft, Shield, BadgeCheck,
  Clock, ArrowRight, Globe, CheckCircle, AlertTriangle, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { trackEvent } from '@/lib/track';

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

const PAYMENT_LABELS: Record<string, string> = {
  MTN_MOMO: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
  CARD: 'Visa / Mastercard',
};

const CANCELLATION_POLICY = [
  'Free cancellation up to 24 hours before pickup',
  '50% refund if cancelled within 24 hours of pickup',
  'No refund for no-shows or cancellations after trip starts',
];

type CheckoutStep = 'idle' | 'creating' | 'initiating' | 'polling' | 'success' | 'failed' | 'timeout';

interface CarSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  photos: string[];
  district: string;
  pricePerDay: number;
  driverPricePerDay: number | null;
  instantBooking: boolean;
  host: { id: string; name: string | null; } | null;
}

interface BookingParams {
  pickupDate: string;
  returnDate: string;
  withDriver: boolean;
  pickupLocation: string;
  totalDays: number;
  subtotal: number;
  platformFee: number;
  driverFee: number;
  totalAmount: number;
  depositAmount: number;
  paymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
}

interface Props {
  car: CarSummary;
  userId: string;
  userName: string;
  userEmail: string;
  renterType?: 'LOCAL' | 'FOREIGN';
  params: BookingParams;
}

export function NewBookingClient({ car, userName, renterType = 'LOCAL', params }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [idpAcknowledged, setIdpAcknowledged] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Payment flow state machine
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('idle');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const needsIdpGate = renterType === 'FOREIGN' && !params.withDriver;
  const isMoMo = params.paymentMethod === 'MTN_MOMO' || params.paymentMethod === 'AIRTEL_MONEY';
  const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
  const grandTotal = params.totalAmount + params.depositAmount;
  const isSubmitting = checkoutStep === 'creating' || checkoutStep === 'initiating';

  function fmt(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-RW', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
  }, []);

  // Polling effect — only active when step is 'polling'
  useEffect(() => {
    if (checkoutStep !== 'polling' || !bookingId) return;

    let cancelled = false;

    // Progress bar: 1% every 1.2s = 100% over 120s
    progressIntervalRef.current = setInterval(() => {
      if (!cancelled) setPollProgress(p => Math.min(p + 1, 99));
    }, 1200);

    // Poll status every 5s
    pollIntervalRef.current = setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/payments/status?bookingId=${bookingId}`);
        const data = await res.json();
        if (data.status === 'SUCCESSFUL') {
          clearPolling();
          if (!cancelled) {
            setPollProgress(100);
            setCheckoutStep('success');
            setTimeout(() => {
              if (!cancelled) router.push(`/bookings/${bookingId}/confirmed`);
            }, 1500);
          }
        } else if (data.status === 'FAILED') {
          clearPolling();
          if (!cancelled) {
            setPaymentError(data.reason ?? 'Payment was declined or cancelled');
            setCheckoutStep('failed');
          }
        }
        // PENDING → keep polling
      } catch {
        // transient network error — keep polling
      }
    }, 5000);

    // 2-minute hard timeout
    pollTimeoutRef.current = setTimeout(() => {
      if (!cancelled) {
        clearPolling();
        setCheckoutStep('timeout');
      }
    }, 120_000);

    return () => {
      cancelled = true;
      clearPolling();
    };
  }, [checkoutStep, bookingId, router, clearPolling]);

  async function handleConfirm() {
    if (isMoMo && !phoneNumber.trim()) {
      toast.error('Please enter your MTN MoMo / Airtel Money phone number');
      return;
    }
    if (needsIdpGate && !idpAcknowledged) {
      toast.error('Please confirm you hold a valid IDP before continuing');
      return;
    }

    setCheckoutStep('creating');

    try {
      // Step 1 — Create the booking record
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          pickupDate: params.pickupDate,
          returnDate: params.returnDate,
          withDriver: params.withDriver,
          pickupLocation: params.pickupLocation,
          totalDays: params.totalDays,
          subtotal: params.subtotal,
          platformFee: params.platformFee,
          driverFee: params.driverFee,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod,
          idpAcknowledged: needsIdpGate ? idpAcknowledged : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const bookingJson = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingJson.error ?? 'Failed to create booking');

      const newBookingId = bookingJson.id as string;
      setBookingId(newBookingId);

      trackEvent({
        eventType: 'booking_start',
        carId: car.id,
        metadata: { bookingId: newBookingId },
      });

      if (isMoMo) {
        // Step 2 — Trigger MoMo requesttopay
        setCheckoutStep('initiating');
        const payRes = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: newBookingId, phoneNumber: phoneNumber.trim() }),
        });
        const payJson = await payRes.json();
        if (!payRes.ok) throw new Error(payJson.error ?? 'Failed to initiate payment');

        // Step 3 — Start polling (useEffect picks this up)
        setPollProgress(0);
        setCheckoutStep('polling');
      } else {
        // Card payment → redirect to legacy pay page
        router.push(`/bookings/${newBookingId}/pay?method=${params.paymentMethod}&amount=${grandTotal}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setCheckoutStep('idle');
    }
  }

  function handleRetry() {
    setCheckoutStep('idle');
    setPaymentError(null);
    setPollProgress(0);
    // bookingId is kept — the initiate route is idempotent so we can re-use it
  }

  function handleCancelPolling() {
    clearPolling();
    setCheckoutStep('idle');
    setPollProgress(0);
  }

  // ── Payment status screen ─────────────────────────────────────────────────
  if (checkoutStep === 'polling' || checkoutStep === 'success' || checkoutStep === 'failed' || checkoutStep === 'timeout') {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          <div className="card p-8 text-center">

            {/* ── Success ──────────────────────────────── */}
            {checkoutStep === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Payment Confirmed!</h2>
                <p className="text-sm text-text-secondary mb-5">
                  Your booking is confirmed. Taking you to your trip details…
                </p>
                <div className="w-full bg-green-100 dark:bg-green-900/20 rounded-full h-1.5">
                  <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </>
            )}

            {/* ── Polling ──────────────────────────────── */}
            {checkoutStep === 'polling' && (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">
                  Approve on your phone
                </h2>
                <p className="text-sm text-text-secondary mb-1">
                  A payment request for{' '}
                  <span className="font-semibold text-text-primary dark:text-white">{formatRWF(grandTotal)}</span>{' '}
                  has been sent to
                </p>
                <p className="text-base font-bold text-primary mb-5">{phoneNumber}</p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-5 text-left">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">How to approve:</p>
                  <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Open your MTN MoMo or Airtel Money app</li>
                    <li>Find the pending request from <strong>Gari</strong></li>
                    <li>Enter your PIN to approve</li>
                  </ol>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1.5">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${pollProgress}%` }}
                  />
                </div>
                <p className="text-xs text-text-light mb-6">
                  Waiting for approval… expires in 2 minutes
                </p>

                <button
                  onClick={handleCancelPolling}
                  className="text-sm text-text-secondary hover:text-primary transition-colors underline"
                >
                  Cancel payment
                </button>
              </>
            )}

            {/* ── Failed ───────────────────────────────── */}
            {checkoutStep === 'failed' && (
              <>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-9 h-9 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Payment Failed</h2>
                <p className="text-sm text-text-secondary mb-2">
                  {paymentError ?? 'Your payment was declined or cancelled.'}
                </p>
                <p className="text-xs text-text-light mb-6">
                  Your booking is reserved — you can try again without losing your spot.
                </p>
                <button onClick={handleRetry} className="btn-primary w-full justify-center">
                  Try Again
                </button>
              </>
            )}

            {/* ── Timeout ──────────────────────────────── */}
            {checkoutStep === 'timeout' && (
              <>
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-9 h-9 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">Request Expired</h2>
                <p className="text-sm text-text-secondary mb-6">
                  The payment request timed out after 2 minutes. Please try again.
                </p>
                <button onClick={handleRetry} className="btn-primary w-full justify-center">
                  Try Again
                </button>
              </>
            )}
          </div>

          {/* Booking reference */}
          {bookingId && (
            <p className="text-center text-xs text-text-light mt-3">
              Booking ref:{' '}
              <span className="font-mono font-semibold">{bookingId.slice(-8).toUpperCase()}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Main booking form (idle / creating / initiating) ─────────────────────
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href={`/cars/${car.id}`}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to listing
        </Link>

        <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-6">
          Confirm Your Booking
        </h1>

        {/* Car summary card */}
        <div className="card p-4 mb-5 flex gap-4">
          <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src={car.photos[0] ?? FALLBACK}
              alt={`${car.make} ${car.model}`}
              fill className="object-cover"
              sizes="96px"
              onError={(e) => { e.currentTarget.src = FALLBACK; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-text-primary dark:text-white">
              {car.year} {car.make} {car.model}
            </h2>
            <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
              <MapPin className="w-3 h-3" />
              {district?.name ?? car.district}
            </div>
            {car.host && (
              <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                <BadgeCheck className="w-3 h-3 text-primary" />
                Hosted by {car.host.name ?? 'Verified Host'}
              </div>
            )}
            {car.instantBooking && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                ⚡ Instant booking
              </span>
            )}
          </div>
        </div>

        {/* Trip dates */}
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-text-primary dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Trip Dates
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-bg dark:bg-gray-800 rounded-xl p-3">
              <div className="text-xs text-text-light uppercase tracking-wide font-semibold mb-1">Pick-up</div>
              <div className="text-sm font-semibold text-text-primary dark:text-white">{fmt(params.pickupDate)}</div>
            </div>
            <div className="bg-gray-bg dark:bg-gray-800 rounded-xl p-3">
              <div className="text-xs text-text-light uppercase tracking-wide font-semibold mb-1">Return</div>
              <div className="text-sm font-semibold text-text-primary dark:text-white">{fmt(params.returnDate)}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {params.totalDays} day{params.totalDays !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {params.pickupLocation}
            </span>
            {params.withDriver && (
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-primary" />
                With professional driver
              </span>
            )}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-text-primary dark:text-white mb-4">Price Breakdown</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>{formatRWF(car.pricePerDay)} × {params.totalDays} day{params.totalDays !== 1 ? 's' : ''}</span>
              <span>{formatRWF(params.subtotal)}</span>
            </div>
            {params.driverFee > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Driver fee ({params.totalDays} day{params.totalDays !== 1 ? 's' : ''})</span>
                <span>{formatRWF(params.driverFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Service fee (12%)</span>
              <span>{formatRWF(params.platformFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-border pt-2.5 mt-1">
              <span>{params.depositAmount > 0 ? 'Rental total' : 'Total'}</span>
              <span className="text-primary">{formatRWF(params.totalAmount)}</span>
            </div>
            {params.depositAmount > 0 && (
              <>
                <div className="flex justify-between text-text-secondary text-xs">
                  <span>Security deposit <span className="text-green-600 font-medium">(refundable within 48h)</span></span>
                  <span>{formatRWF(params.depositAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-border pt-2 mt-1">
                  <span>Total due today</span>
                  <span className="text-primary">{formatRWF(grandTotal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs text-text-light pt-1">
              <span>Payment method</span>
              <span className="font-medium">{PAYMENT_LABELS[params.paymentMethod] ?? params.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Renter info */}
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-text-primary dark:text-white mb-3">Booking for</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {(userName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-text-primary dark:text-white text-sm">{userName || 'You'}</div>
              <div className="text-xs text-text-secondary">NIDA-verified renter</div>
            </div>
          </div>
        </div>

        {/* MoMo phone number input — only shown for mobile money payments */}
        {isMoMo && (
          <div className="card p-5 mb-5">
            <h3 className="font-bold text-text-primary dark:text-white mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              {PAYMENT_LABELS[params.paymentMethod]} Number
            </h3>
            <p className="text-xs text-text-secondary mb-3">
              Enter the phone number that will receive the payment request.
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0788 000 000"
              className="input w-full text-sm"
              disabled={isSubmitting}
            />
            <p className="text-xs text-text-light mt-1.5">
              You&apos;ll receive a push notification to approve RWF {grandTotal.toLocaleString()} on your phone.
            </p>
          </div>
        )}

        {/* Message to host */}
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-text-primary dark:text-white mb-1">
            Message to host <span className="text-text-light font-normal text-sm">(optional)</span>
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            Tell the host why you&apos;re renting, or any special requests (e.g. child seat, extra km).
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Hi, I'll be using the car for a family trip to Musanze…"
            className="input text-sm resize-none w-full"
            disabled={isSubmitting}
          />
          <div className="text-right text-xs text-text-light mt-1">{notes.length}/500</div>
        </div>

        {/* Cancellation policy */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">Cancellation policy</span>
          </div>
          <ul className="space-y-1">
            {CANCELLATION_POLICY.map(p => (
              <li key={p} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <span className="mt-0.5">•</span> {p}
              </li>
            ))}
          </ul>
        </div>

        {/* IDP gate — mandatory for foreign self-drive renters */}
        {needsIdpGate && (
          <div className="rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">
                  International Driving Permit (IDP) required
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Rwanda law requires foreign nationals driving without a Rwandan driver to carry a valid IDP alongside their national driving licence.{' '}
                  <Link href="/international#driving" className="underline font-medium">Learn more →</Link>
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idpAcknowledged}
                    onChange={e => setIdpAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer flex-shrink-0"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    I confirm I hold a valid IDP (or will obtain one before pickup) and understand I may be turned away without it.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || (needsIdpGate && !idpAcknowledged)}
          className="btn-primary w-full justify-center py-4 text-base font-bold disabled:opacity-60"
        >
          {checkoutStep === 'creating' ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />Creating your booking…</>
          ) : checkoutStep === 'initiating' ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />Connecting to {PAYMENT_LABELS[params.paymentMethod]}…</>
          ) : (
            <>Confirm & Pay {formatRWF(grandTotal)} <ArrowRight className="w-4 h-4 ml-1" /></>
          )}
        </button>

        <p className="text-center text-xs text-text-light mt-3">
          By confirming you agree to Gari&apos;s{' '}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
