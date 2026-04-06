'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  MapPin, Gauge, Calendar, BadgeCheck, Loader2,
  Phone, MessageCircle, Tag, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatRWF, formatDate } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import toast from 'react-hot-toast';

const FALLBACK = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
const USD_RATE = 1340;

export default function SalesListingPage() {
  const params = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerWA: '', offerAmount: '', message: '' });

  useEffect(() => {
    fetch(`/api/sales/${params.id}`)
      .then(r => r.json())
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${params.id}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          offerAmount: form.offerAmount ? Number(form.offerAmount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Enquiry sent! The seller will contact you via WhatsApp.');
      setShowEnquiry(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send enquiry');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary">
      Listing not found
    </div>
  );

  const district = RWANDA_DISTRICTS.find(d => d.id === listing.district);
  const photos = listing.photos.length > 0 ? listing.photos : [FALLBACK];
  const usd = Math.round(listing.askingPrice / USD_RATE);
  const daysOnMarket = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: Photos + Details */}
          <div className="space-y-6">
            {/* Main photo */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-200">
              <Image
                src={photos[activePhoto] || FALLBACK}
                alt={`${listing.make} ${listing.model}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              {listing.inspectionDone && (
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Gari Inspected
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((p: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${activePhoto === i ? 'border-primary' : 'border-transparent'}`}
                  >
                    <Image src={p} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Title + Price */}
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
                {listing.year} {listing.make} {listing.model}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {district?.name || listing.district}</span>
                <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {listing.mileage.toLocaleString()} km</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {daysOnMarket}d on market</span>
              </div>
            </div>

            {/* Specs */}
            <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Condition', listing.condition],
                ['Transmission', listing.transmission],
                ['Fuel', listing.fuel],
                ['Type', listing.type?.replace(/_/g, ' ')],
                ['Colour', listing.colour],
                ['Reg Number', listing.regNumber || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-text-light uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="font-semibold text-text-primary dark:text-white">{value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3">Description</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Seller */}
            <div className="card p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-text-light uppercase tracking-wide mb-1">Seller</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {listing.seller.name?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white text-sm">{listing.seller.name}</div>
                    <div className="text-xs text-text-secondary">
                      {listing.seller.nidaVerified ? '✓ NIDA Verified · ' : ''}
                      Trust score: {listing.seller.trustScore}/100
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-light">
                Listed {formatDate(listing.createdAt)}
              </div>
            </div>
          </div>

          {/* Right: Price + Enquiry */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-24">
              <div className="mb-1">
                <div className="text-3xl font-extrabold text-primary">{formatRWF(listing.askingPrice)}</div>
                <div className="text-sm text-text-light">≈ USD {usd.toLocaleString()}</div>
              </div>

              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-2 ${
                listing.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                listing.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                listing.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-700'
              }`}>
                {listing.condition} Condition
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setShowEnquiry(!showEnquiry)}
                  className="btn-primary w-full justify-center py-3 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {showEnquiry ? 'Hide Form' : 'Make Offer / Enquire'}
                  {showEnquiry ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </button>

                {listing.seller.phone && (
                  <a
                    href={`https://wa.me/${listing.seller.whatsappNumber?.replace(/\D/g, '') || listing.seller.phone?.replace(/\D/g, '')}?text=Hi, I saw your ${listing.year} ${listing.make} ${listing.model} on Gari`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full justify-center py-2.5 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Contact on WhatsApp
                  </a>
                )}
              </div>

              {/* Enquiry form */}
              {showEnquiry && (
                <form onSubmit={submitEnquiry} className="mt-4 space-y-3 border-t border-border pt-4">
                  <input
                    required
                    placeholder="Your full name"
                    value={form.buyerName}
                    onChange={e => setForm({ ...form, buyerName: e.target.value })}
                    className="input text-sm"
                  />
                  <input
                    required
                    placeholder="Phone (+250...)"
                    value={form.buyerPhone}
                    onChange={e => setForm({ ...form, buyerPhone: e.target.value })}
                    className="input text-sm"
                  />
                  <input
                    required
                    placeholder="WhatsApp number (+250...)"
                    value={form.buyerWA}
                    onChange={e => setForm({ ...form, buyerWA: e.target.value })}
                    className="input text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Your offer (RWF) — optional"
                    value={form.offerAmount}
                    onChange={e => setForm({ ...form, offerAmount: e.target.value })}
                    className="input text-sm"
                  />
                  <textarea
                    placeholder="Message to seller (optional)"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="input text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center py-2.5"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Enquiry'}
                  </button>
                  <p className="text-xs text-text-light text-center">
                    Your contact will be shared with the seller via WhatsApp.
                  </p>
                </form>
              )}

              {/* Listing info */}
              <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-text-light">
                <div className="flex justify-between">
                  <span>Listing tier</span>
                  <span className="font-medium text-text-secondary capitalize">{listing.listingTier.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Views</span>
                  <span className="font-medium text-text-secondary">{listing.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span className="font-medium text-text-secondary">{formatDate(listing.expiresAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
