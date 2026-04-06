'use client';

import { TrendingUp, Car, Calendar, Percent, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { formatRWF, formatDate } from '@/lib/utils';

interface CarEarnings {
  id: string;
  make: string;
  model: string;
  year: number;
  source: 'OWNER' | 'GARI_SOURCED';
  vehicleValueRwf: number;
  pricePerDay: number;
  totalTrips: number;
  monthEarnings: number;
  yearEarnings: number;
  utilisation: number;
  nextBooking: { pickupDate: string; returnDate: string } | null;
  completedBookings: number;
}

interface Props {
  cars: CarEarnings[];
}

export function EarningsDashboard({ cars }: Props) {
  if (cars.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Car className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-text-primary dark:text-white mb-1">No cars listed yet</p>
        <p className="text-sm text-text-secondary mb-4">List your first car to start earning</p>
        <Link href="/host/new" className="btn-primary text-sm">List a Car</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cars.map(car => {
        const paybackPct = car.source === 'GARI_SOURCED' && car.vehicleValueRwf > 0
          ? Math.min(100, Math.round((car.yearEarnings / car.vehicleValueRwf) * 100))
          : null;

        return (
          <div key={car.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-primary dark:text-white">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">{formatRWF(car.pricePerDay)}/day · {car.totalTrips} total trips</p>
              </div>
              <Link href={`/cars/${car.id}`} className="text-xs text-primary hover:underline">View listing →</Link>
            </div>

            {/* Earnings grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-primary-light dark:bg-primary/10 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-primary">{formatRWF(car.monthEarnings)}</div>
                <div className="text-xs text-text-secondary mt-0.5">This month</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-text-primary dark:text-white">{formatRWF(car.yearEarnings)}</div>
                <div className="text-xs text-text-secondary mt-0.5">This year</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-text-primary dark:text-white">{car.utilisation}%</div>
                <div className="text-xs text-text-secondary mt-0.5">Utilisation</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-text-primary dark:text-white">{car.completedBookings}</div>
                <div className="text-xs text-text-secondary mt-0.5">Bookings</div>
              </div>
            </div>

            {/* Next booking */}
            {car.nextBooking && (
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Next booking: <strong className="text-text-primary dark:text-white">
                  {formatDate(car.nextBooking.pickupDate)} – {formatDate(car.nextBooking.returnDate)}
                </strong></span>
              </div>
            )}

            {/* Payback progress (Buy & Earn cars only) */}
            {paybackPct !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Payback progress</span>
                  <span className="font-semibold text-primary">{paybackPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${paybackPct}%` }}
                  />
                </div>
                {paybackPct < 100 && car.monthEarnings > 0 && (
                  <p className="text-xs text-text-light mt-1">
                    Est. payback: {new Date(Date.now() + ((100 - paybackPct) / 100 * car.vehicleValueRwf / car.monthEarnings) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-RW', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href={`/api/bookings?carId=${car.id}`} className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <FileText className="w-3.5 h-3.5" /> Inspection Reports
              </Link>
              <Link href={`/dashboard/host`} className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <Settings className="w-3.5 h-3.5" /> Adjust Pricing
              </Link>
              <Link href={`/api/bookings/${car.id}/certificate`} className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <TrendingUp className="w-3.5 h-3.5" /> View Insurance
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
