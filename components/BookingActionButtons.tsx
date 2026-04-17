'use client';

import { useState } from 'react';
import { CheckCircle, X, Play, RotateCcw, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  bookingId: string;
  status: string;
  pickupDate: string;
  depositAmount: number;
  onSuccess?: () => void;
}

async function callAction(bookingId: string, action: string, body?: object) {
  const res = await fetch(`/api/bookings/${bookingId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function BookingActionButtons({ bookingId, status, pickupDate, depositAmount, onSuccess }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [damageDesc, setDamageDesc] = useState('');
  const [damageCost, setDamageCost] = useState('');

  const tripStartable = status === 'CONFIRMED' && new Date(pickupDate) <= new Date(Date.now() + 3600000);

  async function handle(action: string, body?: object, successMsg?: string) {
    setLoading(action);
    try {
      const data = await callAction(bookingId, action, body);
      toast.success(successMsg || 'Done!');
      if (data.waLink) {
        window.open(data.waLink, '_blank', 'noopener,noreferrer');
      }
      onSuccess?.();
      // Reload to reflect new status
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  async function handleDecline() {
    if (!declineReason.trim()) { toast.error('Please provide a reason'); return; }
    setShowDeclineModal(false);
    await handle('reject', { reason: declineReason }, 'Booking declined. Renter will be refunded.');
    setDeclineReason('');
  }

  async function handleDamage() {
    if (!damageDesc.trim()) { toast.error('Please describe the damage'); return; }
    setShowDamageModal(false);
    await handle(
      'dispute',
      { reason: 'Vehicle damage', description: damageDesc, estimatedCost: damageCost ? Number(damageCost) : undefined },
      'Damage report submitted. Deposit held pending review.'
    );
    setDamageDesc('');
    setDamageCost('');
  }

  const btn = (label: string, icon: React.ReactNode, action: string, cls: string, body?: object, msg?: string) => (
    <button
      onClick={() => handle(action, body, msg)}
      disabled={loading !== null}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${cls}`}
    >
      {loading === action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {/* PENDING → Accept or Decline */}
        {status === 'PENDING' && (
          <>
            {btn('Accept', <CheckCircle className="w-3.5 h-3.5" />, 'accept', 'bg-primary text-white hover:bg-primary-dark', undefined, 'Booking accepted! WhatsApp sent.')}
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-60"
            >
              <XCircle className="w-3.5 h-3.5" /> Decline
            </button>
          </>
        )}

        {/* CONFIRMED → Start Trip */}
        {status === 'CONFIRMED' && tripStartable &&
          btn('Start Trip', <Play className="w-3.5 h-3.5" />, 'start-trip', 'bg-blue-600 text-white hover:bg-blue-700', undefined, 'Trip started!')}

        {/* ACTIVE → Return Safe or Report Damage */}
        {status === 'ACTIVE' && (
          <>
            {btn(
              depositAmount > 0 ? `Return Safely (+RWF ${depositAmount.toLocaleString()} deposit)` : 'Mark Returned Safely',
              <RotateCcw className="w-3.5 h-3.5" />,
              'return-safe',
              'bg-primary text-white hover:bg-primary-dark',
              undefined,
              'Trip completed! Deposit refund queued.'
            )}
            <button
              onClick={() => setShowDamageModal(true)}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Report Damage
            </button>
          </>
        )}

        {/* CONFIRMED → Cancel */}
        {['PENDING', 'CONFIRMED'].includes(status) && (
          <button
            onClick={() => handle('cancel', { reason: 'Cancelled by host' }, 'Booking cancelled. Renter refunded.')}
            disabled={loading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-60"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      {/* Decline modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-1">Decline Booking</h3>
            <p className="text-sm text-text-secondary mb-4">Renter will be fully refunded. Provide a brief reason:</p>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder="e.g. Car unavailable on these dates"
              rows={3}
              className="input w-full text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeclineModal(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleDecline} className="flex-1 py-2 text-sm bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Damage modal */}
      {showDamageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-1">Report Damage</h3>
            <p className="text-sm text-text-secondary mb-4">
              Deposit will be held pending admin review.
              {depositAmount > 0 && ` Deposit: RWF ${depositAmount.toLocaleString()}`}
            </p>
            <textarea
              value={damageDesc}
              onChange={e => setDamageDesc(e.target.value)}
              placeholder="Describe the damage in detail..."
              rows={3}
              className="input w-full text-sm resize-none mb-3"
            />
            <input
              type="number"
              value={damageCost}
              onChange={e => setDamageCost(e.target.value)}
              placeholder="Estimated repair cost (RWF) — optional"
              className="input w-full text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDamageModal(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleDamage} className="flex-1 py-2 text-sm bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
