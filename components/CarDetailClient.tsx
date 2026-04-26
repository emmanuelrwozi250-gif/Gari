'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Star, Users, Zap, Shield, Phone, Navigation,
  Calendar, ChevronLeft, BadgeCheck, Clock, Car, CheckCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { formatRWF, toUSD } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import { RecentlyViewedCars } from './RecentlyViewedCars';
import { COMPANY } from '@/lib/config/company';

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';
const PLATFORM_FEE_RATE = 0.10;

export type ReviewDisplay = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  isRevealed?: boolean;
};

export type CarDisplay = {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  pricePerDay: number;
  district: string;
  seats: number;
  transmission: string;
  drivingOption: string;
  images: string[];
  hostName: string;
  hostAvatar: string;
  hostVerified: boolean;
  hostMemberSince: string;
  hostResponseRate: string;
  rating: number;
  tripCount: number;
  reviewCount: number;
  features: string[];
  description: string;
  fuel: string;
  available: boolean;
  depositAmount: number;
  instantBooking: boolean;
  driverPricePerDay: number;
  reviews: ReviewDisplay[];
  completedBookingId?: string | null;
  existingBookingId?: string | null;
  hostSuperhostSince?: string | null;
};

// Generate 8 "unavailable" future dates for realism
function getUnavailableDates(carId: string): string[] {
  const seed = carId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const offset = ((seed * (i + 7)) % 28) + 2;
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    dates.push(d.toISOString().split('T')[0]);
  }
  return Array.from(new Set(dates));
}

function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function VerificationSection({ isVerified }: { isVerified: boolean }) {
  const [open, setOpen] = useState(true);

  const checks = [
    { label: 'Logbook verified', done: isVerified },
    { label: 'Insurance valid until Dec 2026', done: isVerified },
    { label: 'Physically inspected by Gari', done: isVerified },
    { label: 'Owner NIDA verified', done: isVerified },
    { label: 'Photos verified', done: isVerified },
  ];

  return (
    <div className={`card p-5 ${isVerified ? 'border border-primary/30' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <BadgeCheck className={`w-5 h-5 ${isVerified ? 'text-primary' : 'text-text-light'}`} />
          <span className="font-bold text-text-primary dark:text-white">
            {isVerified ? 'Verified Listing' : 'Verification Pending'}
          </span>
          {isVerified && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Gari Verified</span>
          )}
        </div>
        <span className="text-text-light text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-2.5">
          {checks.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <CheckCircle className={`w-4 h-4 flex-shrink-0 ${done ? 'text-primary' : 'text-text-light/40'}`} />
              <span className={done ? 'text-text-secondary dark:text-gray-300' : 'text-text-light line-through'}>
                {label}
              </span>
            </div>
          ))}
          {isVerified && (
            <p className="text-xs text-text-light mt-3 pt-3 border-t border-border">
              Last verified {new Date().toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StarRow({ value, interactive, onSet, onHover }: {
  value: number; interactive?: boolean;
  onSet?: (v: number) => void; onHover?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onSet?.(s)}
          onMouseEnter={() => onHover?.(s)}
          onMouseLeave={() => onHover?.(0)}
          className={`${interactive ? 'cursor-pointer p-0.5' : 'cursor-default p-0'}`}
        >
          <Star className={`${interactive ? 'w-6 h-6' : 'w-3 h-3'} transition-colors ${
            s <= value ? 'fill-accent-yellow text-accent-yellow' : 'text-text-light/30'
          }`} />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ reviews, completedBookingId }: {
  reviews: ReviewDisplay[];
  completedBookingId?: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);

  // Only count revealed reviews in the aggregate
  const visibleReviews = reviews.filter(r => r.isRevealed !== false);
  const avgRating = visibleReviews.length > 0
    ? visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length
    : 0;

  async function submitReview() {
    if (!completedBookingId || rating === 0 || comment.length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: completedBookingId, rating, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit review');
      setSubmitted(true);
      setPendingReveal(json.pendingReveal === true);
      toast.success(json.pendingReveal ? 'Review saved — waiting for host to review too.' : 'Review submitted! Thank you.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-text-primary dark:text-white">
          Reviews {visibleReviews.length > 0 && `(${visibleReviews.length})`}
        </h2>
        {visibleReviews.length > 0 && (
          <div className="flex items-center gap-1 text-accent-yellow font-bold text-sm">
            <Star className="w-4 h-4 fill-accent-yellow" />
            {avgRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Empty state */}
      {visibleReviews.length === 0 && (
        <div className="text-center py-6">
          <Star className="w-8 h-8 text-text-light/30 mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No reviews yet — be the first</p>
          <p className="text-xs text-text-light mt-1">Reviews come from verified renters after a completed trip.</p>
        </div>
      )}

      {/* Reviews list — only show revealed ones */}
      {visibleReviews.length > 0 && (
        <div className="space-y-5 mb-4">
          {visibleReviews.map(r => (
            <div key={r.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                {r.reviewerName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-text-primary dark:text-white">{r.reviewerName}</span>
                  <span className="text-xs text-text-light">
                    {new Date(r.createdAt).toLocaleDateString('en-RW', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <StarRow value={r.rating} />
                <p className="text-sm text-text-secondary leading-relaxed mt-1.5">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a review */}
      {completedBookingId && !submitted && (
        <div className={`${reviews.length > 0 ? 'border-t border-border pt-4' : ''}`}>
          <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-3">Write a Review</h3>
          <StarRow value={hoverRating || rating} interactive onSet={setRating} onHover={setHoverRating} />
          {rating > 0 && (
            <p className="text-xs text-text-light mt-1 mb-3">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
            </p>
          )}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (min. 10 characters)…"
            rows={3}
            className="input text-sm resize-none w-full mt-3 mb-3"
          />
          <button
            onClick={submitReview}
            disabled={submitting || rating === 0 || comment.length < 10}
            className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
          >
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />Submitting…</>
              : 'Submit Review'}
          </button>
        </div>
      )}

      {submitted && (
        <div className={`${visibleReviews.length > 0 ? 'border-t border-border pt-4' : ''} text-center`}>
          <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-text-primary dark:text-white">
            {pendingReveal ? 'Review saved!' : 'Review published!'}
          </p>
          {pendingReveal && (
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              ⏳ Your review is hidden until the host also submits theirs, or after 14 days — whichever comes first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarBlock({ unavailable }: { unavailable: string[] }) {
  const today = new Date();
  const month = today.toLocaleString('en', { month: 'long', year: 'numeric' });
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div className="font-semibold text-sm text-text-primary dark:text-white mb-2">{month}</div>
      <div className="grid grid-cols-7 gap-0.5 text-xs text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-text-light py-1 font-medium">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast = day < today.getDate();
          const isUnavail = unavailable.includes(dateStr);
          return (
            <div key={i} className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isPast ? 'text-text-light/40 cursor-not-allowed' :
              isUnavail ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' :
              'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
            }`}>
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/10 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Unavailable</span>
      </div>
    </div>
  );
}

export function CarDetailClient({ car, completedBookingId, existingBookingId }: { car: CarDisplay; completedBookingId?: string | null; existingBookingId?: string | null }) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [pickup, setPickup] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [withDriver, setWithDriver] = useState(false);
  const [booking, setBooking] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [guaranteeOpen, setGuaranteeOpen] = useState(true);
  const [withInsurance, setWithInsurance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'>('MTN_MOMO');

  const today = new Date().toISOString().split('T')[0];

  // Use `data` alias for compatibility with all the UI references below
  const data = car;

  const photos = data.images.length > 0 ? data.images : [FALLBACK];
  const district = RWANDA_DISTRICTS.find(d => d.id === data.district);
  const unavailable = getUnavailableDates(data.id);
  const days = daysBetween(pickup, returnDate);
  const subtotal = data.pricePerDay * Math.max(days, 1);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const insuranceFee = withInsurance ? 5000 * Math.max(days, 1) : 0;
  const total = subtotal + platformFee + insuranceFee;
  const depositAmount = data.depositAmount ?? 0;
  const grandTotal = total + depositAmount;
  const similar = DEMO_RENTAL_CARS.filter(c => c.id !== data.id && (c.type === data.type || c.district === data.district)).slice(0, 3);

  function requestBooking() {
    if (!pickup || !returnDate) { toast.error('Please select pick-up and return dates'); return; }
    if (!pickupLocation) { toast.error('Please select a pickup location'); return; }
    const driverFee = withDriver ? data.driverPricePerDay * days : 0;
    const params = new URLSearchParams({
      carId: data.id,
      pickupDate: pickup,
      returnDate,
      withDriver: String(withDriver),
      pickupLocation,
      totalDays: String(days),
      subtotal: String(subtotal),
      platformFee: String(platformFee),
      driverFee: String(driverFee),
      totalAmount: String(total),
      depositAmount: String(depositAmount),
      paymentMethod,
    });
    router.push(`/bookings/new?${params.toString()}`);
  }

  const waLink = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in the ${data.year} ${data.make} ${data.model} listed on Gari (ID: ${data.id})`)}`;


  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to search
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Gallery */}
            <div className="space-y-2">
              <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-200">
                <Image src={photos[activePhoto] || FALLBACK} alt={`${data.make} ${data.model}`}
                  fill className="object-cover" priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 800px"
                  onError={(e) => { e.currentTarget.src = '/images/car-placeholder.svg'; }} />
                {data.hostVerified && (
                  <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Listing
                  </div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.slice(0, 4).map((p, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)}
                      className={`relative w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${activePhoto === i ? 'border-primary' : 'border-transparent'}`}>
                      <Image src={p} alt="" fill className="object-cover" sizes="80px"
                        onError={(e) => { e.currentTarget.src = '/images/car-placeholder.svg'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & meta */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">{data.type}</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${data.drivingOption === 'Self-Drive' ? 'bg-blue-100 text-blue-700' : data.drivingOption === 'With Driver' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                  {data.drivingOption}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${data.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {data.available ? '✓ Available' : 'Unavailable'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
                {data.year} {data.make} {data.model}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {district?.name || data.district}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {data.seats} seats</span>
                <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {data.transmission}</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {data.fuel}</span>
                {data.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-accent-yellow font-semibold">
                    <Star className="w-3.5 h-3.5 fill-accent-yellow" /> {data.rating.toFixed(1)}
                    <span className="text-text-secondary font-normal ml-1">
                      ({data.tripCount} trips · {data.reviewCount} reviews)
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3">About this car</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{data.description}</p>
            </div>

            {/* Features */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-4">Features & Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification */}
            <VerificationSection isVerified={data.hostVerified} />

            {/* Availability calendar */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-4">Availability</h2>
              <CalendarBlock unavailable={unavailable} />
              <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4 text-primary" />
                Usually responds within 1 hour
              </div>
            </div>

            {/* Host card */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-4">Your Host</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-primary/20">
                  {data.hostAvatar ? (
                    <Image src={data.hostAvatar} alt={data.hostName}
                      fill className="object-cover" sizes="56px" quality={80} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                      {data.hostName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-primary dark:text-white">{data.hostName}</span>
                    {data.hostVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                    {data.hostSuperhostSince && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                        ⭐ Superhost
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Member since {data.hostMemberSince} · {data.hostResponseRate} response rate
                  </div>
                </div>
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full border border-primary text-primary font-semibold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4" /> Message on WhatsApp
              </a>
              {existingBookingId && (
                <Link href={`/messages?booking=${existingBookingId}`}
                  className="mt-2 flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-700 text-text-secondary font-medium py-2 rounded-xl hover:border-primary/50 hover:text-primary transition-colors text-xs">
                  💬 Message via Gari App
                </Link>
              )}
            </div>

            {/* Reviews */}
            <ReviewsSection
              reviews={car.reviews ?? []}
              completedBookingId={completedBookingId}
            />

            {/* Safety notice */}
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Safety tip:</span> Always meet in a safe, public location. Gari recommends completing vehicle handover at a bank or police post.
              </p>
            </div>
          </div>

          {/* Right column — Booking sidebar */}
          <div className="lg:sticky lg:top-24 space-y-4 h-fit">
            <div className="card p-6">
              {/* Price header */}
              <div className="flex items-baseline gap-2 mb-5">
                <div className="text-3xl font-extrabold text-primary">{formatRWF(data.pricePerDay)}</div>
                <div className="text-sm text-text-secondary">/ day</div>
                <div className="text-xs text-text-light ml-1">{toUSD(data.pricePerDay)}</div>
              </div>

              <div className="space-y-3 mb-4">
                {/* Dates side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />Pick-up
                    </label>
                    <input type="date" min={today} value={pickup}
                      onChange={e => {
                        setPickup(e.target.value);
                        if (returnDate && e.target.value >= returnDate) setReturnDate('');
                      }}
                      className="input text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />Return
                    </label>
                    <input type="date" min={pickup || today} value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="input text-sm w-full" />
                  </div>
                </div>

                {/* Human-readable date summary */}
                {pickup && returnDate && (
                  <p className="text-xs text-primary font-medium text-center">
                    {new Date(pickup).toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' })} →{' '}
                    {new Date(returnDate).toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                    <span className="text-text-secondary">({days} day{days !== 1 ? 's' : ''})</span>
                  </p>
                )}

                {/* Pickup location chips */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />Pickup Location
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['Kigali Airport (KIA)', 'Convention Centre', 'Nyamirambo', 'Kimironko'].map(loc => (
                      <button key={loc} type="button"
                        onClick={() => { setPickupLocation(loc); setShowCustomInput(false); setCustomLocation(''); }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          pickupLocation === loc
                            ? 'bg-primary text-white border-primary'
                            : 'border-border text-text-secondary hover:border-primary'
                        }`}>
                        {loc}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => { setShowCustomInput(true); setPickupLocation(''); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        showCustomInput ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary'
                      }`}>
                      Custom…
                    </button>
                  </div>
                  {showCustomInput && (
                    <input
                      type="text"
                      value={customLocation}
                      onChange={e => { setCustomLocation(e.target.value); setPickupLocation(e.target.value); }}
                      placeholder="Street, neighbourhood, or landmark"
                      className="input text-sm w-full"
                      autoFocus
                    />
                  )}
                </div>

                {/* Drive option */}
                {data.drivingOption !== 'Self-Drive' && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">Drive Option</label>
                    <div className="grid grid-cols-2 gap-2">
                      {data.drivingOption === 'Both' && (
                        <button onClick={() => setWithDriver(false)}
                          className={`py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${!withDriver ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                          Self-Drive
                        </button>
                      )}
                      <button onClick={() => setWithDriver(true)}
                        className={`py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${data.drivingOption === 'Both' ? '' : 'col-span-2'} ${withDriver || data.drivingOption === 'With Driver' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary'}`}>
                        With Driver
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gari Protect insurance upsell */}
              <div className="flex items-start justify-between gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    Gari Protect
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Comprehensive cover up to RWF 2,000,000 · +RWF 5,000/day</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithInsurance(i => !i)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${withInsurance ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                  aria-label="Toggle Gari Protect"
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${withInsurance ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Price breakdown */}
              {pickup && returnDate ? (
                <div className="bg-gray-bg dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>{formatRWF(data.pricePerDay)} × {days} day{days !== 1 ? 's' : ''}</span>
                    <span>{formatRWF(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Service fee (10%)</span>
                    <span>{formatRWF(platformFee)}</span>
                  </div>
                  {withInsurance && (
                    <div className="flex justify-between text-primary font-medium">
                      <span>Gari Protect</span>
                      <span>{formatRWF(insuranceFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-border pt-2 mt-2">
                    <span>{depositAmount > 0 ? 'Rental total' : 'Total'}</span>
                    <div className="text-right">
                      <span className="text-primary">{formatRWF(total)}</span>
                      {depositAmount === 0 && <span className="block text-xs text-text-light font-normal">{toUSD(total)}</span>}
                    </div>
                  </div>
                  {depositAmount > 0 && (
                    <>
                      <div className="flex justify-between text-text-secondary text-xs">
                        <span>Security deposit <span className="text-green-600 font-medium">(refundable)</span></span>
                        <span>{formatRWF(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-text-primary dark:text-white border-t border-border pt-2 mt-1">
                        <span>Total due today</span>
                        <div className="text-right">
                          <span className="text-primary">{formatRWF(grandTotal)}</span>
                          <span className="block text-xs text-text-light font-normal">{toUSD(grandTotal)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-gray-bg dark:bg-gray-800 rounded-xl p-3 mb-4 text-center text-xs text-text-light">
                  Select dates to see total price
                </div>
              )}

              {/* Payment method — mobile money first */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide block mb-2">Pay with</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'MTN_MOMO', label: 'MTN MoMo', color: 'bg-yellow-400', text: 'text-yellow-900' },
                    { id: 'AIRTEL_MONEY', label: 'Airtel', color: 'bg-red-500', text: 'text-white' },
                    { id: 'CARD', label: 'Card', color: 'bg-gray-700', text: 'text-white' },
                  ] as const).map(({ id, label, color, text }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        paymentMethod === id
                          ? `${color} ${text} border-transparent shadow-sm`
                          : 'bg-transparent border-border text-text-secondary hover:border-primary/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={requestBooking} disabled={booking || !pickup || !returnDate}
                className="btn-primary w-full justify-center py-3 text-base font-bold disabled:opacity-60">
                {booking ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Sending...</>
                ) : pickup && returnDate ? (
                  data.instantBooking
                    ? `Reserve now — ${formatRWF(grandTotal)}`
                    : `Request booking — ${formatRWF(grandTotal)}`
                ) : (
                  'Select dates to book'
                )}
              </button>

              {pickup && (() => {
                const deadline = new Date(new Date(pickup).getTime() - 86400000);
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-text-light text-center">
                      Free cancellation before{' '}
                      <strong className="text-text-secondary">
                        {deadline.toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                        {deadline.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                      . 50% refund after that.
                    </p>
                    <p className="text-xs text-text-light text-center">
                      Late returns: RWF 5,000/hr after 30-min grace ·{' '}
                      <a href="/policy" className="text-primary hover:underline">View full policy →</a>
                    </p>
                  </div>
                );
              })()}

              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-colors">
                <Navigation className="w-4 h-4" /> Message Host
              </a>
            </div>

            {/* Gari Guarantee */}
            <div className="card p-4 border-primary/20">
              <button
                type="button"
                onClick={() => setGuaranteeOpen(o => !o)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-sm text-text-primary dark:text-white">
                  <Shield className="w-4 h-4 text-primary" />
                  🔒 Gari Guarantee
                </div>
                <span className="text-text-light text-xs">{guaranteeOpen ? '▲' : '▼'}</span>
              </button>
              {guaranteeOpen && (
                <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Payment held securely until trip completes</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Full refund if host cancels</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> 24/7 WhatsApp support: +250 788 123 000</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> RWF 50,000 damage deposit — returned within 48h</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> Insurance included on all Gari bookings</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Similar Cars */}
        {similar.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-text-primary dark:text-white">Similar Cars</h2>
              <Link href="/search" className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map(c => (
                <Link key={c.id} href={`/cars/${c.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group block">
                  <div className="relative h-40 overflow-hidden">
                    <Image src={c.images[0] || FALLBACK} alt={`${c.make} ${c.model}`} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 300px"
                      quality={60}
                      onError={(e) => { e.currentTarget.src = '/images/car-placeholder.svg'; }} />
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-text-primary dark:text-white text-sm">{c.year} {c.make} {c.model}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold">{formatRWF(c.pricePerDay)}<span className="text-text-light font-normal text-xs">/day</span></span>
                      <span className="flex items-center gap-0.5 text-xs text-accent-yellow font-semibold">
                        <Star className="w-3.5 h-3.5 fill-accent-yellow" /> {c.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewedCars
          currentCar={{
            id: data.id,
            make: data.make,
            model: data.model,
            year: data.year,
            pricePerDay: data.pricePerDay,
            type: data.type,
            district: data.district,
            photos: data.images,
            rating: data.rating,
          }}
        />
      </div>
    </div>
  );
}
