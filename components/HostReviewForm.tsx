'use client';

import { useState } from 'react';
import { Star, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  bookingId: string;
  renterName: string;
  onDone?: () => void;
}

const CATEGORIES = [
  { key: 'reliability',    label: 'Reliability',    hint: 'Returned on time, kept commitments' },
  { key: 'communication',  label: 'Communication',  hint: 'Responsive and clear' },
  { key: 'respect',        label: 'Respect',        hint: 'Treated car & property well' },
] as const;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              n <= (hover || value)
                ? 'fill-accent-yellow text-accent-yellow'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function HostReviewForm({ bookingId, renterName, onDone }: Props) {
  const [overall, setOverall] = useState(0);
  const [cats, setCats] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);

  const valid = overall > 0 && comment.length >= 10;

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/host-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating: overall,
          comment,
          reliability: cats.reliability,
          communication: cats.communication,
          respect: cats.respect,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      setDone(true);
      setPendingReveal(json.pendingReveal === true);
      toast.success(json.pendingReveal ? 'Review saved — waiting for renter.' : 'Review published!');
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
        <p className="text-sm font-semibold text-green-800 dark:text-green-200">Review submitted!</p>
        {pendingReveal && (
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            ⏳ Hidden until {renterName} also reviews, or after 14 days.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 p-4 space-y-4">
      <h4 className="font-semibold text-sm text-text-primary dark:text-white">
        Review {renterName}
      </h4>

      {/* Overall */}
      <div>
        <p className="text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wide">Overall rating *</p>
        <StarPicker value={overall} onChange={setOverall} />
        {overall > 0 && (
          <p className="text-xs text-text-light mt-1">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][overall]}
          </p>
        )}
      </div>

      {/* Category ratings */}
      <div className="space-y-3">
        {CATEGORIES.map(cat => (
          <div key={cat.key}>
            <p className="text-xs font-medium text-text-secondary mb-1">
              {cat.label} <span className="text-text-light font-normal">— {cat.hint}</span>
            </p>
            <StarPicker value={cats[cat.key] ?? 0} onChange={v => setCats(prev => ({ ...prev, [cat.key]: v }))} />
          </div>
        ))}
      </div>

      {/* Comment */}
      <div>
        <p className="text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wide">Comment *</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={`How was ${renterName} as a renter? (min 10 characters)`}
          className="input text-sm resize-none w-full"
        />
        <p className="text-right text-xs text-text-light mt-1">{comment.length}/500</p>
      </div>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-800 dark:text-amber-200">
        🔒 <strong>Blind review:</strong> Your review stays hidden until {renterName} also reviews, or after 14 days — so neither party is influenced by the other.
      </div>

      <button
        onClick={submit}
        disabled={!valid || submitting}
        className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />Submitting…</>
          : 'Submit Review'}
      </button>
    </div>
  );
}
