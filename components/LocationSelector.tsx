'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { RWANDA_DISTRICTS, DISTRICTS_BY_PROVINCE, POPULAR_LOCATIONS, District } from '@/lib/districts';
import { GPSButton, LocationFound } from './GPSButton';

interface LocationSelectorProps {
  value?: string;          // district id
  onChange: (districtId: string, locationName?: string) => void;
  onCoords?: (lat: number, lng: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  onCoords,
  label = 'Location',
  placeholder = 'Select district',
  required,
}: LocationSelectorProps) {
  const [freeText, setFreeText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const selectedDistrict = RWANDA_DISTRICTS.find(d => d.id === value);

  const handleGPS = (loc: LocationFound) => {
    onChange(loc.district.id, loc.address);
    if (onCoords) onCoords(loc.lat, loc.lng);
    setFreeText(loc.address);
  };

  const filteredSuggestions = freeText.length > 1
    ? [
        ...RWANDA_DISTRICTS.filter(d =>
          d.name.toLowerCase().includes(freeText.toLowerCase())
        ).map(d => ({ id: d.id, name: d.name, type: 'district' as const })),
        ...POPULAR_LOCATIONS.filter(p =>
          p.name.toLowerCase().includes(freeText.toLowerCase())
        ).map(p => ({ id: p.district, name: p.name, type: 'place' as const, lat: p.lat, lng: p.lng })),
      ].slice(0, 8)
    : [];

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}

      {/* Popular location chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {POPULAR_LOCATIONS.slice(0, 5).map(loc => (
          <button
            key={loc.name}
            type="button"
            onClick={() => {
              onChange(loc.district, loc.name);
              if (onCoords) onCoords(loc.lat, loc.lng);
              setFreeText(loc.name);
            }}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-400 rounded-full hover:bg-primary-light hover:text-primary transition-all whitespace-nowrap"
          >
            <MapPin className="w-3 h-3" />
            {loc.name.split(',')[0]}
          </button>
        ))}
      </div>

      {/* District select + GPS */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            required={required}
            className="input appearance-none pr-8 cursor-pointer"
          >
            <option value="">{placeholder}</option>
            {Object.entries(DISTRICTS_BY_PROVINCE).map(([province, districts]) => (
              <optgroup key={province} label={province}>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
        </div>
        <GPSButton onLocationFound={handleGPS} label="📍" className="flex-shrink-0" />
      </div>

      {/* Free text / autocomplete */}
      {selectedDistrict && (
        <div className="relative">
          <input
            type="text"
            value={freeText}
            onChange={e => { setFreeText(e.target.value); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={`Exact address in ${selectedDistrict.name} (optional)`}
            className="input text-sm"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-border shadow-xl z-20">
              {filteredSuggestions.map(s => (
                <button
                  key={s.name}
                  type="button"
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-primary dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => {
                    onChange(s.id, s.name);
                    setFreeText(s.name);
                    setShowSuggestions(false);
                    if ('lat' in s && s.lat && onCoords) onCoords(s.lat as number, (s as any).lng);
                  }}
                >
                  <MapPin className="w-3 h-3 text-text-light flex-shrink-0" />
                  <span>{s.name}</span>
                  <span className="ml-auto text-xs text-text-light">{s.type === 'place' ? 'Place' : 'District'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
