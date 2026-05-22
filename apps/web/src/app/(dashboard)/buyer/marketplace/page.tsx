'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useGetListingsQuery } from '@/store/endpoints/listingsApi';
import { useGetCropsQuery } from '@/store/endpoints/cropsApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatPrice = (n: number) =>
  '₹' + n.toLocaleString('en-IN');

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const categoryColor: Record<string, string> = {
  grain: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  vegetable: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  fruit: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  spice: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  oilseed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pulse: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
};
const catClass = (cat: string) =>
  categoryColor[cat?.toLowerCase()] ?? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  cropId: string;
  state: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

const EMPTY_FILTERS: Filters = {
  search: '',
  cropId: '',
  state: '',
  district: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
};

// ─── Crop Card ───────────────────────────────────────────────────────────────

function CropCard({ listing }: { listing: any }) {
  const thumb = listing.mediaUrls?.[0];
  const crop = listing.cropId;
  const seller = listing.sellerId;
  const expDays = listing.expiresAt ? daysUntil(listing.expiresAt) : null;

  return (
    <Link
      href={`/buyer/marketplace/${listing._id}`}
      className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {thumb ? (
          <img
            src={thumb}
            alt={crop?.name ?? 'Crop'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        {crop?.category && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${catClass(crop.category)}`}>
            {crop.category}
          </span>
        )}

        {/* Expiry warning */}
        {expDays !== null && expDays <= 3 && expDays > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white">
            {expDays}d left
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-lg font-medium text-stone-800 dark:text-stone-100 leading-tight line-clamp-1">
          {crop?.name ?? '—'}
        </h3>

        <div className="flex items-baseline gap-1">
          <span className="font-serif text-xl font-bold text-amber-700 dark:text-amber-500">
            {formatPrice(listing.askingPrice)}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">/ {listing.unit}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>{listing.quantity} {listing.unit} available</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 min-w-0">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{listing.farmDistrict}, {listing.farmState}</span>
          </div>
          {seller?.isVerified && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-700 dark:text-green-500 font-semibold flex-shrink-0">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-sm font-medium border border-amber-200 dark:border-amber-800/50">
      {label}
      <button onClick={onRemove} className="hover:text-amber-900 dark:hover:text-amber-300 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: cropsData } = useGetCropsQuery({ limit: 100 });
  const crops: any[] = cropsData?.data ?? [];

  // Build query params
  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, limit: 12, status: 'open' };
    if (filters.cropId) p.cropId = filters.cropId;
    if (filters.state) p.state = filters.state;
    if (filters.district) p.district = filters.district;
    if (filters.minPrice) p.minPrice = filters.minPrice;
    if (filters.maxPrice) p.maxPrice = filters.maxPrice;
    return p;
  }, [filters, page]);

  const { data, isLoading, isFetching, isError } = useGetListingsQuery(queryParams);
  const listings: any[] = data?.data ?? [];
  const meta = data?.meta;

  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, val: Filters[K]) => {
      setFilters((f) => ({ ...f, [key]: val }));
      setPage(1);
    },
    []
  );

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'sort' && v !== '' && v !== EMPTY_FILTERS[k as keyof Filters]
  ).length;

  const activeChips: { label: string; clear: () => void }[] = [];
  if (filters.cropId) {
    const crop = crops.find((c) => c._id === filters.cropId);
    if (crop) activeChips.push({ label: crop.name, clear: () => setFilter('cropId', '') });
  }
  if (filters.state) activeChips.push({ label: filters.state, clear: () => setFilter('state', '') });
  if (filters.district) activeChips.push({ label: filters.district, clear: () => setFilter('district', '') });
  if (filters.minPrice) activeChips.push({ label: `Min ₹${filters.minPrice}`, clear: () => setFilter('minPrice', '') });
  if (filters.maxPrice) activeChips.push({ label: `Max ₹${filters.maxPrice}`, clear: () => setFilter('maxPrice', '') });

  return (
    <div className="min-h-screen">
      {/* ── Top Search Bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="marketplace-search"
              type="text"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search crops, districts, states..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-colors"
            />
          </div>

          {/* Filter toggle — mobile */}
          <button
            id="filter-toggle-btn"
            onClick={() => setFilterOpen((o) => !o)}
            className={`md:hidden flex items-center gap-1.5 h-11 px-4 rounded-xl border text-sm font-medium transition-colors ${
              filterOpen || activeFilterCount > 0
                ? 'bg-amber-600 text-white border-amber-600'
                : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>

          {/* Sort — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="h-11 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* ── Filter Bar — desktop horizontal ─────────────────────── */}
        <div className="hidden md:flex items-center gap-3 px-4 pb-3 max-w-7xl mx-auto flex-wrap">
          {/* Crop */}
          <select
            id="filter-crop"
            value={filters.cropId}
            onChange={(e) => setFilter('cropId', e.target.value)}
            className="h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            <option value="">All Crops</option>
            {crops.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* State */}
          <input
            id="filter-state"
            type="text"
            value={filters.state}
            onChange={(e) => setFilter('state', e.target.value)}
            placeholder="State"
            className="h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors w-28"
          />

          {/* District */}
          <input
            id="filter-district"
            type="text"
            value={filters.district}
            onChange={(e) => setFilter('district', e.target.value)}
            placeholder="District"
            className="h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors w-28"
          />

          {/* Price range */}
          <div className="flex items-center gap-1">
            <input
              id="filter-min-price"
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilter('minPrice', e.target.value)}
              placeholder="Min ₹"
              min="0"
              className="h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors w-24"
            />
            <span className="text-stone-400 text-sm">–</span>
            <input
              id="filter-max-price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilter('maxPrice', e.target.value)}
              placeholder="Max ₹"
              min="0"
              className="h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors w-24"
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="h-9 px-3 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/40"
            >
              ✕ Clear all
            </button>
          )}
        </div>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="md:hidden px-4 pb-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 grid grid-cols-2 gap-3 pt-3">
            <select
              value={filters.cropId}
              onChange={(e) => setFilter('cropId', e.target.value)}
              className="col-span-2 h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Crops</option>
              {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => setFilter('state', e.target.value)}
              placeholder="State"
              className="h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              value={filters.district}
              onChange={(e) => setFilter('district', e.target.value)}
              placeholder="District"
              className="h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilter('minPrice', e.target.value)}
              placeholder="Min ₹"
              className="h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilter('maxPrice', e.target.value)}
              placeholder="Max ₹"
              className="h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="col-span-2 h-10 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { clearFilters(); setFilterOpen(false); }}
                className="col-span-2 h-10 rounded-xl border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                ✕ Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Results summary + active chips */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-600 dark:text-stone-400 font-sans">
              {isLoading ? (
                <span className="inline-block h-4 w-40 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
              ) : (
                <>
                  <span className="font-semibold text-stone-800 dark:text-stone-100">
                    {meta?.total?.toLocaleString('en-IN') ?? 0}
                  </span>{' '}
                  listing{meta?.total !== 1 ? 's' : ''} available
                  {activeFilterCount > 0 && ' (filtered)'}
                </>
              )}
            </p>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip, i) => (
                <FilterChip key={i} label={chip.label} onRemove={chip.clear} />
              ))}
            </div>
          )}
        </div>

        {/* ── Grid ──────────────────────────────────────────────────── */}
        {isError ? (
          <div className="py-20 text-center space-y-4">
            <svg className="w-12 h-12 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-stone-500 dark:text-stone-400 font-sans">Failed to load listings.</p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-400 dark:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-xl text-stone-800 dark:text-stone-100">No listings found</p>
                  <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Check back soon — more crops are listed daily.'}
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((l) => <CropCard key={l._id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-5 py-3 shadow-sm">
            <button
              id="prev-page-btn"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Prev
            </button>

            <div className="text-sm text-stone-600 dark:text-stone-400 font-sans">
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
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
