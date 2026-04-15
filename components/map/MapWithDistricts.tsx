'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Search, Car, Tag, X, Loader2 } from 'lucide-react';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { RWANDA_DISTRICTS } from '@/lib/districts';
import type { District } from '@/lib/districts';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface CustomCoords {
  lat: number;
  lng: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SALES_COUNTS: Record<string, number> = {
  gasabo: 4,
  kicukiro: 3,
  nyarugenge: 5,
  musanze: 1,
  rubavu: 2,
  huye: 1,
  nyagatare: 1,
  karongi: 1,
  rusizi: 1,
  rwamagana: 1,
};

const PROVINCE_SHORT: Record<string, string> = {
  'Kigali City': 'Kigali',
  'Northern Province': 'North',
  'Southern Province': 'South',
  'Eastern Province': 'East',
  'Western Province': 'West',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRentalCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const car of DEMO_RENTAL_CARS) {
    counts[car.district] = (counts[car.district] ?? 0) + 1;
  }
  return counts;
}

function buildIframeUrl(district: District | null, custom?: CustomCoords | null): string {
  if (custom) {
    const { lat, lng } = custom;
    const west = (lng - 0.05).toFixed(6);
    const south = (lat - 0.03).toFixed(6);
    const east = (lng + 0.05).toFixed(6);
    const north = (lat + 0.03).toFixed(6);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`;
  }
  if (!district) {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=29.0,-2.85,31.2,-1.05&layer=mapnik';
  }
  const { lat, lng } = district;
  const west = (lng - 0.35).toFixed(6);
  const south = (lat - 0.22).toFixed(6);
  const east = (lng + 0.35).toFixed(6);
  const north = (lat + 0.22).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DistrictRowProps {
  district: District;
  count: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

function DistrictRow({ district, count, selected, onSelect }: DistrictRowProps) {
  const shortProvince = PROVINCE_SHORT[district.province] ?? district.province;
  return (
    <button
      type="button"
      onClick={() => onSelect(district.id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
        selected
          ? 'bg-primary text-white'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <MapPin
          className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-white' : 'text-primary'}`}
        />
        <span className="font-medium text-sm truncate">{district.name}</span>
        <span
          className={`text-xs shrink-0 ${selected ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {shortProvince}
        </span>
      </span>
      {count > 0 && (
        <span
          className={`ml-2 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
            selected
              ? 'bg-white/20 text-white'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MapWithDistricts() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'rentals' | 'sales'>('rentals');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Location search (Nominatim)
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<NominatimResult[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customCoords, setCustomCoords] = useState<CustomCoords | null>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // 3-second fallback timer
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!mapLoaded) setShowFallback(true);
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mapLoaded]);

  // Nominatim geocoding
  function searchLocation(query: string) {
    setLocationQuery(query);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (!query.trim()) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    locationDebounceRef.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Rwanda')}&countrycodes=rw&format=json&limit=6`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setLocationSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLocationLoading(false);
      }
    }, 400);
  }

  function handleLocationSelect(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    // Shorten display name: take first 2 parts before comma
    const parts = result.display_name.split(',');
    const label = parts.slice(0, 2).join(',').trim();
    setCustomCoords({ lat, lng, label });
    setLocationQuery(label);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    // Reset map for new location
    setMapLoaded(false);
    setShowFallback(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowFallback(true), 3000);
  }

  function clearLocationSearch() {
    setLocationQuery('');
    setCustomCoords(null);
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setMapLoaded(false);
    setShowFallback(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowFallback(true), 3000);
  }

  // Derived data
  const rentalCounts = getRentalCounts();
  const counts: Record<string, number> =
    mode === 'rentals' ? rentalCounts : SALES_COUNTS;

  const selectedDistrictObj =
    RWANDA_DISTRICTS.find((d) => d.id === selectedDistrict) ?? null;

  const iframeUrl = buildIframeUrl(selectedDistrictObj, customCoords);

  // Filtered + sorted district list
  const filteredDistricts = RWANDA_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.province.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const ca = counts[a.id] ?? 0;
    const cb = counts[b.id] ?? 0;
    if (cb !== ca) return cb - ca;
    return a.name.localeCompare(b.name);
  });

  function handleSelect(id: string) {
    setSelectedDistrict((prev) => (prev === id ? null : id));
    // Clear any custom location search when picking a district
    setCustomCoords(null);
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
    // Reset map loaded state so spinner shows for new location
    setMapLoaded(false);
    setShowFallback(false);
    // Restart fallback timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowFallback(true);
    }, 3000);
  }

  function handleClear() {
    setSelectedDistrict(null);
    setCustomCoords(null);
    setLocationQuery('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setMapLoaded(false);
    setShowFallback(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowFallback(true);
    }, 3000);
  }

  const selectedName = selectedDistrictObj?.name ?? null;
  const searchHref = selectedDistrict
    ? `/search?district=${selectedDistrict}`
    : '/search';

  const modeCount = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="flex h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR — hidden on mobile                                     */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 p-3 space-y-3">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Cars Near You
            </h2>
            <span className="text-xs text-gray-400">{modeCount} total</span>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('rentals')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
                mode === 'rentals'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Car className="w-3 h-3" />
              Rentals
            </button>
            <button
              type="button"
              onClick={() => setMode('sales')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
                mode === 'sales'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Tag className="w-3 h-3" />
              For Sale
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search districts…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Scrollable district list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredDistricts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              No districts match &ldquo;{search}&rdquo;
            </p>
          ) : (
            filteredDistricts.map((district) => (
              <DistrictRow
                key={district.id}
                district={district}
                count={counts[district.id] ?? 0}
                selected={selectedDistrict === district.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAP AREA                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex-1 min-w-0 bg-gray-900">
        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent px-3 pt-3 pb-8">
          <div className="flex items-center gap-2">
            {/* Location search input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10" />
              {locationLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary animate-spin z-10" />
              )}
              {locationQuery && !locationLoading && (
                <button
                  type="button"
                  onClick={clearLocationSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                ref={locationInputRef}
                type="text"
                value={locationQuery}
                onChange={(e) => searchLocation(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search any location in Rwanda…"
                className="w-full pl-8 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-30 max-h-56 overflow-y-auto">
                  {locationSuggestions.map((result) => {
                    const parts = result.display_name.split(',');
                    const primary = parts[0].trim();
                    const secondary = parts.slice(1, 3).join(',').trim();
                    return (
                      <li key={result.place_id}>
                        <button
                          type="button"
                          onMouseDown={() => handleLocationSelect(result)}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                              {primary}
                            </span>
                            {secondary && (
                              <span className="block text-xs text-gray-400 truncate">
                                {secondary}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Browse rentals link */}
            <Link
              href={searchHref}
              className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {selectedName ? `In ${selectedName}` : 'Browse Cars'}
              </span>
              <span className="sm:hidden">Cars</span>
            </Link>

            {(selectedDistrict || customCoords) && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear selection"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-dark-card shadow-md text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Map or fallback */}
        {showFallback ? (
          /* ---- FALLBACK DISTRICT GRID ------------------------------------ */
          <div className="h-full overflow-y-auto bg-gray-50 dark:bg-dark-bg p-4 pt-16">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Cars Available by District
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Map could not load — browse by district
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RWANDA_DISTRICTS.map((district) => {
                  const cnt = counts[district.id] ?? 0;
                  const shortProv =
                    PROVINCE_SHORT[district.province] ?? district.province;
                  return (
                    <Link
                      key={district.id}
                      href={`/search?district=${district.id}`}
                      className="block bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {district.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {shortProv}
                          </p>
                        </div>
                        {cnt > 0 && (
                          <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {cnt}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ---- IFRAME + SPINNER ----------------------------------------- */
          <>
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-[5]">
                <div className="text-center">
                  <svg
                    className="w-10 h-10 animate-spin text-primary mx-auto mb-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm">Loading map…</p>
                </div>
              </div>
            )}
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Rwanda car rental map"
              className="w-full h-full border-0"
              onLoad={() => {
                setMapLoaded(true);
                if (timerRef.current) clearTimeout(timerRef.current);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
