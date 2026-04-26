'use client';

import { TrendingUp, Car, Calendar, Percent, Lightbulb, Banknote, ArrowRight, Zap } from 'lucide-react';
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
  completedBookings: number;
  deadDaysThisMonth?: number;
  daysLeftThisMonth?: number;
  projectedAnnual?: number;
  nextBooking: { pickupDate: string; returnDate: string } | null;
}

interface Props {
  cars: CarEarnings[];
}

function deadDayNudge(car: CarEarnings): { message: string; action: string; href: string } | null {
  const dead = car.deadDaysThisMonth ?? 0;
  const left = car.daysLeftThisMonth ?? 0;
  if (dead <= 0 || left <= 0) return null;

  const deadPct = Math.round((dead / left) * 100);

  if (deadPct >= 80) {
    return {
      message: `${dead} of ${left} remaining days this month are unbooked.`,
      action: `Lower price by 15% to attract bookings`,
      href: `/host/cars/${car.id}/edit`,
    };
  }
  if (deadPct >= 50) {
    return {
      message: `${dead} unbooked days left this month.`,
      action: `Enable Instant Booking to reduce friction`,
      href: `/host/cars/${car.id}/edit`,
    };
  }
  if (dead >= 3 && !car.nextBooking) {
    return {
      message: `No upcoming bookings scheduled.`,
      action: `Share your listing to boost visibility`,
      href: `/cars/${car.id}`,
    };
  }
  return null;
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

  // Aggregate smart nudges across all cars
  const totalDeadDays = cars.reduce((s, c) => s + (c.deadDaysThisMonth ?? 0), 0);
  const totalProjected = cars.reduce((s, c) => s + (c.projectedAnnual ?? 0), 0);
  const lowUtilCars = cars.filter(c => c.utilisation < 40);

  return (
    <div className="space-y-5">

      {/* Smart nudges summary */}
      {(totalDeadDays > 5 || lowUtilCars.length > 0) && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-1">Smart insights</p>
              <ul className="space-y-1">
                {totalDeadDays > 5 && (
                  <li className="text-xs text-amber-700 dark:text-amber-300">
                    💡 You have <strong>{totalDeadDays} unbooked days</strong> remaining this month across all vehicles.
                    Lowering prices by 10–15% during gaps typically fills 60% of dead days.
                  </li>
                )}
                {lowUtilCars.length > 0 && (
                  <li className="text-xs text-amber-700 dark:text-amber-300">
                    📊 {lowUtilCars.map(c => `${c.year} ${c.make} ${c.model}`).join(', ')} {lowUtilCars.length === 1 ? 'is' : 'are'} under
                    40% utilisation — consider enabling Instant Booking or lowering the daily rate.
                  </li>
                )}
                {totalProjected > 0 && (
                  <li className="text-xs text-amber-700 dark:text-amber-300">
                    🚀 At current booking pace, your fleet is on track to earn <strong>{formatRWF(totalProjected)}</strong> this year.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Per-car cards */}
      {cars.map(car => {
        const paybackPct = car.source === 'GARI_SOURCED' && car.vehicleValueRwf > 0
          ? Math.min(100, Math.round((car.yearEarnings / car.vehicleValueRwf) * 100))
          : null;
        const nudge = deadDayNudge(car);

        return (
          <div key={car.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-text-primary dark:text-white">
                  {car.year} {car.make} {car.model}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {formatRWF(car.pricePerDay)}/day · {car.totalTrips} total trips
                </p>
              </div>
              <Link href={`/cars/${car.id}`} className="text-xs text-primary hover:underline">
                View listing →
              </Link>
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
                <div className={`text-lg font-extrabold ${car.utilisation >= 60 ? 'text-green-600' : car.utilisation >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                  {car.utilisation}%
                </div>
                <div className="text-xs text-text-secondary mt-0.5">Utilisation</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-text-primary dark:text-white">{car.completedBookings}</div>
                <div className="text-xs text-text-secondary mt-0.5">Completed</div>
              </div>
            </div>

            {/* Annual projection */}
            {car.projectedAnnual && car.projectedAnnual > 0 && (
              <div className="flex items-center gap-2 text-sm mb-3">
                <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-text-secondary">
                  Annual projection: <strong className="text-green-600">{formatRWF(car.projectedAnnual)}</strong>
                </span>
              </div>
            )}

            {/* Dead-day nudge */}
            {nudge && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 mb-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-800 dark:text-amber-200">{nudge.message}</p>
                  <Link href={nudge.href} className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 mt-0.5">
                    {nudge.action} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Next booking */}
            {car.nextBooking && (
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Next booking: <strong className="text-text-primary dark:text-white">
                  {formatDate(car.nextBooking.pickupDate)} – {formatDate(car.nextBooking.returnDate)}
                </strong></span>
              </div>
            )}

            {/* Dead days bar */}
            {(car.daysLeftThisMonth ?? 0) > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Month fill rate</span>
                  <span className="font-medium">
                    {car.daysLeftThisMonth! - (car.deadDaysThisMonth ?? 0)} booked · {car.deadDaysThisMonth ?? 0} free
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - ((car.deadDaysThisMonth ?? 0) / Math.max(1, car.daysLeftThisMonth!)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Payback progress (Gari-sourced cars only) */}
            {paybackPct !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Payback progress</span>
                  <span className="font-semibold text-primary">{paybackPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${paybackPct}%` }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-1">
              <Link href={`/host/cars/${car.id}/edit`} className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <Zap className="w-3.5 h-3.5" /> Edit listing
              </Link>
              <Link href="/profile/payout" className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <Banknote className="w-3.5 h-3.5" /> Request payout
              </Link>
              <Link href={`/cars/${car.id}`} className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3">
                <TrendingUp className="w-3.5 h-3.5" /> View listing
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
