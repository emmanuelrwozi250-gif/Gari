'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatRWF, formatDate, getPaymentMethodLabel } from '@/lib/utils';
import {
  Car, Calendar, MapPin, CreditCard, CheckCircle,
  Phone, Loader2, Shield, ArrowLeft, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { StripePaymentForm } from '@/components/StripePaymentForm';
import { TipWidget } from '@/components/TipWidget';
import { FileText } from 'lucide-react';

type BookingStep = 'review' | 'payment' | 'confirmed';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80';

export default function BookingPage({ params }: { params: { carId: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<BookingStep>('review');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paying, setPaying] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);

  useEffect(() => {
    if (!bookingId) { router.push(`/cars/${params.carId}`); return; }
    fetch(`/api/bookings/${bookingId}`)
      .then(r => r.json())
      .then(data => { setBooking(data); setLoading(false); })
      .catch(() => { toast.error('Booking not found'); router.push('/dashboard'); });
  }, [bookingId]);

  const handleMobilePayment = async () => {
    if (!phoneNumber) {
      toast.error(`Enter your ${booking.paymentMethod === 'MTN_MOMO' ? 'MoMo' : 'Airtel'} phone number`);
      return;
    }
    setPaying(true);
    try {
      const endpoint = booking.paymentMethod === 'MTN_MOMO' ? '/api/payments/momo' : '/api/payments/airtel';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment successful!');
        setStep('confirmed');
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-text-secondary">Loading booking details...</p>
      </div>
    </div>
  );

  if (!booking) return null;

  const car = booking.car;
  const photoSrc = car.photos?.[0]?.startsWith('http') ? car.photos[0] : FALLBACK_IMG;

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        {step !== 'confirmed' && (
          <Link href={`/cars/${params.carId}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to car
          </Link>
        )}

        {/* Step indicator */}
        {step !== 'confirmed' && (
          <div className="flex items-center gap-4 mb-6">
            {[{ key: 'review', label: 'Review' }, { key: 'payment', label: 'Payment' }].map(({ key, label }, i) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === key ? 'bg-primary text-white' :
                  (step === 'payment' && key === 'review') ? 'bg-primary/30 text-primary' :
                  'bg-gray-200 text-gray-500'
                }`}>{i + 1}</div>
                <span className={`text-sm font-medium ${step === key ? 'text-primary' : 'text-text-secondary'}`}>{label}</span>
                {i < 1 && <div className="w-8 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* STEP: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-text-primary dark:text-white">Review Your Booking</h1>

            {/* Car summary */}
            <div className="card p-5 flex gap-4">
              <div className="relative w-24 h-18 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={photoSrc}
                  alt={car.make}
                  width={96}
                  height={72}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h2 className="font-bold text-text-primary dark:text-white">{car.year} {car.make} {car.model}</h2>
                <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {booking.pickupLocation}
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}
                  <span className="text-text-light">({booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''})</span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="card p-5 space-y-3 text-sm">
              <h3 className="font-semibold text-text-primary dark:text-white">Price Breakdown</h3>
              <div className="flex justify-between text-text-secondary">
                <span>{formatRWF(car.pricePerDay)} × {booking.totalDays} days</span>
                <span>{formatRWF(booking.subtotal)}</span>
              </div>
              {booking.driverFee > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Driver fee</span>
                  <span>{formatRWF(booking.driverFee)}</span>
                </div>
              )}
              {booking.depositAmount > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Security deposit (refundable)</span>
                  <span>{formatRWF(booking.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Platform fee (10%)</span>
                <span>{formatRWF(booking.platformFee)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold text-lg text-text-primary dark:text-white">
                <span>Total</span>
                <span className="text-primary">{formatRWF(booking.totalAmount)}</span>
              </div>
            </div>

            {/* Payment method badge */}
            <div className="card p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-text-primary dark:text-white">{getPaymentMethodLabel(booking.paymentMethod)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Free cancellation up to 24 hours before pickup
            </div>

            <button onClick={() => setStep('payment')} className="btn-primary w-full justify-center py-3 text-base">
              Proceed to Payment
            </button>
          </div>
        )}

        {/* STEP: Payment */}
        {step === 'payment' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-text-primary dark:text-white">Complete Payment</h1>
            <p className="text-text-secondary text-sm">
              Amount due: <strong className="text-primary text-base">{formatRWF(booking.totalAmount)}</strong>
            </p>

            {/* MTN MoMo or Airtel */}
            {(booking.paymentMethod === 'MTN_MOMO' || booking.paymentMethod === 'AIRTEL_MONEY') && (
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{booking.paymentMethod === 'MTN_MOMO' ? '📱' : '📲'}</span>
                  <div>
                    <div className="font-bold text-text-primary dark:text-white">{getPaymentMethodLabel(booking.paymentMethod)}</div>
                    <div className="text-sm text-text-secondary">
                      {booking.paymentMethod === 'MTN_MOMO'
                        ? 'You\'ll receive a prompt on your phone to approve'
                        : 'Airtel Money push notification will be sent'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">
                    {booking.paymentMethod === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-border rounded-l-xl bg-gray-50 dark:bg-gray-800 text-text-secondary text-sm font-medium">
                      +250
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="7XX XXX XXX"
                      className="input rounded-l-none flex-1"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMobilePayment}
                  disabled={paying}
                  className="btn-primary w-full justify-center py-3"
                >
                  {paying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment...</>
                  ) : (
                    `Pay ${formatRWF(booking.totalAmount)}`
                  )}
                </button>

                {paying && (
                  <p className="text-xs text-center text-text-secondary animate-pulse">
                    A payment request has been sent to your phone. Please approve it...
                  </p>
                )}
              </div>
            )}

            {/* Card (Stripe) */}
            {booking.paymentMethod === 'CARD' && (
              <StripePaymentForm
                bookingId={bookingId!}
                amount={booking.totalAmount}
                onSuccess={() => setStep('confirmed')}
              />
            )}
          </div>
        )}

        {/* STEP: Confirmed */}
        {step === 'confirmed' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">Booking Confirmed!</h1>
            <p className="text-text-secondary mb-2">
              Your {car.make} {car.model} is booked for {booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-text-secondary mb-8">
              Booking ref: <strong className="font-mono text-primary">{bookingId?.slice(0, 12).toUpperCase()}</strong>
            </p>

            <div className="card p-5 text-left space-y-3 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Pickup: <strong>{formatDate(booking.pickupDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Location: <strong>{booking.pickupLocation}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Host contact will be shared 1h before pickup</span>
              </div>
            </div>

            {/* Tip the host */}
            {!tipDismissed && (
              <TipWidget
                bookingId={bookingId!}
                hostName={booking.car?.host?.name || 'your host'}
                paymentMethod={booking.paymentMethod}
                onSkip={() => setTipDismissed(true)}
                onTipSent={() => setTipDismissed(true)}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <Link href={`/messages?bookingId=${bookingId}`} className="btn-secondary">
                <MessageSquare className="w-4 h-4" /> Message Host
              </Link>
              <a
                href={`/api/bookings/${bookingId}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <FileText className="w-4 h-4" /> Insurance Certificate
              </a>
              <Link href="/dashboard" className="btn-primary">
                View My Bookings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
