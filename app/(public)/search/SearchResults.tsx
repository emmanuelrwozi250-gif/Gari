'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CarCard, CarCardSkeleton } from '@/components/CarCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { MapPin, List, Map, SlidersHorizontal, ChevronLeft, ChevronRight, X, CalendarCheck, Tent } from 'lucide-react';
import { RWANDA_DISTRICTS } from '@/lib/districts';

const MapView = dynamic(() => import('@/components/MapView').then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

interface SearchResultsProps {
  cars: any[];
  total: number;
  page: number;
  searchParams: Record<string, string | undefined>;
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Best Match' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-border shadow-sm sticky top-16 z-30 h-[60px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="space-y-4 bg-white dark:bg-gray-900 rounded-card p-4 border border-border">
              {[100, 80, 120, 90, 100].map((w, i) => (
                <div key={i} className="space-y-2">
                  <div className={`skeleton h-4 w-${w === 100 ? 'full' : w === 80 ? '4/5' : w === 120 ? 'full' : '3/4'}`} />
                  <div className="skeleton h-8 w-full" />
                </div>
              ))}
            </div>
          </aside>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-9 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <CarCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchResults({ cars, total, page, searchParams }: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterOpen, setFilterOpen] = useState(false);

  const district = searchParams.district;
  const districtInfo = RWANDA_DISTRICTS.find(d => d.id === district);
  const mapCenter: [number, number] = districtInfo
    ? [districtInfo.lat, districtInfo.lng]
    : [-1.9441, 30.0619];

  const mapMarkers = cars.map(car => ({
    lat: car.lat || (RWANDA_DISTRICTS.find(d => d.id === car.district)?.lat || -1.9441),
    lng: car.lng || (RWANDA_DISTRICTS.find(d => d.id === car.district)?.lng || 30.0619),
    label: `${car.make} ${car.model}`,
    type: 'car' as const,
    carId: car.id,
    photo: car.photos[0],
    price: car.pricePerDay,
    available: car.isAvailable,
  }));

  const updateParam = useCallback((key: string, value: string | null) => {
    const current = new URLSearchParams(Array.from(params.entries()));
    if (value === null || value === '') current.delete(key);
    else current.set(key, value);
    current.delete('page'); // reset page on filter change
    router.push(`${pathname}?${current.toString()}`);
  }, [params, pathname, router]);

  const totalPages = Math.ceil(total / 12);

  // Active filters chips
  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (searchParams.district) {
    const d = RWANDA_DISTRICTS.find(x => x.id === searchParams.district);
    if (d) activeFilters.push({ key: 'district', label: `📍 ${d.name}`, value: d.id });
  }
  if (searchParams.driver === 'true') activeFilters.push({ key: 'driver', label: 'With Driver', value: 'true' });
  if (searchParams.type) activeFilters.push({ key: 'type', label: searchParams.type.replace('_', '/'), value: searchParams.type });
  if (searchParams.listingType) activeFilters.push({ key: 'listingType', label: searchParams.listingType, value: searchParams.listingType });

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Top search bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-border shadow-sm sticky top-16 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <SearchBar compact defaultValues={{
            district: searchParams.district,
            pickup: searchParams.pickup,
            return: searchParams.return,
            driver: searchParams.driver === 'true',
          }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <a
              href="/map"
              className="flex items-center justify-between w-full px-4 py-2.5 mb-3 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              <span>View cars on map</span>
              <span aria-hidden>→</span>
            </a>
            <FilterSidebar searchParams={searchParams} onChange={updateParam} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="font-bold text-lg text-text-primary dark:text-white">
                  {total.toLocaleString()} cars available
                  {districtInfo ? ` in ${districtInfo.name}` : ' in Rwanda'}
                </h1>
                {/* Active filter chips */}
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeFilters.map(f => (
                      <span key={f.key} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                        {f.label}
                        <button onClick={() => updateParam(f.key, null)} className="ml-1 hover:text-primary-dark">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* UX-04: Quick-filter chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      const current = new URLSearchParams(Array.from(params.entries()));
                      current.set('pickup', today);
                      current.set('return', tomorrow);
                      router.push(`${pathname}?${current.toString()}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-yellow/15 hover:bg-accent-yellow/25 text-amber-700 dark:text-accent-yellow text-xs font-semibold rounded-full border border-accent-yellow/30 transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Need a car today?
                  </button>
                  <button
                    onClick={() => updateParam('type', searchParams.type === 'SUV_4X4' ? null : 'SUV_4X4')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                      searchParams.type === 'SUV_4X4'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-700'
                    }`}
                  >
                    <Tent className="w-3.5 h-3.5" /> Safari / 4x4
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>

                {/* Sort */}
                <select
                  value={searchParams.sort || 'rating'}
                  onChange={e => updateParam('sort', e.target.value)}
                  className="input text-sm py-2 w-auto"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* View toggle */}
                <div className="flex border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 ${viewMode === 'map' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Map view */}
            {viewMode === 'map' && (
              <div className="mb-6">
                <MapView
                  center={mapCenter}
                  zoom={districtInfo ? 13 : 10}
                  markers={mapMarkers}
                  onMarkerClick={id => router.push(`/cars/${id}`)}
                  height="500px"
                  showUserLocation
                />
              </div>
            )}

            {/* Car grid */}
            {cars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {cars.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    pickupDate={searchParams.pickup}
                    returnDate={searchParams.return}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <MapPin className="w-12 h-12 text-text-light mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-2">No cars found</h3>
                <p className="text-text-secondary">Try adjusting your filters or searching in a different district.</p>
                <button onClick={() => router.push('/search')} className="btn-primary mt-4">
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => updateParam('page', String(p))}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'border border-border hover:border-primary text-text-secondary'}`}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterSidebar searchParams={searchParams} onChange={(key, val) => {
              updateParam(key, val);
              setFilterOpen(false);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
