'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';

interface Props {
  bookingId: string;
  renterName: string;
  renterPhone?: string | null;
  returnDate: string;         // ISO string
  lateFeeAccrued: number;
  notif1hSentAt: string | null; // ISO string or null
  lateReturnReportedAt: string | null;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function LateReturnPanel({
  bookingId,
  renterName,
  renterPhone,
  returnDate,
  lateFeeAccrued,
  notif1hSentAt,
  lateReturnReportedAt: initialReported,
}: Props) {
  const [now, setNow] = useState(new Date());
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(!!initialReported);
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const returnDt = new Date(returnDate);
  const minutesLate = Math.max(0, (now.getTime() - returnDt.getTime()) / 60000);
  const noShowUnlocked = !!notif1hSentAt;

  // Minutes until the "Report No-Show" button unlocks (1h past return)
  const minutesUntilUnlock = Math.max(0, 60 - minutesLate);

  const waLink = renterPhone
    ? `https://wa.me/${renterPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${renterName}, this is your host via Gari. Your car is overdue — please return it or contact me immediately.`)}`
    : null;

  async function reportNoShow() {
    if (!confirm(`Report ${renterName} as a no-show? This will notify Gari support.`)) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/report-noshow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReported(true);
      setReportMsg(data.message || 'Gari support has been notified.');
      toast.success('No-show reported. Gari support is now involved.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to report no-show');
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="mt-3 border-t-2 border-red-300 pt-3">
      <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
        <AlertTriangle className="w-4 h-4" />
        OVERDUE — {formatMinutes(minutesLate)} late
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 space-y-1.5 text-xs text-text-secondary mb-3">
        <div>Was due back at <strong>{returnDt.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        {lateFeeAccrued > 0 && (
          <div>Late fees accrued: <strong className="text-red-600">{formatRWF(lateFeeAccrued)}</strong> (auto-collected)</div>
        )}
        <div>
          Gari has sent {notif1hSentAt ? 'multiple' : 'an initial'} reminder{notif1hSentAt ? 's' : ''} to {renterName}.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Contact {renterName}
          </a>
        )}

        {!reported ? (
          noShowUnlocked ? (
            <button
              onClick={reportNoShow}
              disabled={reporting}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 font-semibold"
            >
              {reporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              🚨 Report No-Show
            </button>
          ) : (
            <span className="text-xs text-text-light py-2">
              Report no-show unlocks in {formatMinutes(minutesUntilUnlock)}
            </span>
          )
        ) : (
          <div className="text-xs text-green-700 bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-xl">
            ✓ Reported — {reportMsg || 'Gari support notified'}
          </div>
        )}
      </div>
    </div>
  );
}
