'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Star, Users, Zap, Shield, Phone, Navigation,
  Calendar, ChevronLeft, BadgeCheck, Clock, Car, CheckCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_RENTAL_CARS, type DemoRentalCar } from '@/lib/demo-data';
import { formatRWF, toUSD } from '@/lib/utils';
import { RWANDA_DISTRICTS } from '@/lib/districts';

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';
const PLATFORM_FEE_RATE = 0.10;

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

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [car, setCar] = useState<DemoRentalCar | null>(null);
  const [dbCar, setDbCar] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Try DB first
    fetch(`/api/cars/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) {
          setDbCar(data);
        } else {
          // Fall back to demo data
          const found = DEMO_RENTAL_CARS.find(c => c.id === id);
          setCar(found || null);
        }
        setLoading(false);
      })
      .catch(() => {
        const found = DEMO_RENTAL_CARS.find(c => c.id === id);
        setCar(found || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Normalise data from DB car or demo car
  const data = dbCar ? {
    id: String(dbCar.id || id),
    make: String(dbCar.make || ''),
    model: String(dbCar.model || ''),
    year: Number(dbCar.year || 0),
    type: String(dbCar.type || ''),
    pricePerDay: Number(dbCar.pricePerDay || 0),
    district: String(dbCar.district || ''),
    seats: Number(dbCar.seats || 5),
    transmission: String((dbCar.transmission as string) || 'Auto'),
    drivingOption: (dbCar.driverAvailable ? 'Both' : 'Self-Drive') as string,
    images: (dbCar.photos as string[]) || [],
    hostName: String((dbCar.host as Record<string, unknown>)?.name || ''),
    hostAvatar: String((dbCar.host as Record<string, unknown>)?.avatar || ''),
    hostVerified: Boolean(dbCar.isVerified),
    hostMemberSince: 'January 2025',
    hostResponseRate: '95%',
    rating: Number(dbCar.rating || 4.5),
    // BUG-05: separate completed trips from written reviews
    tripCount: Number(dbCar.totalTrips || 0),
    reviewCount: Array.isArray(dbCar.reviews) ? (dbCar.reviews as unknown[]).length : 0,
    features: ['Air Conditioning', 'USB Charging'],
    description: String(dbCar.description || 'Well-maintained vehicle available for rental.'),
    fuel: String(dbCar.fuel || 'Petrol'),
    available: Boolean(dbCar.isAvailable),
    depositAmount: Number(dbCar.depositAmount || 0),
    instantBooking: Boolean(dbCar.instantBooking),
    driverPricePerDay: Number(dbCar.driverPricePerDay || 0),
  } : car;

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Car className="w-12 h-12 text-text-light" />
      <p className="text-text-secondary">Car not found</p>
      <Link href="/search" className="btn-primary">Browse Cars</Link>
    </div>
  );

  const photos = data.images.length > 0 ? data.images : [FALLBACK];
  const district = RWANDA_DISTRICTS.find(d => d.id === data.district);
  const unavailable = getUnavailableDates(data.id);
  const days = daysBetween(pickup, returnDate);
  const subtotal = data.pricePerDay * Math.max(days, 1);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const insuranceFee = withInsurance ? 5000 * Math.max(days, 1) : 0;
  const total = subtotal + platformFee + insuranceFee;
  const depositAmount = (data as any).depositAmount ?? 0;
  const grandTotal = total + depositAmount;
  const similar = DEMO_RENTAL_CARS.filter(c => c.id !== data.id && (c.type === data.type || c.district === data.district)).slice(0, 3);

  async function requestBooking() {
    if (!pickup || !returnDate) { toast.error('Please select pick-up and return dates'); return; }
    if (!pickupLocation) { toast.error('Please select a pickup location'); return; }
    setBooking(true);
    try {
      const driverFee = withDriver ? (data as any).driverPricePerDay * days : 0;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: data!.id,
          pickupDate: pickup,
          returnDate,
          withDriver,
          pickupLocation,
          totalDays: days,
          subtotal,
          platformFee,
          driverFee: driverFee || 0,
          totalAmount: total,
          paymentMethod: 'MTN_MOMO',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create booking');
      toast.success('Booking request sent! The host will confirm via WhatsApp within 1 hour.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  }

  const waLink = `https://wa.me/250788123000?text=Hi%2C%20I%27m%20interested%20in%20the%20${encodeURIComponent(`${data.year} ${data.make} ${data.model}`)}%20listed%20on%20Gari%20(ID%3A%20${data.id})`;

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
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 800px" />
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
                      <Image src={p} alt="" fill className="object-cover" sizes="80px" />
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
                      {/* BUG-05: show trips completed separately from written reviews */}
                      {(data as Record<string, unknown>).tripCount != null
                        ? `(${(data as Record<string, unknown>).tripCount} trips · ${data.reviewCount} reviews)`
                        : `(${data.reviewCount} reviews)`}
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
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={data.hostAvatar || 'https://i.pravatar.cc/60?img=11'} alt={data.hostName}
                    fill className="object-cover" sizes="56px" quality={80} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary dark:text-white">{data.hostName}</span>
                    {data.hostVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
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
            </div>

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

              {/* MONEY-01: Gari Protect insurance upsell */}
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

              <button onClick={requestBooking} disabled={booking || !pickup || !returnDate}
                className="btn-primary w-full justify-center py-3 text-base font-bold disabled:opacity-60">
                {booking ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Sending...</>
                ) : pickup && returnDate ? (
                  (data as any).instantBooking
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
                  <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" /> 24/7 WhatsApp support: +250 788 000 000</li>
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
                    <Image src={c.images[0] || FALLBACK} alt={`${c.make} ${c.model}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 300px" quality={60} />
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
      </div>
    </div>
  );
}
