'use client';

import { useState } from 'react';
import { X, Loader2, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';
import { VAT_RATE } from '@/config/vat';

interface Props {
  bookingId: string;
  carName: string;
  pricePerDay: number;
  currentReturnDate: string; // ISO string
  onClose: () => void;
  onSuccess: (newReturnDate: string, totalCharged: number) => void;
}

function formatRWF(n: number) {
  return `RWF ${Math.round(n).toLocaleString()}`;
}

export function ExtendTripModal({
  bookingId,
  carName,
  pricePerDay,
  currentReturnDate,
  onClose,
  onSuccess,
}: Props) {
  const [days, setDays] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY'>('MTN_MOMO');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const extensionFee = pricePerDay * days;
  const vatAmount = Math.round(extensionFee * VAT_RATE);
  const totalCharged = extensionFee + vatAmount;
  const newReturnDate = addDays(new Date(currentReturnDate), days);

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAdded: days, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend');
      setSuccess(true);
      onSuccess(data.newReturnDate, data.totalCharged);
      toast.success(`Trip extended by ${days} day${days > 1 ? 's' : ''}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend trip');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-text-primary dark:text-white">Extend Your Trip</h2>
            <p className="text-xs text-text-secondary mt-0.5">{carName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-text-primary dark:text-white">Trip Extended!</p>
              <p className="text-sm text-text-secondary mt-1">
                New return date:{' '}
                <strong>{format(newReturnDate, 'EEE d MMM yyyy, h:mm a')}</strong>
              </p>
              <button
                onClick={onClose}
                className="btn-primary mt-4 w-full text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Current return date */}
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Current return:{' '}
                  <strong className="text-text-primary dark:text-white">
                    {format(new Date(currentReturnDate), 'EEE d MMM yyyy, h:mm a')}
                  </strong>
                </span>
              </div>

              {/* Day stepper */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Extra days (1–7)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDays(d => Math.max(1, d - 1))}
                    disabled={days <= 1}
                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl font-bold text-text-primary disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-extrabold text-primary">{days}</span>
                    <span className="text-sm text-text-secondary ml-1">day{days > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => setDays(d => Math.min(7, d + 1))}
                    disabled={days >= 7}
                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl font-bold text-text-primary disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* New return date */}
              <div className="mb-4 text-xs text-text-secondary bg-primary/5 rounded-xl px-3 py-2.5">
                <span>New return: </span>
                <strong className="text-primary">
                  {format(newReturnDate, 'EEE d MMM yyyy, h:mm a')}
                </strong>
              </div>

              {/* Fee breakdown */}
              <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>{formatRWF(pricePerDay)} × {days} day{days > 1 ? 's' : ''}</span>
                  <span>{formatRWF(extensionFee)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>VAT (18% — RRA)</span>
                  <span>{formatRWF(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
                  <span>Total charged</span>
                  <span className="text-primary">{formatRWF(totalCharged)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Payment method
                </label>
                <div className="flex gap-2">
                  {(['MTN_MOMO', 'AIRTEL_MONEY'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 text-xs py-2 px-3 rounded-xl border font-semibold transition-colors ${
                        paymentMethod === method
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-gray-700 text-text-secondary hover:border-primary/50'
                      }`}
                    >
                      {method === 'MTN_MOMO' ? '📱 MTN MoMo' : '📱 Airtel Money'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm */}
              <button
                onClick={confirm}
                disabled={loading}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Processing…' : `Confirm Extension — ${formatRWF(totalCharged)}`}
              </button>

              <p className="text-xs text-text-secondary text-center mt-2">
                You&apos;ll be charged via {paymentMethod === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Airtel Money'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
