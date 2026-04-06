'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { RWANDA_DISTRICTS } from '@/lib/districts';

const CAR_TYPES = [
  'ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP', 'CONVERTIBLE', 'TRUCK',
];

const INITIAL = {
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  type: 'SUV_4X4',
  district: 'Gasabo',
  purchasePriceRwf: '',
  repairCostRwf: '0',
  registrationCostRwf: '0',
  importDutiesRwf: '0',
  comparableDailyRate: '',
  occupancyPct: '65',
  maintenanceReservePct: '10',
  photos: [''],
};

function calcPreview(f: typeof INITIAL) {
  const purchase = Number(f.purchasePriceRwf) || 0;
  const repair = Number(f.repairCostRwf) || 0;
  const reg = Number(f.registrationCostRwf) || 0;
  const duties = Number(f.importDutiesRwf) || 0;
  const rate = Number(f.comparableDailyRate) || 0;
  const occ = Number(f.occupancyPct) || 65;
  const maint = Number(f.maintenanceReservePct) || 10;

  const totalCost = purchase + repair + reg + duties;
  const monthlyGross = Math.round(rate * 30.44 * (occ / 100));
  const monthlyNet = Math.round(monthlyGross * (1 - maint / 100));
  const payback = monthlyNet > 0 ? Math.ceil(totalCost / monthlyNet) : null;
  const annualRoi = totalCost > 0 ? Math.round((monthlyNet * 12 / totalCost) * 100) : 0;

  return { totalCost, monthlyGross, monthlyNet, payback, annualRoi };
}

function formatRWF(n: number) {
  return n.toLocaleString('en-RW') + ' RWF';
}

export function BuyEarnListingForm() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const preview = calcPreview(form);

  function update(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function updatePhoto(idx: number, val: string) {
    const photos = [...form.photos];
    photos[idx] = val;
    setForm(prev => ({ ...prev, photos }));
  }

  function addPhoto() {
    if (form.photos.length < 10) {
      setForm(prev => ({ ...prev, photos: [...prev.photos, ''] }));
    }
  }

  function removePhoto(idx: number) {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          purchasePriceRwf: Number(form.purchasePriceRwf),
          repairCostRwf: Number(form.repairCostRwf),
          registrationCostRwf: Number(form.registrationCostRwf),
          importDutiesRwf: Number(form.importDutiesRwf),
          comparableDailyRate: Number(form.comparableDailyRate),
          occupancyPct: Number(form.occupancyPct),
          maintenanceReservePct: Number(form.maintenanceReservePct),
          photos: form.photos.filter(p => p.trim() !== ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Listing created successfully!');
      setForm(INITIAL);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Vehicle basics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="label">Make *</label>
          <input required value={form.make} onChange={e => update('make', e.target.value)}
            placeholder="Toyota" className="input" />
        </div>
        <div className="col-span-1">
          <label className="label">Model *</label>
          <input required value={form.model} onChange={e => update('model', e.target.value)}
            placeholder="RAV4" className="input" />
        </div>
        <div className="col-span-1">
          <label className="label">Year *</label>
          <input required type="number" value={form.year} onChange={e => update('year', e.target.value)}
            min="2000" max="2030" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type *</label>
          <select value={form.type} onChange={e => update('type', e.target.value)} className="input">
            {CAR_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">District *</label>
          <select value={form.district} onChange={e => update('district', e.target.value)} className="input">
            {RWANDA_DISTRICTS.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <label className="label">Purchase Price (RWF) *</label>
        <input required type="number" value={form.purchasePriceRwf}
          onChange={e => update('purchasePriceRwf', e.target.value)}
          placeholder="15,000,000" className="input" />
      </div>

      <div>
        <label className="label">Comparable Daily Rate (RWF) *</label>
        <input required type="number" value={form.comparableDailyRate}
          onChange={e => update('comparableDailyRate', e.target.value)}
          placeholder="50,000" className="input" />
        <p className="text-xs text-text-light mt-1">Typical daily rental rate for similar cars on Gari</p>
      </div>

      {/* Additional costs (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowCosts(v => !v)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium"
        >
          {showCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Additional Costs & Assumptions
        </button>

        {showCosts && (
          <div className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Repair / Prep Cost (RWF)</label>
                <input type="number" value={form.repairCostRwf}
                  onChange={e => update('repairCostRwf', e.target.value)}
                  placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">Registration Cost (RWF)</label>
                <input type="number" value={form.registrationCostRwf}
                  onChange={e => update('registrationCostRwf', e.target.value)}
                  placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">Import Duties (RWF)</label>
                <input type="number" value={form.importDutiesRwf}
                  onChange={e => update('importDutiesRwf', e.target.value)}
                  placeholder="0" className="input" />
              </div>
              <div>
                <label className="label">Occupancy % (default 65)</label>
                <input type="number" value={form.occupancyPct}
                  onChange={e => update('occupancyPct', e.target.value)}
                  min="10" max="100" className="input" />
              </div>
              <div>
                <label className="label">Maintenance Reserve %</label>
                <input type="number" value={form.maintenanceReservePct}
                  onChange={e => update('maintenanceReservePct', e.target.value)}
                  min="0" max="50" className="input" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live ROI preview */}
      {Number(form.purchasePriceRwf) > 0 && Number(form.comparableDailyRate) > 0 && (
        <div className="bg-primary-light dark:bg-primary/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">ROI Preview</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-text-secondary">Total Landed Cost</div>
              <div className="font-bold text-text-primary dark:text-white">{formatRWF(preview.totalCost)}</div>
            </div>
            <div>
              <div className="text-text-secondary">Est. Monthly Net</div>
              <div className="font-bold text-primary">{formatRWF(preview.monthlyNet)}</div>
            </div>
            <div>
              <div className="text-text-secondary">Annual ROI</div>
              <div className="font-bold text-text-primary dark:text-white">{preview.annualRoi}%</div>
            </div>
            <div>
              <div className="text-text-secondary">Payback Period</div>
              <div className="font-bold text-text-primary dark:text-white">
                {preview.payback ? `${preview.payback} months` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos */}
      <div>
        <label className="label">Photo URLs</label>
        <div className="space-y-2">
          {form.photos.map((photo, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={photo}
                onChange={e => updatePhoto(idx, e.target.value)}
                placeholder={`https://... (photo ${idx + 1})`}
                className="input flex-1"
              />
              {form.photos.length > 1 && (
                <button type="button" onClick={() => removePhoto(idx)}
                  className="text-xs text-red-500 hover:text-red-700 px-2">✕</button>
              )}
            </div>
          ))}
          {form.photos.length < 10 && (
            <button type="button" onClick={addPhoto}
              className="text-xs text-primary hover:underline">+ Add photo</button>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Listing...</>
          : <><CheckCircle className="w-4 h-4" /> Create Listing</>}
      </button>
    </form>
  );
}
