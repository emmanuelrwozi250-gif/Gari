'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, Loader2, Shield, Building2, AlertTriangle } from 'lucide-react';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import toast from 'react-hot-toast';

const BANK = process.env.NEXT_PUBLIC_BANK_PARTNER_NAME || 'our banking partner';

export default function FinancingPage() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: (session?.user?.name) || '',
    nidaNumber: '',
    monthlyIncome: '',
    desiredCarType: 'SUV_4X4',
    downPayment: '',
    timeline: 'immediate',
    notes: '',
  });

  function update(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { toast.error('Please sign in first'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monthlyIncome: Number(form.monthlyIncome), downPayment: Number(form.downPayment) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-3">Application Submitted!</h2>
          <p className="text-text-secondary text-sm mb-6">
            Our team will review your application and refer you to {BANK} within 2–3 business days.
            You'll be notified via WhatsApp.
          </p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-extrabold text-text-primary dark:text-white">Drive to Own</h1>
          </div>
          <p className="text-text-secondary">
            Finance your car purchase through {BANK}. Earn rental income on Gari while you pay it off.
          </p>
        </div>

        {/* Important disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">This is not a loan application</p>
            <p>Gari will review your expression of interest and refer eligible applicants to our banking partner. Loan approval, terms, and disbursement are entirely at the bank's discretion. Gari is not a licensed lender.</p>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-text-primary dark:text-white mb-4">How Drive to Own Works</h2>
          <div className="space-y-3">
            {[
              ['1', 'Submit this form', 'Tell us your income, preferred car type, and down payment'],
              ['2', 'Gari review', 'We review your profile within 2–3 business days'],
              ['3', 'Bank referral', `Eligible applications are referred to ${BANK}`],
              ['4', 'Earn while you pay', 'List your car on Gari to generate rental income to cover loan repayments'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</div>
                <div>
                  <div className="font-semibold text-sm text-text-primary dark:text-white">{title}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!session ? (
          <div className="card p-8 text-center">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-text-secondary mb-4">Sign in to submit an application</p>
            <Link href="/login?callbackUrl=/financing" className="btn-primary">Sign In</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card p-6 space-y-4">
            <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Expression of Interest
            </h2>

            <div>
              <label className="label">Full Name (as on NID) *</label>
              <input required value={form.fullName} onChange={e => update('fullName', e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">NIDA Number *</label>
              <input required value={form.nidaNumber} onChange={e => update('nidaNumber', e.target.value)} placeholder="1 XXXX X XXXXXXX X XX" className="input" />
            </div>

            <div>
              <label className="label">Monthly Income (RWF) *</label>
              <input required type="number" value={form.monthlyIncome} onChange={e => update('monthlyIncome', e.target.value)} placeholder="500,000" className="input" />
              <p className="text-xs text-text-light mt-1">Gross monthly income from all sources</p>
            </div>

            <div>
              <label className="label">Preferred Car Type *</label>
              <select value={form.desiredCarType} onChange={e => update('desiredCarType', e.target.value)} className="input">
                {['ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Available Down Payment (RWF) *</label>
              <input required type="number" value={form.downPayment} onChange={e => update('downPayment', e.target.value)} placeholder="1,000,000" className="input" />
            </div>

            <div>
              <label className="label">Timeline</label>
              <select value={form.timeline} onChange={e => update('timeline', e.target.value)} className="input">
                <option value="immediate">Ready to proceed now</option>
                <option value="1-3months">Within 1–3 months</option>
                <option value="3-6months">Within 3–6 months</option>
                <option value="6months+">More than 6 months</option>
              </select>
            </div>

            <div>
              <label className="label">Additional Notes</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional information..." rows={3} className="input resize-none" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
            </button>

            <p className="text-xs text-center text-text-light">
              By submitting, you consent to Gari sharing this information with {BANK} for loan assessment purposes.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
