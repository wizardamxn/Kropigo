'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useGetListingsQuery } from '@/store/endpoints/listingsApi';
import { useGetCropsQuery } from '@/store/endpoints/cropsApi';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN');

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const categoryColor: Record<string, string> = {
  grain: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700',
  vegetable: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/30',
  fruit: 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
  spice: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30',
  oilseed: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30',
  pulse: 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
};

const catClass = (cat: string) =>
  categoryColor[cat?.toLowerCase()] ?? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-transparent';

// ─── TYPES & CONSTANTS ───────────────────────────────────────────────────────

interface Filters {
  search: string;
  cropId: string;
  state: string;
  district: string;
  sort: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  cropId: '',
  state: '',
  district: '',
  sort: 'newest',
};

// ─── CROP CARD COMPONENT ─────────────────────────────────────────────────────

function CropCard({ listing }: { listing: any }) {
  const thumb = listing.mediaUrls?.[0];
  const crop = listing.cropId;
  const seller = listing.sellerId;
  const expDays = listing.expiresAt ? daysUntil(listing.expiresAt) : null;

  return (
    <Link
      href={`/buyer/marketplace/${listing._id}`}
      className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-950">
        {thumb ? (
          <img
            src={thumb}
            alt={crop?.name ?? 'Crop'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-2">
            <svg className="w-10 h-10 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-sans">No Image</span>
          </div>
        )}

        {crop?.category && (
          <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-sm ${catClass(crop.category)}`}>
            {crop.category}
          </span>
        )}

        {expDays !== null && expDays <= 3 && expDays > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm animate-pulse">
            {expDays}d left
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100 leading-tight line-clamp-1">
          {crop?.name ?? '—'} {listing.variety ? `(${listing.variety})` : ''}
        </h3>

        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 font-medium">
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>{listing.quantity} {listing.unit} available</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100 dark:border-stone-800/60">
          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 min-w-0">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate font-medium">{listing.farmDistrict}, {listing.farmState}</span>
          </div>
          {seller?.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full" />
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-medium border border-green-200/60 dark:border-green-800/40 shadow-sm animate-in zoom-in-95">
      {label}
      <button onClick={onRemove} className="hover:text-green-950 dark:hover:text-green-200 transition-colors p-0.5 rounded-full">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
}

// ─── MAIN MARKETPLACE PAGE ───────────────────────────────────────────────────

export default function MarketplacePage() {
  // Server applied filters tracking
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  
  // Localized client form buffering states to prevent input lag DDoS events
  const [localFilters, setLocalFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: cropsData } = useGetCropsQuery({ limit: 100 });
  const crops: any[] = cropsData?.data ?? [];

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, limit: 12 };
    if (appliedFilters.search) p.search = appliedFilters.search;
    if (appliedFilters.cropId) p.cropId = appliedFilters.cropId;
    if (appliedFilters.state) p.state = appliedFilters.state;
    if (appliedFilters.district) p.district = appliedFilters.district;
    if (appliedFilters.sort) p.sort = appliedFilters.sort;
    return p;
  }, [appliedFilters, page]);

  const { data, isLoading, isFetching, isError } = useGetListingsQuery(queryParams);
  const listings: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters(localFilters);
    setPage(1);
    setFilterOpen(false);
  };

  const handleUpdateLocalFilter = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    setLocalFilters((f) => ({ ...f, [key]: val }));
  }, []);

  // Direct action sort execution
  const handleSortChange = (val: string) => {
    setLocalFilters((f) => {
      const updated = { ...f, sort: val };
      setAppliedFilters(updated);
      return updated;
    });
    setPage(1);
  };

  const removeSpecificFilter = (key: keyof Filters) => {
    setLocalFilters((f) => {
      const updated = { ...f, [key]: EMPTY_FILTERS[key] };
      setAppliedFilters(updated);
      return updated;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setLocalFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const activeFilterCount = Object.entries(appliedFilters).filter(
    ([k, v]) => k !== 'sort' && v !== ''
  ).length;

  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (appliedFilters.search) chips.push({ label: `खोज: ${appliedFilters.search}`, clear: () => removeSpecificFilter('search') });
    if (appliedFilters.cropId) {
      const crop = crops.find((c) => c._id === appliedFilters.cropId);
      if (crop) chips.push({ label: crop.name, clear: () => removeSpecificFilter('cropId') });
    }
    if (appliedFilters.state) chips.push({ label: appliedFilters.state, clear: () => removeSpecificFilter('state') });
    if (appliedFilters.district) chips.push({ label: appliedFilters.district, clear: () => removeSpecificFilter('district') });
    return chips;
  }, [appliedFilters, crops]);

  const selectStyles = "h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer appearance-none pr-10";
  const inputStyles = "h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm placeholder-stone-400";

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      
      {/* ── TOP SEARCH & ACTION PANEL ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
        <form onSubmit={handleApplyFilters} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="marketplace-search"
                type="text"
                value={localFilters.search}
                onChange={(e) => handleUpdateLocalFilter('search', e.target.value)}
                placeholder="फसल, जिला या राज्य खोजें (Search crops, districts, states...)"
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 placeholder-stone-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors"
              />
            </div>

            {/* Mobile Filter Dropdown Switcher Button */}
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`md:hidden flex items-center justify-center gap-2 h-12 px-4 rounded-xl border text-sm font-medium font-sans transition-colors active:scale-95 ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-green-800 text-white border-green-800'
                  : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {/* Submit execution handler wrapper for Desktop */}
            <button
              type="submit"
              className="hidden md:flex h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium items-center justify-center transition-colors shadow-sm whitespace-nowrap"
            >
              खोजें (Search)
            </button>
          </div>

          {/* Desktop Filter Tool Bar Row Layout (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={localFilters.cropId}
                onChange={(e) => handleUpdateLocalFilter('cropId', e.target.value)}
                className={selectStyles}
              >
                <option value="">All Crops</option>
                {crops.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <input
              type="text"
              value={localFilters.state}
              onChange={(e) => handleUpdateLocalFilter('state', e.target.value)}
              placeholder="State"
              className={`${inputStyles} w-32`}
            />

            <input
              type="text"
              value={localFilters.district}
              onChange={(e) => handleUpdateLocalFilter('district', e.target.value)}
              placeholder="District"
              className={`${inputStyles} w-34`}
            />

            <div className="relative ml-auto">
              <select
                value={localFilters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`${selectStyles} h-10`}
              >
                <option value="newest">Newest first</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-4 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors border border-transparent hover:border-red-100"
              >
                ✕ Clear All
              </button>
            )}
          </div>
        </form>

        {/* Mobile Expandable Filter Grid Block */}
        {filterOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative col-span-2">
                <select
                  value={localFilters.cropId}
                  onChange={(e) => handleUpdateLocalFilter('cropId', e.target.value)}
                  className={`${selectStyles} w-full`}
                >
                  <option value="">All Crops</option>
                  {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              
              <input
                type="text"
                value={localFilters.state}
                onChange={(e) => handleUpdateLocalFilter('state', e.target.value)}
                placeholder="State"
                className={inputStyles}
              />
              <input
                type="text"
                value={localFilters.district}
                onChange={(e) => handleUpdateLocalFilter('district', e.target.value)}
                placeholder="District"
                className={inputStyles}
              />
              
              <div className="relative col-span-2">
                <select
                  value={localFilters.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className={`${selectStyles} w-full`}
                >
                  <option value="newest">Newest first</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="h-12 flex-1 rounded-xl border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-sans font-medium text-sm transition-colors active:scale-95"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => handleApplyFilters()}
                className="h-12 flex-[2] rounded-xl bg-green-800 text-white font-sans font-medium text-sm transition-colors active:scale-95 shadow-sm"
              >
                फ़िल्टर लागू करें
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MARKETPLACE FEED GRID WINDOW ─────────────────────────────────────────── */}
      <div className="space-y-4">
        
        {/* Metric Response Summary Area */}
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-stone-600 dark:text-stone-400 font-sans">
            {isLoading ? (
              <span className="inline-block h-4 w-44 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
            ) : (
              <>
                कुल <span className="font-semibold text-stone-800 dark:text-stone-100">
                  {meta?.total?.toLocaleString('en-IN') ?? 0}
                </span> फसल उपलब्ध हैं (Crops Available)
                {activeFilterCount > 0 && ' • filtered'}
              </>
            )}
          </p>

          {/* Dynamic Active Filter Validation Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip, i) => (
                <FilterChip key={i} label={chip.label} onRemove={chip.clear} />
              ))}
            </div>
          )}
        </div>

        {/* Main Interface Content Delivery State Guard */}
        {isError ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 text-center space-y-4 shadow-sm">
            <svg className="w-12 h-12 mx-auto text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-stone-600 dark:text-stone-400 font-sans font-medium">डेटा लोड करने में समस्या आई।</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm"
            >
              फिर प्रयास करें (Retry)
            </button>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-20 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">कोई फसल उपलब्ध नहीं है</p>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {activeFilterCount > 0 ? 'कृपया अपने फ़िल्टर बदलें।' : 'यहाँ जल्द ही नई फसलें जोड़ी जाएँगी।'}
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="h-11 px-6 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    फ़िल्टर हटाएँ
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {listings.map((l) => <CropCard key={l._id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {/* ── PAGINATION PANEL ROW CONTROL ────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 px-5 py-3.5 shadow-sm mt-4">
            <button
              id="prev-page-btn"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Prev
            </button>

            <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans">
              <span>
                Showing{' '}
                <span className="font-semibold text-stone-800 dark:text-stone-100">
                  {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-stone-800 dark:text-stone-100">{meta.total.toLocaleString('en-IN')}</span>
              </span>
            </div>

            <button
              id="next-page-btn"
              disabled={page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}