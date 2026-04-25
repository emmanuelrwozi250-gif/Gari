'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Car, TrendingUp } from 'lucide-react';
import { formatRWF, toUSD } from '@/lib/utils';

const CAR_TYPES = [
  { id: 'economy',   label: 'Economy',   emoji: '🚗', exampleModel: 'Toyota Axio',      ratePerDay: 35_000 },
  { id: 'sedan',     label: 'Sedan',     emoji: '🚙', exampleModel: 'Toyota Corolla',   ratePerDay: 50_000 },
  { id: 'suv',       label: 'SUV',       emoji: '🚐', exampleModel: 'Kia Sportage',     ratePerDay: 75_000 },
  { id: 'executive', label: 'Executive', emoji: '💼', exampleModel: 'Mercedes C-Class', ratePerDay: 120_000 },
  { id: 'minibus',   label: 'Minibus',   emoji: '🚌', exampleModel: 'Toyota Hiace',     ratePerDay: 90_000 },
];

const DRIVER_PREMIUM = 20_000; // RWF extra per day when driver offered
const PLATFORM_FEE = 0.12;    // 12% platform commission

export function EarningsEstimator() {
  const [selectedType, setSelectedType] = useState('suv');
  const [withDriver, setWithDriver] = useState(false);
  const [daysPerMonth, setDaysPerMonth] = useState(14);

  const type = CAR_TYPES.find(t => t.id === selectedType) ?? CAR_TYPES[2];
  const grossPerDay = type.ratePerDay + (withDriver ? DRIVER_PREMIUM : 0);
  const monthlyGross = grossPerDay * daysPerMonth;
  const monthlyNet = Math.round(monthlyGross * (1 - PLATFORM_FEE));
  const annualNet = monthlyNet * 12;

  return (
    <section className="py-16 bg-dark-bg text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent-yellow/20 border border-accent-yellow/30 rounded-full px-3 py-1.5 text-accent-yellow text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> For Car Owners
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">How Much Could You Earn?</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            List your car on Gari for free. You set the price and availability — we handle bookings and payments.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          {/* Car type picker */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">My car type</p>
            <div className="flex flex-wrap gap-2">
              {CAR_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    selectedType === t.id
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">e.g. {type.exampleModel}</p>
          </div>

          {/* Driver toggle */}
          <div className="mb-6 flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <div>
              <p className="text-sm font-semibold text-gray-200">Offer with driver</p>
              <p className="text-xs text-gray-500">Add +{formatRWF(DRIVER_PREMIUM)}/day premium</p>
            </div>
            <button
              role="switch"
              aria-checked={withDriver}
              onClick={() => setWithDriver(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                withDriver ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                withDriver ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Days slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-300">Days rented per month</p>
              <span className="text-lg font-bold text-white">{daysPerMonth} days</span>
            </div>
            <input
              type="range"
              min={5}
              max={28}
              step={1}
              value={daysPerMonth}
              onChange={e => setDaysPerMonth(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-white/20"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 days</span>
              <span>28 days</span>
            </div>
          </div>

          {/* Earnings display */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">Monthly earnings</p>
              <p className="text-2xl font-extrabold text-white">{formatRWF(monthlyNet)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{toUSD(monthlyNet)}</p>
            </div>
            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">Annual earnings</p>
              <p className="text-2xl font-extrabold text-accent-yellow">{formatRWF(annualNet)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{toUSD(annualNet)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mb-6">
            Estimate after {Math.round(PLATFORM_FEE * 100)}% platform fee. You keep {100 - Math.round(PLATFORM_FEE * 100)}%. Actual earnings vary.
          </p>

          <Link
            href="/host/new"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
          >
            <Car className="w-4 h-4" />
            List my car — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
