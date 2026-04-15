'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, CreditCard, Phone, Shield } from 'lucide-react';
import { formatRWF, calculateDays, calculateBookingFees } from '@/lib/utils';
import { LocationSelector } from './LocationSelector';
import { PricingWidget } from './PricingWidget';
import toast from 'react-hot-toast';

interface BookingCardProps {
  car: {
    id: string;
    pricePerDay: number;
    depositAmount?: number;
    driverAvailable: boolean;
    driverPricePerDay?: number | null;
    instantBooking?: boolean;
    isAvailable: boolean;
  };
}

export function BookingCard({ car }: BookingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const [pickupDate, setPickupDate] = useState(today);
  const [returnDate, setReturnDate] = useState(tomorrow);
  const [withDriver, setWithDriver] = useState(false);
  const [pickupDistrict, setPickupDistrict] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'>('MTN_MOMO');
  const [loading, setLoading] = useState(false);
  const [dynamicFees, setDynamicFees] = useState<{
    subtotal: number; driverFee: number; platformFee: number; totalAmount: number; totalDays: number;
  } | null>(null);

  const totalDays = calculateDays(pickupDate, returnDate);
  const staticFees = calculateBookingFees(
    car.pricePerDay,
    totalDays,
    car.driverPricePerDay || 0,
    withDriver
  );
  const fees = dynamicFees || staticFees;

  const handleBook = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/cars/${car.id}`);
      return;
    }
    if (!pickupDistrict) {
      toast.error('Please select a pickup location');
      return;
    }
    if (!car.isAvailable) {
      toast.error('This car is not currently available');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          pickupDate,
          returnDate,
          withDriver: withDriver && car.driverAvailable,
          pickupLocation: pickupLocation || pickupDistrict,
          paymentMethod,
          totalDays,
          ...fees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      toast.success('Booking created! Redirecting to payment...');
      router.push(`/book/${car.id}?bookingId=${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sticky top-24">
      {/* Price header */}
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-extrabold text-primary">{formatRWF(car.pricePerDay)}</span>
        <span className="text-text-secondary">/day</span>
        {car.driverAvailable && car.driverPricePerDay && (
          <span className="text-xs text-text-light ml-1">+ {formatRWF(car.driverPricePerDay)} driver</span>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="label text-xs">Pick-up</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light" />
            <input type="date" value={pickupDate} min={today}
              onChange={e => {
                setPickupDate(e.target.value);
                if (e.target.value >= returnDate) {
                  setReturnDate(format(new Date(new Date(e.target.value).getTime() + 86400000), 'yyyy-MM-dd'));
                }
              }}
              className="input pl-9 text-sm py-2" />
          </div>
        </div>
        <div>
          <label className="label text-xs">Return</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light" />
            <input type="date" value={returnDate} min={pickupDate}
              onChange={e => setReturnDate(e.target.value)}
              className="input pl-9 text-sm py-2" />
          </div>
        </div>
      </div>

      {/* Pickup location */}
      <div className="mb-3">
        <LocationSelector
          value={pickupDistrict}
          onChange={(districtId, name) => {
            setPickupDistrict(districtId);
            if (name) setPickupLocation(name);
          }}
          label="Pickup Location"
          placeholder="Select district"
          required
        />
      </div>

      {/* Driver toggle */}
      {car.driverAvailable && (
        <div className="flex items-center justify-between p-3 bg-primary-light dark:bg-primary/10 rounded-xl mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium text-text-primary dark:text-gray-200">Add a Driver</span>
            <span className="text-text-light text-xs">+{formatRWF(car.driverPricePerDay || 0)}/day</span>
          </div>
          <button
            type="button"
            onClick={() => setWithDriver(!withDriver)}
            className={`relative w-11 h-6 rounded-full transition-colors ${withDriver ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${withDriver ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      )}

      {/* Price breakdown — live dynamic pricing */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-1 text-sm">
        <PricingWidget
          carId={car.id}
          pickupDate={pickupDate}
          returnDate={returnDate}
          withDriver={withDriver && !!car.driverAvailable}
          onPriceLoaded={d => setDynamicFees({
            subtotal: d.subtotal,
            driverFee: d.driverFee,
            platformFee: d.platformFee,
            totalAmount: d.totalAmount,
            totalDays: d.totalDays,
          })}
        />
        {(car.depositAmount ?? 0) > 0 && (
          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-border">
            <span className="text-text-secondary flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Security Deposit
            </span>
            <span className="font-medium text-text-primary dark:text-white">{formatRWF(car.depositAmount!)}</span>
          </div>
        )}
      </div>
      {(car.depositAmount ?? 0) > 0 && (
        <p className="text-xs text-text-light mb-4 mt-1">
          🔒 Deposit held by Gari. Refunded within 24h after car is returned in good condition.
        </p>
      )}

      {/* Payment method */}
      <div className="mb-4">
        <label className="label text-xs">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'MTN_MOMO', label: 'MTN MoMo', emoji: '📱' },
            { value: 'AIRTEL_MONEY', label: 'Airtel', emoji: '📲' },
            { value: 'CARD', label: 'Card', emoji: '💳' },
          ].map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-colors ${
                paymentMethod === value
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border text-text-secondary hover:border-primary/50'
              }`}
            >
              <span className="text-base">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Book button */}
      <button
        onClick={handleBook}
        disabled={loading || !car.isAvailable}
        className="btn-primary w-full justify-center text-base py-3"
      >
        {loading ? 'Processing...' :
          !car.isAvailable ? 'Not Available' :
          car.instantBooking ? 'Book Instantly' : 'Request to Book'
        }
      </button>

      {/* Free cancellation note */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-light">
        <Shield className="w-3.5 h-3.5 text-primary" />
        Free cancellation up to 24h before pickup
      </div>
    </div>
  );
}
