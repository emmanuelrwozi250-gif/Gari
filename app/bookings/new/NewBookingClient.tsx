'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Car, Calendar, MapPin, ChevronLeft, Shield, BadgeCheck,
  Clock, ArrowRight, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';

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
  const [submitting, setSubmitting] = useState(false);
  const [idpAcknowledged, setIdpAcknowledged] = useState(false);
  // IDP gate: required for foreign self-drive renters
  const needsIdpGate = renterType === 'FOREIGN' && !params.withDriver;
  const district = RWANDA_DISTRICTS.find(d => d.id === car.district);
  const grandTotal = params.totalAmount + params.depositAmount;

  function fmt(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-RW', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create booking');
      router.push(`/bookings/${json.id}/pay?method=${params.paymentMethod}&amount=${grandTotal}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create booking');
      setSubmitting(false);
    }
  }

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
              <span>Service fee (10%)</span>
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
                  Rwanda law requires foreign nationals driving without a Rwandan driver renting without a driver to carry a valid IDP alongside their national/home driving licence.{' '}
                  <Link href="/international#driving" className="underline font-medium">Learn more →</Link>
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idpAcknowledged}
                    onChange={e => setIdpAcknowledged(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer flex-shrink-0"
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
          disabled={submitting || (needsIdpGate && !idpAcknowledged)}
          className="btn-primary w-full justify-center py-4 text-base font-bold disabled:opacity-60"
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />Creating booking…</>
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
