'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatRWF } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ROIData {
  totalLandedCostRwf: number;
  monthlyGrossRevenueRwf: number;
  monthlyNetRevenueRwf: number;
  paybackMonths: number;
  annualRoiPct: number;
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
}

interface EarnListing {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  photos: string[];
  purchasePriceRwf: number;
  repairCostRwf: number;
  registrationCostRwf: number;
  importDutiesRwf: number;
  comparableDailyRate: number;
  occupancyPct: number;
  roiData: ROIData | null;
  roiConfidence: string;
  district: string;
}

const CONFIDENCE_COLORS = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-yellow-700 bg-yellow-50',
  low: 'text-red-600 bg-red-50',
};

const TIMELINE_LABELS: Record<string, string> = {
  immediate: 'Ready to buy now',
  '1-3months': 'Within 1–3 months',
  '3-6months': 'Within 3–6 months',
  '6months+': 'More than 6 months',
};

const DISCLAIMER =
  'Income estimates are based on similar cars listed on Gari and an assumed occupancy rate. ' +
  'Actual earnings depend on demand, condition, and your pricing. ' +
  'Listing on Gari after purchase is entirely optional.';

function BuyEarnCard({ listing }: { listing: EarnListing }) {
  const [expanded, setExpanded] = useState(false);
  const roi = listing.roiData;
  const totalCost = listing.purchasePriceRwf + listing.repairCostRwf + listing.registrationCostRwf + listing.importDutiesRwf;

  return (
    <div className="card overflow-hidden">
      {/* Photo */}
      <div
        className="h-48 bg-gray-200 bg-cover bg-center relative"
        style={{ backgroundImage: listing.photos[0] ? `url(${listing.photos[0]})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div>
            <div className="text-white font-bold">{listing.year} {listing.make} {listing.model}</div>
            <div className="text-white/70 text-xs">{listing.type.replace(/_/g, ' ')}</div>
          </div>
          {roi && (
            <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg">
              ~{roi.annualRoiPct}% ROI/yr
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Disclaimer — always shown */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{DISCLAIMER}</p>
        </div>

        {/* Key numbers */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Cost</span>
            <span className="font-bold text-text-primary">{formatRWF(totalCost)}</span>
          </div>
          {roi && (
            <>
              <div className="flex justify-between">
                <span className="text-text-secondary">Est. Daily Rate</span>
                <span className="font-medium">{formatRWF(listing.comparableDailyRate)}/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Est. Monthly Income</span>
                <span className="font-medium text-primary">~{formatRWF(roi.monthlyNetRevenueRwf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payback Period</span>
                <span className="font-medium">~{roi.paybackMonths} months</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Confidence</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONFIDENCE_COLORS[roi.confidence as keyof typeof CONFIDENCE_COLORS]}`}>
                  {roi.confidence.charAt(0).toUpperCase() + roi.confidence.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Cost breakdown expandable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary w-full justify-center mb-3"
        >
          <Info className="w-3.5 h-3.5" />
          How is this calculated?
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3 text-xs space-y-1.5">
            <div className="font-semibold text-text-primary mb-2">Cost Breakdown</div>
            <div className="flex justify-between"><span className="text-text-secondary">Purchase price</span><span>{formatRWF(listing.purchasePriceRwf)}</span></div>
            {listing.repairCostRwf > 0 && <div className="flex justify-between"><span className="text-text-secondary">Est. repairs</span><span>{formatRWF(listing.repairCostRwf)}</span></div>}
            {listing.registrationCostRwf > 0 && <div className="flex justify-between"><span className="text-text-secondary">Registration</span><span>{formatRWF(listing.registrationCostRwf)}</span></div>}
            {listing.importDutiesRwf > 0 && <div className="flex justify-between"><span className="text-text-secondary">Import duties</span><span>{formatRWF(listing.importDutiesRwf)}</span></div>}
            <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total landed cost</span><span>{formatRWF(totalCost)}</span></div>
            <div className="mt-2 pt-2 border-t border-border font-semibold text-text-primary">Income Assumptions</div>
            <div className="flex justify-between"><span className="text-text-secondary">Comparable daily rate</span><span>{formatRWF(listing.comparableDailyRate)}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Occupancy assumed</span><span>{listing.occupancyPct}%</span></div>
            <p className="text-text-light mt-2 italic">Daily rate pulled from {listing.roiConfidence === 'low' ? 'fewer than 3' : listing.roiConfidence === 'medium' ? '3–5' : '5+'} comparable Gari listings. Listing after purchase is optional.</p>
          </div>
        )}

        <a
          href={`https://wa.me/${(process.env.NEXT_PUBLIC_GARI_WA || '250788000000').replace(/\D/g, '')}?text=I'm interested in the ${listing.year} ${listing.make} ${listing.model} on Gari Buy %26 Earn`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full justify-center text-sm py-2.5"
        >
          Express Interest
        </a>
      </div>
    </div>
  );
}

function InterestForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', whatsapp: '', email: '', budgetMin: '', budgetMax: '',
    preferredType: 'SUV_4X4', timeline: 'immediate', notes: '',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/earn/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budgetMin: Number(form.budgetMin), budgetMax: Number(form.budgetMax) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Your Name *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean-Pierre Habimana" className="input" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label">WhatsApp Number *</label>
          <input required value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+250 7XX XXX XXX" className="input" />
        </div>
        <div className="col-span-2">
          <label className="label">Email (optional)</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input" />
        </div>
        <div>
          <label className="label">Budget Min (RWF) *</label>
          <input required type="number" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} placeholder="5,000,000" className="input" />
        </div>
        <div>
          <label className="label">Budget Max (RWF) *</label>
          <input required type="number" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} placeholder="15,000,000" className="input" />
        </div>
        <div>
          <label className="label">Preferred Type</label>
          <select value={form.preferredType} onChange={e => setForm({ ...form, preferredType: e.target.value })} className="input">
            {['ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP', 'LUXURY'].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Timeline</label>
          <select value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} className="input">
            {Object.entries(TIMELINE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Additional Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements..." rows={3} className="input resize-none" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Submit Interest'}
      </button>
    </form>
  );
}

export default function EarnPage() {
  const [listings, setListings] = useState<EarnListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/earn')
      .then(r => r.json())
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Hero */}
      <div className="bg-dark-bg text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-accent-yellow" />
            <h1 className="text-4xl font-extrabold">Earn with Your Car</h1>
          </div>
          <p className="text-xl text-gray-300 mb-4">
            Buy a car. List it on Gari. Earn rental income.
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            We source vehicles and show you exactly how much similar cars earn on Gari — so you can make an informed decision. Listing after purchase is completely optional.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[['~65%', 'Avg. occupancy on Gari'], ['~10 months', 'Avg. payback period'], ['Listing optional', 'Your car, your choice']].map(([stat, label]) => (
              <div key={stat} className="text-center">
                <div className="text-2xl font-extrabold text-accent-yellow">{stat}</div>
                <div className="text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : listings.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-6">
              Available Cars — with Income Estimates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {listings.map(l => <BuyEarnCard key={l.id} listing={l} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-text-secondary mb-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No curated listings right now.</p>
            <p className="text-sm mt-1">Submit your interest below and we'll reach out with options.</p>
          </div>
        )}

        {/* Interest form */}
        <div className="max-w-xl mx-auto">
          {submitted ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Interest Received!</h3>
              <p className="text-text-secondary text-sm">
                Our team will contact you within 24 hours on WhatsApp with matching options.
              </p>
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary dark:text-white">Express Your Interest</h2>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Tell us your budget and preferences. We'll source matching options and send them directly to your WhatsApp.
              </p>
              <InterestForm onSuccess={() => setSubmitted(true)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
