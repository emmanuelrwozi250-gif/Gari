'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Calendar, MapPin, Star, Loader2, AlertTriangle, CheckCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { POLICY_TIERS, calcRenterRefundPct, type PolicyTier } from '@/config/cancellation';
import { ExtendTripModal } from './ExtendTripModal';

interface BookingData {
  id: string;
  carId: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  createdAt: string;
  pickupLocation: string;
  totalAmount: number;
  depositAmount: number;
  depositStatus: string;
  depositRefundedAt: string | null;
  depositRefundAmount: number | null;
  cancelledAt: string | null;
  completedAt: string | null;
  cancellationPolicy: PolicyTier;
  car: {
    year: number;
    make: string;
    model: string;
    photos: string[];
    pricePerDay: number;
  };
  review: boolean;
  dispute: {
    id: string;
    status: string;
    renterResponse: string | null;
  } | null;
}

type TabKey = 'upcoming' | 'active' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: 'upcoming', label: 'Upcoming', statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'active', label: 'Active', statuses: ['ACTIVE'] },
  { key: 'completed', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED', 'REJECTED', 'DISPUTED'] },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-primary-light text-primary',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-600',
  DISPUTED: 'bg-orange-100 text-orange-700',
};

function formatRWF(n: number) {
  return `RWF ${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CancelButton({ bookingId, totalAmount, pickupDate, createdAt, policy }: {
  bookingId: string;
  totalAmount: number;
  pickupDate: string;
  createdAt: string;
  policy: PolicyTier;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const refundPct = calcRenterRefundPct(policy, pickupDate, createdAt);
  const refundAmount = Math.round(totalAmount * refundPct / 100);
  const cfg = POLICY_TIERS[policy];

  async function cancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by renter' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Booking cancelled. Refund: ${formatRWF(data.refundAmount)}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
      setShow(false);
    } finally {
      setLoading(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-red-500 hover:text-red-700 hover:underline inline-flex items-center gap-1"
      >
        Cancel booking
      </button>
    );
  }

  return (
    <div className="mt-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
      <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Cancel this booking?</p>
      <p className="text-xs text-red-700 dark:text-red-400 mb-1">
        <span className="font-semibold">{cfg.label} policy</span> — {cfg.description}
      </p>
      <p className="text-xs text-red-700 dark:text-red-400 mb-3">
        You will receive a refund of{' '}
        <strong>{formatRWF(refundAmount)}</strong>{' '}
        ({refundPct}% of {formatRWF(totalAmount)}).
      </p>
      <div className="flex gap-2">
        <button onClick={() => setShow(false)} className="text-xs text-text-secondary hover:underline">
          Keep booking
        </button>
        <button
          onClick={cancel}
          disabled={loading}
          className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60 inline-flex items-center gap-1 hover:bg-red-700 transition-colors"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Confirm cancellation
        </button>
      </div>
    </div>
  );
}

function DisputeResponseForm({ disputeId }: { disputeId: string }) {
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState<boolean | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (accept === null) { toast.error('Choose to accept or dispute'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept, renterResponse: response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(accept ? 'You accepted the claim. Deposit withheld.' : 'Response submitted. Admin will review.');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-xs text-orange-600 font-semibold hover:underline inline-flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Respond to damage claim →
      </button>
    );
  }

  return (
    <div className="mt-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 rounded-xl p-4">
      <div className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">Respond to damage claim</div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setAccept(true)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${accept === true ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-text-secondary'}`}>
          Accept claim
        </button>
        <button onClick={() => setAccept(false)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${accept === false ? 'bg-primary text-white border-primary' : 'border-gray-300 text-text-secondary'}`}>
          Dispute claim
        </button>
      </div>
      <textarea value={response} onChange={e => setResponse(e.target.value)}
        placeholder="Describe your response…" rows={2}
        className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900 resize-none mb-2" />
      <div className="flex gap-2">
        <button onClick={() => setShow(false)} className="text-xs text-text-secondary hover:underline">Cancel</button>
        <button onClick={submit} disabled={loading} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60 inline-flex items-center gap-1">
          {loading && <Loader2 className="w-3 h-3 animate-spin" />} Submit
        </button>
      </div>
    </div>
  );
}

interface Props {
  bookings: BookingData[];
}

export function RenterBookingsList({ bookings }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const extendingBooking = extendingId ? bookings.find(b => b.id === extendingId) : null;

  const counts: Record<TabKey, number> = {
    upcoming: bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length,
    active: bookings.filter(b => b.status === 'ACTIVE').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => ['CANCELLED', 'REJECTED', 'DISPUTED'].includes(b.status)).length,
  };

  const current = TABS.find(t => t.key === activeTab)!;
  const filtered = bookings.filter(b => current.statuses.includes(b.status));

  return (
    <div className="relative">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-900 text-text-primary dark:text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 text-xs font-bold ${activeTab === tab.key ? 'text-primary' : 'text-text-light'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Car className="w-10 h-10 text-text-light mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No {activeTab} bookings</p>
          {activeTab === 'upcoming' && (
            <Link href="/search" className="btn-primary mt-4 text-sm py-2 px-5 inline-flex">Browse Cars</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <div key={booking.id} className="card p-5">
              <div className="flex gap-4">
                <img
                  src={booking.car.photos[0] || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200'}
                  alt={booking.car.make}
                  className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-text-primary dark:text-white text-sm">
                      {booking.car.year} {booking.car.make} {booking.car.model}
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                    <MapPin className="w-3 h-3" /> {booking.pickupLocation}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(booking.pickupDate)} — {formatDate(booking.returnDate)}
                    </div>
                    <span className="font-semibold text-primary">{formatRWF(booking.totalAmount)}</span>
                  </div>

                  {/* Deposit status on completed bookings */}
                  {booking.status === 'COMPLETED' && booking.depositAmount > 0 && (
                    <div className={`mt-2 text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1.5 ${
                      booking.depositStatus === 'REFUNDED' ? 'bg-green-50 text-green-700' :
                      booking.depositStatus === 'WITHHELD' ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {booking.depositStatus === 'REFUNDED' ? (
                        <><CheckCircle className="w-3 h-3" /> Deposit {formatRWF(booking.depositRefundAmount ?? booking.depositAmount)} refunded
                          {booking.depositRefundedAt ? ` on ${formatDate(booking.depositRefundedAt)}` : ''}</>
                      ) : booking.depositStatus === 'WITHHELD' ? (
                        <><AlertTriangle className="w-3 h-3" /> Deposit withheld — damage claim accepted</>
                      ) : booking.depositStatus === 'DISPUTED' ? (
                        <><AlertTriangle className="w-3 h-3" /> Deposit under dispute</>
                      ) : (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Deposit pending release</>
                      )}
                    </div>
                  )}

                  {/* Action links */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Link href={`/cars/${booking.carId}`} className="text-xs text-primary hover:underline">
                      View Car
                    </Link>

                    {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                      <CancelButton
                        bookingId={booking.id}
                        totalAmount={booking.totalAmount}
                        pickupDate={booking.pickupDate}
                        createdAt={booking.createdAt}
                        policy={booking.cancellationPolicy}
                      />
                    )}

                    {/* Extend Trip — always on ACTIVE; on CONFIRMED if return is within 7 days */}
                    {(booking.status === 'ACTIVE' ||
                      (booking.status === 'CONFIRMED' &&
                        new Date(booking.returnDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000)) && (
                      <button
                        onClick={() => setExtendingId(booking.id)}
                        className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Extend Trip
                      </button>
                    )}

                    {booking.status === 'COMPLETED' && !booking.review && (
                      <Link href={`/review/${booking.id}`} className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> Write Review
                      </Link>
                    )}
                  </div>

                  {/* Dispute response */}
                  {booking.status === 'DISPUTED' && booking.dispute && !booking.dispute.renterResponse && (
                    <DisputeResponseForm disputeId={booking.dispute.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extend Trip Modal */}
      {extendingBooking && (
        <ExtendTripModal
          bookingId={extendingBooking.id}
          carName={`${extendingBooking.car.year} ${extendingBooking.car.make} ${extendingBooking.car.model}`}
          pricePerDay={extendingBooking.car.pricePerDay}
          currentReturnDate={extendingBooking.returnDate}
          onClose={() => setExtendingId(null)}
          onSuccess={() => { setExtendingId(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}
