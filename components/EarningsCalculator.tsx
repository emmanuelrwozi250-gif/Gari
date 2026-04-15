'use client';

import { useState } from 'react';
import { EARNINGS_RATES } from '@/lib/demo-data';
import { formatRWF } from '@/lib/utils';

export function EarningsCalculator() {
  const [carType, setCarType] = useState('Economy');
  const [days, setDays] = useState(20);

  const rate = EARNINGS_RATES[carType] ?? 30000;
  const net = Math.round(rate * days * 0.9);

  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg text-accent-yellow">Earnings Estimator</h3>

      {/* Car type */}
      <div>
        <label className="text-xs font-semibold text-primary-light uppercase tracking-wide block mb-1.5">Car Type</label>
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

      {/* Days slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-primary-light uppercase tracking-wide">Days per Month</label>
          <span className="text-accent-yellow font-bold text-sm">{days} days</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="w-full accent-yellow-400"
        />
        <div className="flex justify-between text-xs text-primary-light mt-0.5">
          <span>1</span>
          <span>30</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white/10 rounded-xl px-4 py-4 text-center">
        <div className="text-xs text-primary-light mb-1">
          {formatRWF(rate)}/day × {days} days − 10% fee
        </div>
        <div className="text-3xl font-extrabold text-accent-yellow">{formatRWF(net)}</div>
        <div className="text-xs text-primary-light mt-0.5">estimated monthly earnings</div>
      </div>

      <p className="text-xs text-primary-light">* After 10% platform fee. Based on average host performance.</p>
    </div>
  );
}
