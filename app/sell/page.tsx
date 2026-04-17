'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  Tag, ChevronRight, ChevronLeft, CheckCircle, Loader2,
  Camera, Shield, Star
} from 'lucide-react';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { formatRWF } from '@/lib/utils';
import toast from 'react-hot-toast';

const USD_RATE = 1340;

const TIERS = [
  { id: 'BASIC', label: 'Basic', price: 0, days: 30, desc: 'Standard placement, 30-day listing', color: 'border-gray-300' },
  { id: 'STANDARD', label: 'Standard', price: 5000, days: 60, desc: 'Photo gallery highlighted, 60-day listing', color: 'border-blue-400' },
  { id: 'PREMIUM', label: 'Premium', price: 15000, days: 90, desc: 'Featured on homepage, WhatsApp leads sent instantly, 90 days', color: 'border-accent-yellow' },
];

const STEPS = ['Vehicle Details', 'Photos', 'Verification', 'Listing Tier', 'Review'];

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear(), mileage: '',
    colour: '', regNumber: '', transmission: 'MANUAL', fuel: 'PETROL',
    type: 'SEDAN', condition: 'Good', askingPrice: '',
    district: '', description: '',
    photos: ['', '', '', '', '', '', '', ''],
    ownershipProof: '', listingTier: 'BASIC', alsoListForRent: false,
  });

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updatePhoto(i: number, url: string) {
    const photos = [...form.photos];
    photos[i] = url;
    update('photos', photos);
  }

  const validPhotos = form.photos.filter(p => p.trim().length > 0);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          mileage: Number(form.mileage),
          askingPrice: Number(form.askingPrice),
          photos: validPhotos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Listing created! Redirecting...');
      router.push(`/buy/${data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!session) return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🚗 Free basic listing
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Sell Your Car Fast in Rwanda</h1>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            Reach thousands of verified buyers across all 30 districts. Basic listing is completely free.
          </p>
          <button onClick={() => signIn()}
            className="inline-flex items-center gap-2 bg-accent-yellow text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-yellow-400 transition-colors">
            List Your Car — It&apos;s Free →
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', emoji: '📸', title: 'Create Your Listing', desc: 'Add photos, set your price, and describe your car. Takes less than 10 minutes.' },
            { step: '02', emoji: '🔔', title: 'Get Notified', desc: 'Receive WhatsApp messages when verified buyers show interest in your car.' },
            { step: '03', emoji: '🤝', title: 'Complete the Sale', desc: 'Meet at a safe location, inspect together, and transfer ownership via RRA.' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="text-4xl mb-3">{s.emoji}</div>
              <div className="text-xs font-bold text-primary mb-1">STEP {s.step}</div>
              <h3 className="font-bold text-lg text-text-primary dark:text-white mb-2">{s.title}</h3>
              <p className="text-text-secondary text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Gari */}
      <section className="py-12 bg-gray-bg dark:bg-gray-900 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-8">Why Sell on Gari?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: 'NIDA-verified buyers only', desc: 'Every buyer is identity-verified before they can contact you.' },
              { icon: '🆓', title: 'Free basic listing', desc: 'List for free and pay only when you upgrade to Premium or Standard.' },
              { icon: '🌍', title: 'Reach all 30 districts', desc: 'Your listing is visible to buyers across the entire country.' },
              { icon: '📱', title: 'WhatsApp enquiry system', desc: 'All buyer enquiries come directly to your WhatsApp — no middleman.' },
            ].map(b => (
              <div key={b.title} className="card p-5 flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{b.icon}</div>
                <div>
                  <div className="font-bold text-text-primary dark:text-white text-sm">{b.title}</div>
                  <div className="text-text-secondary text-xs mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-3">Ready to sell your car?</h2>
        <p className="text-text-secondary mb-6">Create a free account and list in minutes.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => signIn()}
            className="btn-primary px-8 py-3 text-base font-bold">
            Sign In to List Your Car
          </button>
          <Link href="/register?intent=sell" className="btn-secondary px-8 py-3 text-base font-bold">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Tag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Sell Your Car</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-primary text-white' :
                i === step ? 'bg-primary text-white ring-4 ring-primary/20' :
                'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-text-light'}`}>{label}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 0: Vehicle Details */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Vehicle Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Make *</label>
                  <input value={form.make} onChange={e => update('make', e.target.value)} placeholder="Toyota" className="input" required />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input value={form.model} onChange={e => update('model', e.target.value)} placeholder="Vitz" className="input" required />
                </div>
                <div>
                  <label className="label">Year *</label>
                  <input type="number" value={form.year} onChange={e => update('year', e.target.value)} className="input" min={1990} max={new Date().getFullYear() + 1} />
                </div>
                <div>
                  <label className="label">Mileage (km) *</label>
                  <input type="number" value={form.mileage} onChange={e => update('mileage', e.target.value)} placeholder="85000" className="input" />
                </div>
                <div>
                  <label className="label">Colour *</label>
                  <input value={form.colour} onChange={e => update('colour', e.target.value)} placeholder="White" className="input" />
                </div>
                <div>
                  <label className="label">Reg. Number</label>
                  <input value={form.regNumber} onChange={e => update('regNumber', e.target.value)} placeholder="RAD 123 A" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['MANUAL', 'AUTOMATIC'] as const).map(t => (
                  <button key={t} type="button" onClick={() => update('transmission', t)}
                    className={`py-2 rounded-xl border text-sm font-medium transition-colors ${form.transmission === t ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary'}`}>
                    {t === 'MANUAL' ? '🔧 Manual' : '⚙️ Auto'}
                  </button>
                ))}
                {(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const).map(f => (
                  <button key={f} type="button" onClick={() => update('fuel', f)}
                    className={`py-2 rounded-xl border text-sm font-medium transition-colors ${form.fuel === f ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary'}`}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Condition *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Excellent', 'Good', 'Fair', 'Needs Work'].map(c => (
                    <button key={c} type="button" onClick={() => update('condition', c)}
                      className={`py-2 rounded-xl border text-xs font-medium transition-colors ${form.condition === c ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Asking Price (RWF) *</label>
                <input type="number" value={form.askingPrice} onChange={e => update('askingPrice', e.target.value)} placeholder="8,500,000" className="input" />
                {form.askingPrice && <p className="text-xs text-text-light mt-1">≈ USD {Math.round(Number(form.askingPrice) / USD_RATE).toLocaleString()}</p>}
              </div>
              <div>
                <label className="label">District *</label>
                <select value={form.district} onChange={e => update('district', e.target.value)} className="input">
                  <option value="">Select district</option>
                  {RWANDA_DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="Describe the car — service history, any issues, reason for selling..." rows={4} className="input resize-none" />
              </div>
            </div>
          )}

          {/* Step 1: Photos */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Photos</h2>
              <p className="text-sm text-text-secondary">
                Add at least 8 photo URLs. Cover: front, rear, both sides, interior front/rear, engine, odometer.
              </p>
              <div className="space-y-2">
                {form.photos.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-text-light w-6 flex-shrink-0">{i + 1}.</span>
                    <input
                      type="url"
                      value={url}
                      onChange={e => updatePhoto(i, e.target.value)}
                      placeholder={`Photo ${i + 1} URL ${i < 8 ? '(required)' : '(optional)'}`}
                      className={`input flex-1 text-sm ${i < 8 && !url ? 'border-orange-300' : ''}`}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => update('photos', [...form.photos, ''])}
                className="text-sm text-primary font-medium"
              >
                + Add more photos
              </button>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Upload photos to Cloudinary, ImgBB, or Google Drive and paste the direct image URLs here.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Seller Verification</h2>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${(session.user as any)?.nidaVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <Shield className={`w-5 h-5 flex-shrink-0 ${(session.user as any)?.nidaVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${(session.user as any)?.nidaVerified ? 'text-green-800' : 'text-yellow-800'}`}>
                      {(session.user as any)?.nidaVerified ? '✓ NIDA Verified' : 'NIDA Verification Pending'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {(session.user as any)?.nidaVerified ? 'Your identity is verified.' : 'Complete NIDA verification to boost listing trust.'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="label">Ownership Proof URL (logbook / carte rose)</label>
                  <input
                    type="url"
                    value={form.ownershipProof}
                    onChange={e => update('ownershipProof', e.target.value)}
                    placeholder="https://... (upload and paste link)"
                    className="input"
                  />
                  <p className="text-xs text-text-light mt-1">Providing ownership proof increases buyer confidence.</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary-light dark:bg-primary/10 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-white">Also list this car for rent</p>
                    <p className="text-xs text-text-secondary mt-0.5">Earn rental income while you're looking for a buyer</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update('alsoListForRent', !form.alsoListForRent)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.alsoListForRent ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.alsoListForRent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Listing Tier */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Choose Your Listing Tier</h2>
              <div className="space-y-3">
                {TIERS.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => update('listingTier', tier.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${form.listingTier === tier.id ? `${tier.color} bg-primary-light` : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-text-primary dark:text-white">{tier.label}</span>
                      <span className="font-bold text-primary">{tier.price === 0 ? 'Free' : formatRWF(tier.price)}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{tier.desc}</p>
                  </button>
                ))}
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex gap-2">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  Premium listings are featured on the homepage and get WhatsApp enquiries sent immediately when a buyer is interested.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Review & Publish</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Vehicle</span><span className="font-semibold">{form.year} {form.make} {form.model}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Asking Price</span><span className="font-semibold text-primary">{form.askingPrice ? formatRWF(Number(form.askingPrice)) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Condition</span><span className="font-semibold">{form.condition}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">District</span><span className="font-semibold">{RWANDA_DISTRICTS.find(d => d.id === form.district)?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Photos</span><span className="font-semibold">{validPhotos.length} added</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Listing Tier</span><span className="font-semibold capitalize">{form.listingTier.toLowerCase()}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Also rent</span><span className="font-semibold">{form.alsoListForRent ? 'Yes' : 'No'}</span></div>
              </div>
              <p className="text-xs text-text-secondary">
                By publishing, you confirm this is an accurate description and you are the legal owner or authorised to sell this vehicle.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 0 && (!form.make || !form.model || !form.askingPrice || !form.district)) {
                    toast.error('Please fill in all required fields'); return;
                  }
                  if (step === 1 && validPhotos.length < 1) {
                    toast.error('Add at least 1 photo'); return;
                  }
                  setStep(step + 1);
                }}
                className="btn-primary flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
