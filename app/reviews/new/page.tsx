'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { formatRWF } from '@/lib/utils';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: number;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    photos: string[];
    district: string;
  };
  host: { name: string | null };
  review?: { id: string } | null;
}

function StarPicker({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Great',
    5: 'Excellent',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-9 h-9 transition-colors ${
                n <= (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || rating) > 0 && (
        <p className="text-sm font-semibold text-primary">
          {LABELS[hovered || rating]}
        </p>
      )}
    </div>
  );
}

function ReviewFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking') ?? '';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) { router.push('/dashboard'); return; }
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.error) { router.push('/dashboard'); return; }
        setBooking({
          ...data,
          car: {
            id: data.car?.id,
            make: data.car?.make,
            model: data.car?.model,
            year: data.car?.year,
            photos: data.car?.photos ?? [],
            district: data.car?.district,
          },
          host: { name: data.car?.host?.name ?? null },
        });
        if (data.review) setDone(true);
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [bookingId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit review. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const carPhoto = booking.car.photos?.[0];
  const tripEnd = booking.returnDate
    ? format(new Date(booking.returnDate), 'd MMM yyyy')
    : null;

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center card p-8">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Review submitted!
          </h1>
          <p className="text-text-secondary mb-6 text-sm">
            Your review is saved. It will be revealed publicly once the host also
            submits their review, or automatically after 14 days.
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-6">
          Leave a review
        </h1>

        {/* Car summary */}
        <div className="card p-4 flex gap-4 mb-6">
          <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
            {carPhoto ? (
              <Image
                src={carPhoto}
                alt={`${booking.car.make} ${booking.car.model}`}
                width={80}
                height={64}
                className="w-full h-full object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No photo
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-text-primary dark:text-white">
              {booking.car.year} {booking.car.make} {booking.car.model}
            </p>
            <p className="text-sm text-text-secondary">{booking.car.district}</p>
            {tripEnd && (
              <p className="text-xs text-text-light mt-0.5">Returned {tripEnd}</p>
            )}
          </div>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Stars */}
          <div>
            <p className="text-sm font-semibold text-text-primary dark:text-white mb-3 text-center">
              How was your experience?
            </p>
            <StarPicker rating={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="review-comment"
              className="block text-sm font-semibold text-text-primary dark:text-white mb-2"
            >
              Tell us more{' '}
              <span className="text-text-light font-normal">(min 10 characters)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Was the car clean? Did the host respond quickly? Would you recommend it?"
              className="input w-full resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-text-light mt-1 text-right">
              {comment.length}/1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Privacy note */}
          <p className="text-xs text-text-light">
            🔒 Reviews use a blind-reveal system — yours will only be made public after
            the host submits their review, or automatically after 14 days.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ReviewFormInner />
    </Suspense>
  );
}
