'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  verificationId: string;
  userId: string;
}

export function ForeignVerificationActions({ verificationId, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');

  async function handleApprove() {
    setLoading('approve');
    try {
      const res = await fetch(`/api/admin/foreign-verifications/${verificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      toast.success('Passport verified — renter notified');
      router.refresh();
    } catch {
      toast.error('Failed to approve verification');
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setLoading('reject');
    try {
      const res = await fetch(`/api/admin/foreign-verifications/${verificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      toast.success('Verification rejected');
      setShowRejectForm(false);
      router.refresh();
    } catch {
      toast.error('Failed to reject verification');
    } finally {
      setLoading(null);
    }
  }

  if (showRejectForm) {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Rejection reason (shown to renter)…"
          rows={2}
          className="input w-full text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={loading === 'reject'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            {loading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Confirm Rejection
          </button>
          <button
            onClick={() => setShowRejectForm(false)}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-text-secondary rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors"
      >
        {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Reject
      </button>
    </div>
  );
}
