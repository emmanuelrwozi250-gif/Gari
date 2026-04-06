'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Users, ChevronDown } from 'lucide-react';
import { DISTRICTS_BY_PROVINCE, POPULAR_LOCATIONS } from '@/lib/districts';
import { GPSButton, LocationFound } from './GPSButton';
import { format } from 'date-fns';

interface SearchBarProps {
  compact?: boolean;
  defaultValues?: {
    district?: string;
    pickup?: string;
    return?: string;
    driver?: boolean;
  };
}

export function SearchBar({ compact = false, defaultValues = {} }: SearchBarProps) {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const [district, setDistrict] = useState(defaultValues.district || '');
  const [pickupDate, setPickupDate] = useState(defaultValues.pickup || today);
  const [returnDate, setReturnDate] = useState(defaultValues.return || tomorrow);
  const [withDriver, setWithDriver] = useState(defaultValues.driver || false);

  const handleGPS = (loc: LocationFound) => {
    setDistrict(loc.district.id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(district && { district }),
      pickup: pickupDate,
      return: returnDate,
      driver: String(withDriver),
    });
    router.push(`/search?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex gap-2 items-center flex-wrap">
        <select value={district} onChange={e => setDistrict(e.target.value)} className="input flex-1 min-w-[140px]">
          <option value="">All Locations</option>
          {Object.entries(DISTRICTS_BY_PROVINCE).map(([province, districts]) => (
            <optgroup key={province} label={province}>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </optgroup>
          ))}
        </select>
        <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} min={today} className="input flex-1 min-w-[130px]" />
        <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={pickupDate} className="input flex-1 min-w-[130px]" />
        <button type="submit" className="btn-primary whitespace-nowrap">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
      {/* Location */}
      <div className="flex-1 min-w-0 p-2">
        <label className="text-xs font-semibold text-text-light uppercase tracking-wide block mb-1">Location</label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full text-sm font-medium text-text-primary dark:text-gray-100 bg-transparent appearance-none pr-6 cursor-pointer outline-none"
            >
              <option value="">Any district in Rwanda</option>
              {Object.entries(DISTRICTS_BY_PROVINCE).map(([province, districts]) => (
                <optgroup key={province} label={province}>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          </div>
          <GPSButton onLocationFound={handleGPS} label="📍" className="text-xs py-1 px-2" />
        </div>
        {/* Popular locations chips */}
        <div className="flex gap-1.5 overflow-x-auto mt-2 pb-0.5">
          {POPULAR_LOCATIONS.slice(0, 4).map(loc => (
            <button
              key={loc.name}
              type="button"
              onClick={() => setDistrict(loc.district)}
              className="flex-shrink-0 text-xs px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-full text-text-secondary hover:bg-primary-light hover:text-primary transition-colors whitespace-nowrap"
            >
              {loc.name.split(',')[0].split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block w-px bg-border self-stretch" />

      {/* Pick-up date */}
      <div className="flex-1 min-w-0 p-2">
        <label className="text-xs font-semibold text-text-light uppercase tracking-wide block mb-1">Pick-up Date</label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            type="date"
            value={pickupDate}
            onChange={e => {
              setPickupDate(e.target.value);
              if (e.target.value >= returnDate) {
                setReturnDate(format(new Date(new Date(e.target.value).getTime() + 86400000), 'yyyy-MM-dd'));
              }
            }}
            min={today}
            className="text-sm font-medium text-text-primary dark:text-gray-100 bg-transparent outline-none w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-border self-stretch" />

      {/* Return date */}
      <div className="flex-1 min-w-0 p-2">
        <label className="text-xs font-semibold text-text-light uppercase tracking-wide block mb-1">Return Date</label>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            type="date"
            value={returnDate}
            onChange={e => setReturnDate(e.target.value)}
            min={pickupDate}
            className="text-sm font-medium text-text-primary dark:text-gray-100 bg-transparent outline-none w-full cursor-pointer"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-border self-stretch" />

      {/* Driver toggle */}
      <div className="p-2">
        <label className="text-xs font-semibold text-text-light uppercase tracking-wide block mb-1">Drive Option</label>
        <div className="flex rounded-xl border border-border overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setWithDriver(false)}
            className={`flex-1 px-3 py-2 transition-colors whitespace-nowrap ${!withDriver ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Self-Drive
          </button>
          <button
            type="button"
            onClick={() => setWithDriver(true)}
            className={`flex-1 px-3 py-2 transition-colors whitespace-nowrap ${withDriver ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            With Driver
          </button>
        </div>
      </div>

      {/* Search button */}
      <div className="p-2 flex items-end">
        <button type="submit" className="btn-primary w-full md:w-auto h-12 px-8 text-base">
          <Search className="w-5 h-5" /> Search
        </button>
      </div>
    </form>
  );
}
