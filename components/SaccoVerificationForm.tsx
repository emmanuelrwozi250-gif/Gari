'use client';

import { useState } from 'react';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  current?: { saccoName?: string | null; saccoMemberId?: string | null; saccoVerified?: boolean };
  onUpdated?: () => void;
}

// Well-known Rwandan SACCOs
const KNOWN_SACCOS = [
  'Umwalimu SACCO',
  'Zigama CSS',
  'Inkingi SACCO',
  'Vision Finance Company',
  'Urwego Bank',
  'COPEDU',
  'Goshen Finance',
  'CLECAM EJOHEZA',
  'Other',
];

export function SaccoVerificationForm({ current, onUpdated }: Props) {
  const [saccoName, setSaccoName] = useState(current?.saccoName || '');
  const [saccoMemberId, setSaccoMemberId] = useState(current?.saccoMemberId || '');
  const [customSacco, setCustomSacco] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const finalName = saccoName === 'Other' ? customSacco : saccoName;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalName || !saccoMemberId) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saccoName: finalName, saccoMemberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('SACCO details submitted for review');
      setSubmitted(true);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (current?.saccoVerified) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800 text-sm">SACCO Verified</p>
          <p className="text-xs text-green-700">{current.saccoName} · Member #{current.saccoMemberId}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Shield size={20} className="text-blue-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">Under Review</p>
          <p className="text-xs text-blue-700">Your SACCO membership is being verified. This usually takes 24–48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <Shield size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          SACCO members get a <strong>+20 trust score boost</strong> and a verified badge on their profile, increasing booking acceptance rates.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">SACCO Name</label>
        <select
          value={saccoName}
          onChange={e => setSaccoName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        >
          <option value="">Select your SACCO...</option>
          {KNOWN_SACCOS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {saccoName === 'Other' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">SACCO Name (custom)</label>
          <input
            type="text"
            value={customSacco}
            onChange={e => setCustomSacco(e.target.value)}
            placeholder="Enter your SACCO name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Member ID / Account Number</label>
        <input
          type="text"
          value={saccoMemberId}
          onChange={e => setSaccoMemberId(e.target.value)}
          placeholder="e.g. UMW-2024-00123"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Found on your SACCO passbook, card, or member certificate.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
        {loading ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </form>
  );
}
