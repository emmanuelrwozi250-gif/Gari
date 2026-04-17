'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';

interface Props {
  disputeId: string;
  depositAmount: number;
}

export function AdminDisputeActions({ disputeId, depositAmount }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [partial, setPartial] = useState('');
  const [resolution, setResolution] = useState('');

  async function resolve(decision: 'REFUND' | 'WITHHOLD' | 'PARTIAL') {
    if (decision === 'PARTIAL' && !partial) {
      toast.error('Enter the partial refund amount');
      return;
    }
    setLoading(decision);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          partialAmount: decision === 'PARTIAL' ? Number(partial) : undefined,
          resolution: resolution || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Dispute resolved');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="text-sm font-semibold text-text-primary dark:text-white">Admin Decision</div>

      <input
        type="text"
        value={resolution}
        onChange={e => setResolution(e.target.value)}
        placeholder="Resolution notes (optional)"
        className="input w-full text-sm"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => resolve('REFUND')}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {loading === 'REFUND' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Refund deposit ({formatRWF(depositAmount)}) to renter
        </button>

        <button
          onClick={() => resolve('WITHHOLD')}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading === 'WITHHOLD' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Withhold deposit for host
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={partial}
            onChange={e => setPartial(e.target.value)}
            placeholder="Partial RWF…"
            className="input text-sm w-36"
          />
          <button
            onClick={() => resolve('PARTIAL')}
            disabled={loading !== null || !partial}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {loading === 'PARTIAL' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Partial split
          </button>
        </div>
      </div>
    </div>
  );
}
