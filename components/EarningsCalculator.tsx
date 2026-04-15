'use client';

import { useState } from 'react';
import { EARNINGS_RATES } from '@/lib/demo-data';
import { formatRWF } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

const USD_RATE = 1100;

// Driver add-on rates per type (approx)
const DRIVER_RATES: Record<string, number> = {
  'Economy':    12000,
  'Sedan':      15000,
  'SUV / 4x4':  20000,
  'Executive':  25000,
  'Minibus':    18000,
  'Pickup':     18000,
  'Luxury':     30000,
};

export function EarningsCalculator() {
  const [carType, setCarType] = useState('SUV / 4x4');
  const [days, setDays] = useState(18);
  const [withDriver, setWithDriver] = useState(false);

  const dayRate   = EARNINGS_RATES[carType] ?? 30000;
  const driverAdd = withDriver ? (DRIVER_RATES[carType] ?? 15000) : 0;
  const gross     = (dayRate + driverAdd) * days;
  const net       = Math.round(gross * 0.9);  // after 10% Gari fee
  const annual    = net * 12;
  const usd       = Math.round(net / USD_RATE);
  const annualUsd = Math.round(annual / USD_RATE);

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-lg text-accent-yellow flex items-center gap-2">
        <TrendingUp className="w-5 h-5" /> Earnings Estimator
      </h3>

      {/* Car type */}
      <div>
        <label className="text-xs font-semibold text-primary-light uppercase tracking-wide block mb-1.5">
          Car Type
        </label>
        <select
          value={carType}
          onChange={e => setCarType(e.target.value)}
          className="w-full bg-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium outline-none border border-white/20 cursor-pointer"
        >
          {Object.keys(EARNINGS_RATES).map(type => (
            <option key={type} value={type} className="bg-gray-900">{type}</option>
          ))}
        </select>
      </div>

      {/* Driver toggle */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Include a driver</p>
          <p className="text-xs text-primary-light mt-0.5">+{formatRWF(DRIVER_RATES[carType] ?? 15000)}/day extra</p>
        </div>
        <button
          type="button"
          onClick={() => setWithDriver(d => !d)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${withDriver ? 'bg-accent-yellow' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${withDriver ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Days slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-primary-light uppercase tracking-wide">
            Days Rented / Month
          </label>
          <span className="text-accent-yellow font-bold text-sm">{days} days</span>
        </div>
        <input
          type="range"
          min={5}
          max={28}
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
        <div className="flex justify-between text-xs text-primary-light mt-0.5">
          <span>5</span><span>28</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white/10 rounded-xl px-4 py-5">
        <p className="text-xs text-primary-light text-center mb-3">
          ({formatRWF(dayRate + driverAdd)}/day × {days} days) − 10% Gari fee
        </p>
        <div className="text-center mb-1">
          <span className="text-3xl font-extrabold text-accent-yellow">{formatRWF(net)}</span>
          <span className="text-xs text-primary-light ml-1.5">/ month</span>
        </div>
        <p className="text-center text-xs text-primary-light">≈ ${usd.toLocaleString()} USD / month</p>

        <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-light">Annual projection</p>
            <p className="text-lg font-bold text-white">{formatRWF(annual)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-light">≈ USD</p>
            <p className="text-lg font-bold text-accent-yellow">${annualUsd.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Comparison mini-table */}
      <div>
        <p className="text-xs font-semibold text-primary-light uppercase tracking-wide mb-2">Compare car types (20 days/month)</p>
        <div className="space-y-1.5">
          {(['Economy', 'Sedan', 'SUV / 4x4', 'Executive'] as const).map(type => {
            const r = EARNINGS_RATES[type] ?? 0;
            const m = Math.round(r * 20 * 0.9);
            const isActive = type === carType;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setCarType(type)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive ? 'bg-accent-yellow/20 border border-accent-yellow/40' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`font-medium ${isActive ? 'text-accent-yellow' : 'text-white/70'}`}>{type}</span>
                <span className={`font-bold ${isActive ? 'text-accent-yellow' : 'text-white/60'}`}>{formatRWF(m)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-primary-light">* After 10% platform fee. Insurance included. Paid monthly via MoMo.</p>

      <Link
        href="/host/new"
        className="w-full flex items-center justify-center gap-2 bg-accent-yellow text-gray-900 font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors text-sm"
      >
        List My Car — These are Real Numbers <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
