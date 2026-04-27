'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Building2, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ORG_TYPES = [
  { value: 'CORPORATE', label: 'Private Company' },
  { value: 'SME',       label: 'SME / Startup' },
  { value: 'NGO',       label: 'NGO / INGO' },
  { value: 'GOVERNMENT',label: 'Government / Parastatal' },
];

export default function CorporateApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName: '', orgType: 'CORPORATE', taxId: '',
    billingAddress: '', billingEmail: '', contactName: '', contactPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const valid = form.orgName.length >= 2 && form.billingEmail.includes('@') && form.contactName.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.status === 401) {
        toast.error('Please sign in first');
        router.push('/login?callbackUrl=/corporate/apply');
        return;
      }
      if (res.status === 409) {
        toast.error('You already have a corporate account');
        router.push('/dashboard/corporate');
        return;
      }
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-2">Application received!</h2>
          <p className="text-text-secondary text-sm mb-6">
            Our team will review your application and contact you on WhatsApp within 1 business day to complete your account setup.
          </p>
          <Link href="/" className="btn-primary w-full justify-center py-3">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link href="/corporate" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Business Account Application</h1>
            <p className="text-sm text-text-secondary">Takes 2 minutes · Reviewed within 1 business day</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Organisation */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-text-primary dark:text-white text-sm uppercase tracking-wide">Organisation</h2>

            <div>
              <label className="label">Organisation name *</label>
              <input value={form.orgName} onChange={e => set('orgName', e.target.value)}
                placeholder="Acme Rwanda Ltd" className="input w-full" required />
            </div>

            <div>
              <label className="label">Organisation type *</label>
              <select value={form.orgType} onChange={e => set('orgType', e.target.value)} className="input w-full">
                {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">TIN / Tax ID <span className="text-text-light font-normal">(optional)</span></label>
              <input value={form.taxId} onChange={e => set('taxId', e.target.value)}
                placeholder="102345678" className="input w-full" />
            </div>

            <div>
              <label className="label">Billing address <span className="text-text-light font-normal">(optional)</span></label>
              <input value={form.billingAddress} onChange={e => set('billingAddress', e.target.value)}
                placeholder="KG 11 Ave, Kigali, Rwanda" className="input w-full" />
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-text-primary dark:text-white text-sm uppercase tracking-wide">Contact details</h2>

            <div>
              <label className="label">Billing email *</label>
              <input type="email" value={form.billingEmail} onChange={e => set('billingEmail', e.target.value)}
                placeholder="finance@acme.rw" className="input w-full" required />
              <p className="text-xs text-text-light mt-1">Monthly invoices will be sent here.</p>
            </div>

            <div>
              <label className="label">Contact name *</label>
              <input value={form.contactName} onChange={e => set('contactName', e.target.value)}
                placeholder="Jean-Baptiste Uwimana" className="input w-full" required />
            </div>

            <div>
              <label className="label">WhatsApp / phone <span className="text-text-light font-normal">(optional)</span></label>
              <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                placeholder="+250 78X XXX XXX" className="input w-full" />
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 text-xs text-blue-800 dark:text-blue-200">
            ℹ️ By applying you agree to Gari&apos;s <Link href="/terms" className="underline">Terms of Service</Link> and corporate billing policy. Approved accounts receive Net-30 invoicing with a credit limit set by Gari.
          </div>

          <button type="submit" disabled={!valid || submitting}
            className="btn-primary w-full justify-center py-4 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />Submitting…</>
              : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}
