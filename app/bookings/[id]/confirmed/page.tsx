'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Car, MessageSquare, ArrowRight, Loader2, Clock } from 'lucide-react';
import { formatRWF } from '@/lib/utils';
import { format } from 'date-fns';

interface BookingConfirmation {
  id: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: number;
  platformFee: number;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    photos: string[];
    district: string;
  };
  host: {
    name: string | null;
    phone: string | null;
    whatsappNumber?: string | null;
  };
  instantBooking?: boolean;
}

export default function BookingConfirmedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { router.push('/dashboard'); return; }
        // Normalise: API returns booking.car.host nested — flatten for this page
        setBooking({
          ...data,
          car: {
            id: data.car?.id,
            make: data.car?.make,
            model: data.car?.model,
            year: data.car?.year,
            photos: data.car?.photos || [],
            district: data.car?.district,
          },
          host: {
            name: data.car?.host?.name ?? null,
            phone: data.car?.host?.phone ?? null,
            whatsappNumber: data.car?.host?.whatsappNumber ?? null,
          },
        });
        setLoading(false);
      })
      .catch(() => { router.push('/dashboard'); });
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  const isInstant = booking.status === 'CONFIRMED';
  const pickup = new Date(booking.pickupDate);
  const ret = new Date(booking.returnDate);
  const days = Math.max(1, Math.round((ret.getTime() - pickup.getTime()) / 86400000));
  const photo = booking.car.photos?.[0];
  const hostPhone = booking.host.whatsappNumber || booking.host.phone;
  const waLink = hostPhone
    ? `https://wa.me/${hostPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hi ${booking.host.name || 'there'}, I just booked your ${booking.car.year} ${booking.car.make} ${booking.car.model} on Gari (Booking #${id.slice(-6).toUpperCase()}). Looking forward to it!`
      )}`
    : `https://wa.me/250788123000?text=${encodeURIComponent(`Hi, I need help with booking #${id.slice(-6).toUpperCase()}`)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
            {isInstant ? 'Booking Confirmed!' : 'Request Sent!'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isInstant
              ? 'Your booking is confirmed. The host is expecting you.'
              : 'The host will respond within 1 hour via WhatsApp.'}
          </p>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Booking #{id.slice(-6).toUpperCase()}
          </p>
        </div>

        {/* Car summary card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-4">
          {photo && (
            <div
              className="h-40 bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${photo})` }}
            />
          )}
          <div className="p-5">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
              {booking.car.year} {booking.car.make} {booking.car.model}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>
                  {format(pickup, 'EEE d MMM')} → {format(ret, 'EEE d MMM')}
                  <span className="text-gray-400 ml-1">({days} day{days !== 1 ? 's' : ''})</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="capitalize">{booking.car.district}</span>
              </div>
              {booking.host.name && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Car className="w-4 h-4 flex-shrink-0" />
                  <span>Host: {booking.host.name}</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total paid</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatRWF(booking.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> What happens next?
          </h3>
          <ol className="space-y-3">
            {isInstant ? (
              <>
                <Step n={1} text="Your booking is confirmed. Save this page for reference." done />
                <Step n={2} text="WhatsApp the host to confirm pickup time and location." />
                <Step n={3} text={`On ${format(pickup, 'EEE d MMM')}, meet the host and inspect the car together.`} />
                <Step n={4} text="After your trip, both parties confirm safe return to release the security deposit." />
              </>
            ) : (
              <>
                <Step n={1} text="The host reviews your request (up to 1 hour)." />
                <Step n={2} text="You'll receive a WhatsApp confirmation once the host accepts." />
                <Step n={3} text={`On ${format(pickup, 'EEE d MMM')}, meet the host and inspect the car together.`} />
                <Step n={4} text="After your trip, both parties confirm safe return to release the security deposit." />
              </>
            )}
          </ol>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1ebe5d] transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            WhatsApp {isInstant ? 'Host' : 'Support'}
          </a>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            View My Bookings <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium py-3 rounded-xl hover:border-gray-300 transition-colors text-sm"
          >
            Browse More Cars
          </Link>
        </div>

      </div>
    </div>
  );
}

function Step({ n, text, done }: { n: number; text: string; done?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
        done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-primary/10 text-primary'
      }`}>
        {done ? '✓' : n}
      </span>
      <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{text}</span>
    </li>
  );
}
