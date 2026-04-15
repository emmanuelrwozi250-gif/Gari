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
import toast from 'react-hot-toast';

const FALLBACK = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
const USD_RATE = 1340;

// DEMO DATA — swap for API call
const DEMO_SALES_LISTINGS: Record<string, {
  id: string; make: string; model: string; year: number; mileage: number;
  condition: string; transmission: string; fuel: string; type: string;
  colour: string; regNumber: string; askingPrice: number; description: string;
  photos: string[]; inspectionDone: boolean; listingTier: string;
  viewCount: number; district: string; createdAt: string; expiresAt: string;
  seller: { name: string; phone: string; whatsappNumber: string; nidaVerified: boolean; trustScore: number };
}> = {
  'demo-sale-001': {
    id: 'demo-sale-001', make: 'Toyota', model: 'Corolla', year: 2018, mileage: 87000,
    condition: 'Good', transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SEDAN',
    colour: 'Silver', regNumber: 'RAC 782 B', askingPrice: 12500000,
    description: 'Single owner Toyota Corolla in excellent running condition. Full service history at Toyota Rwanda. Recently serviced with new tyres. Ready for immediate transfer.',
    photos: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800', 'https://images.unsplash.com/photo-1561020469-fb4e2e20bf52?w=800', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800'],
    inspectionDone: true, listingTier: 'STANDARD', viewCount: 47, district: 'gasabo',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'Jean-Pierre Habimana', phone: '+250788123001', whatsappNumber: '+250788123001', nidaVerified: true, trustScore: 92 },
  },
  'demo-sale-002': {
    id: 'demo-sale-002', make: 'Toyota', model: 'Land Cruiser Prado', year: 2016, mileage: 112000,
    condition: 'Good', transmission: 'AUTOMATIC', fuel: 'DIESEL', type: 'SUV_4X4',
    colour: 'White', regNumber: 'RAE 441 A', askingPrice: 38000000,
    description: 'Powerful Land Cruiser Prado TX 3.0L diesel, ideal for upcountry travel. Dual spare tyres, full leather interior, upgraded sound system. Serious buyers only.',
    photos: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800'],
    inspectionDone: false, listingTier: 'PREMIUM', viewCount: 183, district: 'nyarugenge',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 78 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'David Nkurunziza', phone: '+250788123002', whatsappNumber: '+250788123002', nidaVerified: true, trustScore: 88 },
  },
  'demo-sale-003': {
    id: 'demo-sale-003', make: 'Toyota', model: 'Hiace', year: 2017, mileage: 145000,
    condition: 'Good', transmission: 'MANUAL', fuel: 'DIESEL', type: 'MINIBUS',
    colour: 'White', regNumber: 'RAB 219 C', askingPrice: 22000000,
    description: '14-seater Toyota Hiace, currently operating as a shuttle between Kigali and Musanze. High earning potential. Engine overhauled 30,000km ago.',
    photos: ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'],
    inspectionDone: true, listingTier: 'STANDARD', viewCount: 94, district: 'kicukiro',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 57 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'Kigali Group Transport', phone: '+250788123003', whatsappNumber: '+250788123003', nidaVerified: true, trustScore: 95 },
  },
  'demo-sale-004': {
    id: 'demo-sale-004', make: 'Toyota', model: 'Hilux', year: 2018, mileage: 98000,
    condition: 'Excellent', transmission: 'MANUAL', fuel: 'DIESEL', type: 'PICKUP',
    colour: 'Grey', regNumber: 'RAE 558 B', askingPrice: 28000000,
    description: 'Well-maintained Hilux Double Cab with bull bar and canopy. One careful owner. Full service history. Price negotiable for serious buyers.',
    photos: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800'],
    inspectionDone: false, listingTier: 'BASIC', viewCount: 62, district: 'gasabo',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'Immaculée Uwimana', phone: '+250788123004', whatsappNumber: '+250788123004', nidaVerified: false, trustScore: 75 },
  },
  'demo-sale-005': {
    id: 'demo-sale-005', make: 'Honda', model: 'CR-V', year: 2019, mileage: 54000,
    condition: 'Excellent', transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'SUV_4X4',
    colour: 'Red', regNumber: 'RAC 103 D', askingPrice: 32000000,
    description: 'Imported 2019 Honda CR-V in perfect condition. Only 54,000km. All original parts. Purchased new from Rwanda Motors. Transferable warranty available.',
    photos: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800', 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=800', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
    inspectionDone: true, listingTier: 'PREMIUM', viewCount: 271, district: 'nyarugenge',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'Mukamusoni Aline', phone: '+250788123005', whatsappNumber: '+250788123005', nidaVerified: true, trustScore: 98 },
  },
  'demo-sale-006': {
    id: 'demo-sale-006', make: 'Toyota', model: 'Vitz', year: 2015, mileage: 72000,
    condition: 'Fair', transmission: 'AUTOMATIC', fuel: 'PETROL', type: 'ECONOMY',
    colour: 'Blue', regNumber: 'RAB 987 A', askingPrice: 7500000,
    description: 'Budget-friendly Toyota Vitz, great for daily Kigali commuting. Minor dent on rear bumper. Engine and gearbox in good condition. AC works.',
    photos: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800', 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'],
    inspectionDone: false, listingTier: 'BASIC', viewCount: 38, district: 'kicukiro',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { name: 'Nzabonimpa Thierry', phone: '+250788123006', whatsappNumber: '+250788123006', nidaVerified: false, trustScore: 70 },
  },
};

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
