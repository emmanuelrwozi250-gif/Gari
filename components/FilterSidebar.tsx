'use client';

import { DISTRICTS_BY_PROVINCE } from '@/lib/districts';
import { GPSButton, LocationFound } from './GPSButton';
import { formatRWF } from '@/lib/utils';

const CAR_TYPES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV_4X4', label: 'SUV / 4x4' },
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'MINIBUS', label: 'Minibus' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'LUXURY', label: 'Luxury' },
];

interface FilterSidebarProps {
  searchParams: Record<string, string | undefined>;
  onChange: (key: string, value: string | null) => void;
  priceMin?: number;
  priceMax?: number;
}

export function FilterSidebar({ searchParams, onChange, priceMin, priceMax }: FilterSidebarProps) {
  const handleGPS = (loc: LocationFound) => {
    onChange('district', loc.district.id);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 rounded-card p-4 border border-border">
      <h2 className="font-bold text-text-primary dark:text-white">Filters</h2>

      {/* Trip Dates */}
      <div>
        <label className="label">Pickup Date</label>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={searchParams.pickup ?? ''}
          onChange={e => onChange('pickup', e.target.value || null)}
          className="input w-full text-sm"
          aria-label="Pickup date"
        />
      </div>
      <div>
        <label className="label">Return Date</label>
        <input
          type="date"
          min={searchParams.pickup ?? new Date().toISOString().split('T')[0]}
          value={searchParams.return ?? ''}
          onChange={e => onChange('return', e.target.value || null)}
          className="input w-full text-sm"
          aria-label="Return date"
        />
      </div>

      {/* Location */}
      <div>
        <label className="label">District</label>
        <select
          value={searchParams.district || ''}
          onChange={e => onChange('district', e.target.value || null)}
          className="input text-sm"
        >
          <option value="">All Rwanda</option>
          {Object.entries(DISTRICTS_BY_PROVINCE).map(([province, districts]) => (
            <optgroup key={province} label={province}>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </optgroup>
          ))}
        </select>
        <GPSButton onLocationFound={handleGPS} label="Search near me" className="w-full mt-2 justify-center" />
      </div>

      {/* All vehicles on Gari are RURA-licensed commercial operators — listing type filter removed */}

      {/* Drive Option */}
      <div>
        <label className="label">Driver</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchParams.driver === 'true'}
            onChange={e => onChange('driver', e.target.checked ? 'true' : null)}
            className="rounded text-primary"
          />
          <span className="text-sm text-text-secondary dark:text-gray-400">Include a driver</span>
        </label>
      </div>

      {/* Car Type */}
      <div>
        <label className="label">Car Type</label>
        <div className="space-y-2">
          {CAR_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="carType"
                value={value}
                checked={searchParams.type === value}
                onChange={() => onChange('type', value)}
                className="text-primary"
              />
              <span className="text-sm text-text-secondary dark:text-gray-400">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="carType" value="" checked={!searchParams.type}
              onChange={() => onChange('type', null)} className="text-primary" />
            <span className="text-sm text-text-secondary dark:text-gray-400">All types</span>
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="label">Price per Day</label>

        {/* Current value display */}
        <div className="flex justify-between items-center mb-2 mt-1">
          <span className="text-sm font-semibold text-text-primary dark:text-white">
            RWF {(Number(searchParams.minPrice) || priceMin || 0).toLocaleString()}
          </span>
          <span className="text-xs text-text-light">—</span>
          <span className="text-sm font-semibold text-text-primary dark:text-white">
            RWF {(Number(searchParams.maxPrice) || priceMax || 300000).toLocaleString()}
          </span>
        </div>

        {/* Min slider */}
        <input
          type="range"
          min={priceMin ?? 0}
          max={priceMax ?? 300000}
          step={5000}
          value={Number(searchParams.minPrice) || (priceMin ?? 0)}
          onChange={e => {
            const v = Number(e.target.value);
            const max = Number(searchParams.maxPrice) || (priceMax ?? 300000);
            onChange('minPrice', v > 0 ? String(v) : null);
            if (v > max) onChange('maxPrice', String(v));
          }}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary bg-gray-200 dark:bg-gray-700"
          aria-label="Minimum price per day"
        />

        {/* Max slider */}
        <input
          type="range"
          min={priceMin ?? 0}
          max={priceMax ?? 300000}
          step={5000}
          value={Number(searchParams.maxPrice) || (priceMax ?? 300000)}
          onChange={e => {
            const v = Number(e.target.value);
            const min = Number(searchParams.minPrice) || (priceMin ?? 0);
            onChange('maxPrice', v < (priceMax ?? 300000) ? String(v) : null);
            if (v < min) onChange('minPrice', String(v));
          }}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary bg-gray-200 dark:bg-gray-700 mt-2"
          aria-label="Maximum price per day"
        />

        <p className="text-xs text-text-light mt-2">RWF per day · drag to filter</p>
      </div>

      {/* Seats */}
      <div>
        <label className="label">Minimum Seats</label>
        <div className="flex gap-2 flex-wrap">
          {['4', '5', '7', '8'].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange('seats', searchParams.seats === n ? null : n)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                searchParams.seats === n
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-secondary hover:border-primary'
              }`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="label">Transmission</label>
        <div className="flex gap-2">
          {[
            { value: '', label: 'Any' },
            { value: 'AUTOMATIC', label: 'Auto' },
            { value: 'MANUAL', label: 'Manual' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('transmission', value || null)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                (searchParams.transmission || '') === value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-secondary hover:border-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ⚡ Instant Book */}
      <div>
        <button
          type="button"
          onClick={() => onChange('instantBooking', searchParams.instantBooking === 'true' ? null : 'true')}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-colors ${
            searchParams.instantBooking === 'true'
              ? 'border-accent-yellow bg-accent-yellow/10 text-amber-700 dark:text-accent-yellow'
              : 'border-border text-text-secondary hover:border-accent-yellow/50'
          }`}
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            ⚡ Instant Book only
          </span>
          <span className={`w-10 h-5 rounded-full transition-colors relative ${
            searchParams.instantBooking === 'true' ? 'bg-accent-yellow' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              searchParams.instantBooking === 'true' ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </span>
        </button>
        <p className="text-xs text-text-light mt-1.5 px-1">Confirmed immediately — no waiting for host approval</p>
      </div>

      {/* 🌍 International Friendly */}
      <div>
        <button
          type="button"
          onClick={() => onChange('intl', (searchParams as any).intl === 'true' ? null : 'true')}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-colors ${
            (searchParams as any).intl === 'true'
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-border text-text-secondary hover:border-blue-300'
          }`}
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            🌍 International Friendly
          </span>
          <span className={`w-10 h-5 rounded-full transition-colors relative ${
            (searchParams as any).intl === 'true' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              (searchParams as any).intl === 'true' ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </span>
        </button>
        <p className="text-xs text-text-light mt-1.5 px-1">Hosts with English-speaking service &amp; airport pickup</p>
      </div>

      {/* Clear all */}
      <button
        type="button"
        onClick={() => {
          ['pickup', 'return', 'district', 'driver', 'type', 'listingType', 'minPrice', 'maxPrice', 'seats', 'transmission', 'instantBooking', 'intl'].forEach(k => onChange(k, null));
        }}
        className="w-full py-2 text-sm text-text-secondary hover:text-red-500 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}
