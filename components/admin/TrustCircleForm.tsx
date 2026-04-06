'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const CIRCLE_TYPES = [
  { value: 'sacco', label: 'SACCO' },
  { value: 'employer', label: 'Employer' },
  { value: 'university', label: 'University' },
  { value: 'church', label: 'Church / Community' },
];

export function TrustCircleForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: 'sacco', payoutAccount: '' });
  const [loading, setLoading] = useState(false);

  function update(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/trust-circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Circle created! Referral code: ${data.referralCode}`);
      setForm({ name: '', type: 'sacco', payoutAccount: '' });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create circle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Circle Name *</label>
        <input required value={form.name} onChange={e => update('name', e.target.value)}
          placeholder="e.g. Umwalimu SACCO" className="input" />
      </div>

      <div>
        <label className="label">Circle Type *</label>
        <select value={form.type} onChange={e => update('type', e.target.value)} className="input">
          {CIRCLE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Payout Account (optional)</label>
        <input value={form.payoutAccount} onChange={e => update('payoutAccount', e.target.value)}
          placeholder="MTN MoMo / Bank account number" className="input" />
        <p className="text-xs text-text-light mt-1">Where group referral earnings are deposited</p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
          : <><CheckCircle className="w-4 h-4" /> Create Trust Circle</>}
      </button>

      <p className="text-xs text-center text-text-light">
        A unique 6-character referral code will be auto-generated.
        Share it with community members to join.
      </p>
    </form>
  );
}
