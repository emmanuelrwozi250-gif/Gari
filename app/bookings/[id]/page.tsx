'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Clock, AlertTriangle, CheckCircle, MapPin, Phone,
  ChevronLeft, Loader2, Navigation,
} from 'lucide-react';
import { calculateExtensionFee } from '@/config/rental-policy';
import { formatRWF } from '@/lib/utils';
import { PhotoInspection } from '@/components/PhotoInspection';

interface TripStatus {
  id: string;
  status: string;
  returnDate: string;
  pickupDate: string;
  lateFeeAccrued: number;
  isLate: boolean;
  minutesLate: number;
  noShowUnlocked: boolean;
  minutesUntilNoShowUnlock: number;
  renterOnMyWay: boolean;
  extensionOptions: { hours: number; fee: number }[];
  host?: { name: string; phone?: string | null };
  car: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatLate(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} minute${Math.round(minutes) === 1 ? '' : 's'}`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h === 1 ? '' : 's'}`;
}

export default function ActiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<TripStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [extending, setExtending] = useState<number | null>(null);
  const [onMyWaySent, setOnMyWaySent] = useState(false);
  const [onMyWayLoading, setOnMyWayLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`);
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403 || res.status === 404) { router.push('/dashboard'); return; }
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setOnMyWaySent(data.renterOnMyWay);
      }
    } catch {
      // silently fail — show stale data
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // Initial fetch + poll every 60s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Live clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function extend(hours: number) {
    setExtending(hours);
    try {
      const res = await fetch(`/api/bookings/${id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoursAdded: hours, paymentMethod: 'MTN_MOMO' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Extended by ${hours}h! New return: ${new Date(data.newReturnDate).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}`);
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Extension failed');
    } finally {
      setExtending(null);
    }
  }

  async function sendOnMyWay() {
    setOnMyWayLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/on-my-way`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Host notified — they know you\'re on your way!');
      setOnMyWaySent(true);
    } catch {
      toast.error('Failed to send signal');
    } finally {
      setOnMyWayLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Booking not found</p>
        <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  const returnDate = new Date(status.returnDate);
  const msRemaining = returnDate.getTime() - now.getTime();
  const isOverdue = msRemaining < 0;
  const minutesLate = Math.max(0, -msRemaining / 60000);

  // Live late fee (updates every second from local calc when overdue)
  const liveFee = status.lateFeeAccrued;

  const hostWaLink = status.host?.phone
    ? `https://wa.me/${status.host.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm still on the Gari trip (booking ID: ${id}). `)}`
    : null;

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5">
          <ChevronLeft className="w-4 h-4" /> My Bookings
        </Link>

        {/* Car + status header */}
        <div className={`card p-5 mb-4 ${isOverdue ? 'border-2 border-red-400' : 'border-2 border-primary/30'}`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-lg font-extrabold text-text-primary dark:text-white">{status.car}</h1>
              {status.host && (
                <p className="text-sm text-text-secondary">{status.host.name}</p>
              )}
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isOverdue ? 'bg-red-100 text-red-700' :
              msRemaining < 2 * 3600000 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {status.status}
            </span>
          </div>

          {/* Timer */}
          {!isOverdue ? (
            <div className={`text-center py-4 rounded-xl ${msRemaining < 2 * 3600000 ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-primary-light'}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">
                Time remaining
              </div>
              <div className={`text-3xl font-extrabold tabular-nums ${msRemaining < 2 * 3600000 ? 'text-yellow-600' : 'text-primary'}`}>
                {formatTimeRemaining(msRemaining)}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                Return by {returnDate.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}{' '}
                {returnDate.toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="font-bold text-red-700 dark:text-red-400 text-lg">YOUR TRIP HAS ENDED</div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                Was due back at {returnDate.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-text-secondary mt-0.5">
                You are <span className="font-bold text-red-600">{formatLate(minutesLate)}</span> late
              </div>
              {liveFee > 0 && (
                <div className="mt-3 text-sm font-bold text-red-700 dark:text-red-400">
                  Late fees accrued: {formatRWF(liveFee)}
                  <span className="block text-xs font-normal text-text-secondary">
                    (RWF 5,000/hr after 30-min grace period)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Extension options */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-sm text-text-primary dark:text-white mb-3">
            {isOverdue ? '⏱ Extend now — stop the clock' : 'Need more time?'}
          </h2>
          <div className="space-y-2">
            {status.extensionOptions.map(opt => (
              <button
                key={opt.hours}
                onClick={() => extend(opt.hours)}
                disabled={extending !== null}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                  isOverdue
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-light text-primary hover:bg-primary hover:text-white border border-primary/20'
                }`}
              >
                <span>
                  {extending === opt.hours
                    ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</span>
                    : `+ ${opt.hours === 24 ? '1 full day' : `${opt.hours} hour${opt.hours > 1 ? 's' : ''}`}`
                  }
                </span>
                <span>{formatRWF(opt.fee)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pre-trip pickup inspection */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            📸 Pickup Inspection
          </p>
          <PhotoInspection bookingId={id} stage="pickup" />
        </div>

        {/* Return inspection — show when overdue or within last 2 hours */}
        {(isOverdue || msRemaining < 2 * 3600000) && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
              📸 Return Inspection
            </p>
            <PhotoInspection bookingId={id} stage="return" />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* I'm on my way */}
          {!onMyWaySent ? (
            <button
              onClick={sendOnMyWay}
              disabled={onMyWayLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              {onMyWayLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Navigation className="w-4 h-4" /> I'm on my way back</>
              }
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-700 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Host notified — on your way!
            </div>
          )}

          {/* Contact host */}
          {hostWaLink && (
            <a
              href={hostWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" /> Contact host
            </a>
          )}

          {/* Report an issue */}
          <a
            href="https://wa.me/250788123000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Report an issue
          </a>
        </div>

        {/* Policy reminder */}
        <p className="text-xs text-text-light text-center mt-6">
          <Link href="/policy" className="hover:underline">View full booking policy</Link>
          {' · '}Gari Support: +250 788 123 000
        </p>
      </div>
    </div>
  );
}
