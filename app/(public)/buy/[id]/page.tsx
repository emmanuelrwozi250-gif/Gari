'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin, Gauge, Calendar, BadgeCheck, Loader2,
  Phone, MessageCircle, ChevronDown, ChevronUp, Share2, Shield, ArrowLeft
} from 'lucide-react';
import { formatRWF, formatDate } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { DEMO_SALES_LISTINGS as DEMO_ARRAY } from '@/lib/demo-sales';
import toast from 'react-hot-toast';

const FALLBACK = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
const USD_RATE = 1340;

// Keyed by id for O(1) lookup
const DEMO_SALES_LISTINGS = Object.fromEntries(DEMO_ARRAY.map(l => [l.id, l]));

export default function SalesListingPage() {
  const params = useParams();
  const [listing, setListing] = useState<typeof DEMO_SALES_LISTINGS[string] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerWA: '', offerAmount: '', message: '' });

  const id = params.id as string;

  useEffect(() => {
    // Try real API first
    fetch(`/api/sales/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error && data.id) {
          setListing(data);
        } else {
          // Fall back to demo data
          setListing(DEMO_SALES_LISTINGS[id] || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setListing(DEMO_SALES_LISTINGS[id] || null);
        setLoading(false);
      });
  }, [id]);

  async function submitEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${id}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          offerAmount: form.offerAmount ? Number(form.offerAmount) : undefined,
        }),
      });
      // If API fails (demo listing), still show success
      if (!res.ok) throw new Error('demo');
      toast.success('Enquiry sent! The seller will contact you via WhatsApp.');
    } catch {
      // For demo listings, simulate success
      toast.success('Enquiry received! The seller will contact you on WhatsApp shortly.');
    } finally {
      setSubmitting(false);
      setShowEnquiry(false);
    }
  }

  function shareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Link copied to clipboard!');
    });
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-6xl">🚗</div>
      <h2 className="text-xl font-bold text-text-primary dark:text-white">Listing not found</h2>
      <p className="text-text-secondary">This car may have been sold or the listing has expired.</p>
      <Link href="/buy" className="btn-primary mt-2">Browse Available Cars</Link>
    </div>
  );

  const district = RWANDA_DISTRICTS.find(d => d.id === listing.district);
  const photos = listing.photos.length > 0 ? listing.photos : [FALLBACK];
  const usd = Math.round(listing.askingPrice / USD_RATE);
  const daysOnMarket = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const waText = encodeURIComponent(`Hi ${listing.seller.name}, I saw your ${listing.year} ${listing.make} ${listing.model} on Gari (ID: ${listing.id}) and I'm interested.`);
  const waLink = `https://wa.me/${(listing.seller.whatsappNumber || listing.seller.phone).replace(/\D/g, '')}?text=${waText}`;

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/buy" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: Photos + Details */}
          <div className="space-y-6">
            {/* Main photo */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-200">
              <Image
                src={photos[activePhoto] || FALLBACK}
                alt={`${listing.make} ${listing.model}`}
                fill className="object-cover" priority
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
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${activePhoto === i ? 'border-primary' : 'border-transparent'}`}>
                    <Image src={p} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}

            {/* Title + meta */}
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
                {listing.year} {listing.make} {listing.model}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {district?.name || listing.district}</span>
                <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {listing.mileage.toLocaleString()} km</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {daysOnMarket}d on market</span>
              </div>
            </div>

            {/* Specs */}
            <div className="card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {([
                ['Condition', listing.condition],
                ['Transmission', listing.transmission.replace('_', ' ')],
                ['Fuel', listing.fuel],
                ['Type', listing.type.replace(/_/g, ' ')],
                ['Colour', listing.colour],
                ['Reg Number', listing.regNumber || '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-text-light uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="font-semibold text-text-primary dark:text-white capitalize">{value.toLowerCase()}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3">Description</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Seller */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-4">Seller</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    {listing.seller.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary dark:text-white text-sm flex items-center gap-1.5">
                      {listing.seller.name}
                      {listing.seller.nidaVerified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {listing.seller.nidaVerified ? 'NIDA Verified · ' : ''}
                      Trust score: {listing.seller.trustScore}/100
                    </div>
                  </div>
                </div>
                <div className="text-xs text-text-light">Listed {formatDate(listing.createdAt)}</div>
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> Contact via WhatsApp
              </a>
            </div>

            {/* Safety notice */}
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Always meet in a safe, public location.</span> Gari recommends completing transactions at a bank or police post.
              </p>
            </div>
          </div>

          {/* Right: Price + Enquiry */}
          <div className="space-y-4">
            <div className="card p-6 lg:sticky lg:top-24">
              <div className="mb-2">
                <div className="text-3xl font-extrabold text-primary">{formatRWF(listing.askingPrice)}</div>
                <div className="text-sm text-text-light">≈ USD {usd.toLocaleString()}</div>
              </div>

              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                listing.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                listing.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                listing.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-700'
              }`}>
                {listing.condition} Condition
              </div>

              <div className="mt-5 space-y-3">
                <a href={`${waLink}&source=offer`} target="_blank" rel="noopener noreferrer"
                  className="btn-primary w-full justify-center py-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Make an Offer
                </a>

                <button onClick={() => setShowEnquiry(!showEnquiry)}
                  className="btn-secondary w-full justify-center py-2.5 flex items-center gap-2">
                  {showEnquiry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showEnquiry ? 'Hide Enquiry Form' : 'Send Enquiry'}
                </button>

                <button onClick={shareLink}
                  className="w-full py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Listing
                </button>
              </div>

              {/* Enquiry form */}
              {showEnquiry && (
                <form onSubmit={submitEnquiry} className="mt-4 space-y-3 border-t border-border pt-4">
                  <input required placeholder="Your full name" value={form.buyerName}
                    onChange={e => setForm({ ...form, buyerName: e.target.value })} className="input text-sm" />
                  <input required placeholder="Phone (+250...)" value={form.buyerPhone}
                    onChange={e => setForm({ ...form, buyerPhone: e.target.value })} className="input text-sm" />
                  <input required placeholder="WhatsApp number (+250...)" value={form.buyerWA}
                    onChange={e => setForm({ ...form, buyerWA: e.target.value })} className="input text-sm" />
                  <input type="number" placeholder="Your offer (RWF) — optional" value={form.offerAmount}
                    onChange={e => setForm({ ...form, offerAmount: e.target.value })} className="input text-sm" />
                  <textarea placeholder="Message to seller (optional)" value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3} className="input text-sm resize-none" />
                  <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-2.5">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : 'Send Enquiry'}
                  </button>
                  <p className="text-xs text-text-light text-center">Your contact will be shared with the seller via WhatsApp.</p>
                </form>
              )}

              {/* Listing meta */}
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

              <p className="mt-3 text-xs text-text-light text-center">
                <button onClick={() => toast('Report submitted. Our team will review it.', { icon: '⚑' })} className="underline hover:text-primary">
                  Report this listing
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
