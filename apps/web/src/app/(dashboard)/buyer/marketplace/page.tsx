'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGetListingsQuery, useGetListingsForMapQuery } from '@/store/endpoints/listingsApi';
import { useGetCropsQuery } from '@/store/endpoints/cropsApi';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ListingsMapView from '@/components/marketplace/ListingsMapView';
import { getCategoryClass } from '@/components/shared/statusHelper';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/shared/Pagination';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { Search, Globe, Filter, X, Grid, Map } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const formatPrice = (n: number) => '₹' + n.toLocaleString('en-IN');

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

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
  const tBuyer = useTranslations('buyerMarketplace');
  const tCrop = useTranslations('cropSelector');

  return (
    <Link
      href={`/buyer/marketplace/${listing._id}`}
      className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-950">
        {thumb ? (
          <Image
            src={thumb}
            alt={crop?.name ?? 'Crop'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-2">
            <svg className="w-10 h-10 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-sans">{tCrop('noImage')}</span>
          </div>
        )}

        {crop?.category && (
          <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border backdrop-blur-sm ${getCategoryClass(crop.category)}`}>
            {crop.category}
          </span>
        )}

        {expDays !== null && expDays <= 3 && expDays > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm animate-pulse">
            {tBuyer('daysLeft', { days: expDays })}
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
          <span>{tBuyer('available', { quantity: listing.quantity, unit: listing.unit })}</span>
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
              {tBuyer('verified')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Removed local CardSkeleton - using shared component from Skeletons.tsx

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-medium border border-green-200/60 dark:border-green-800/40 shadow-sm animate-in zoom-in-95">
      {label}
      <button onClick={onRemove} className="hover:text-green-950 dark:hover:text-green-200 transition-colors p-0.5 rounded-full">
        <X className="w-3.5 h-3.5" />
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
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const tBuyer = useTranslations('buyerMarketplace');
  const tCommon = useTranslations('common');

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

  // Map view reuses the active filters (no pagination — slim geocoded set).
  const mapParams = useMemo(() => {
    const p: Record<string, any> = {};
    if (appliedFilters.cropId) p.cropId = appliedFilters.cropId;
    if (appliedFilters.state) p.state = appliedFilters.state;
    if (appliedFilters.district) p.district = appliedFilters.district;
    return p;
  }, [appliedFilters]);

  const {
    data: mapData,
    isLoading: isMapLoading,
    isError: isMapError,
  } = useGetListingsForMapQuery(mapParams, { skip: view !== 'map' });
  const mapListings: any[] = mapData?.data ?? [];

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
    if (appliedFilters.search) chips.push({ label: tBuyer('searchPrefix', { term: appliedFilters.search }), clear: () => removeSpecificFilter('search') });
    if (appliedFilters.cropId) {
      const crop = crops.find((c) => c._id === appliedFilters.cropId);
      if (crop) chips.push({ label: crop.name, clear: () => removeSpecificFilter('cropId') });
    }
    if (appliedFilters.state) chips.push({ label: appliedFilters.state, clear: () => removeSpecificFilter('state') });
    if (appliedFilters.district) chips.push({ label: appliedFilters.district, clear: () => removeSpecificFilter('district') });
    return chips;
  }, [appliedFilters, crops]);

  const selectStyles = "h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer appearance-none pr-10";

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      
      {/* ── TOP SEARCH & ACTION PANEL ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
        <form onSubmit={handleApplyFilters} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                id="marketplace-search"
                type="text"
                value={localFilters.search}
                onChange={(e) => handleUpdateLocalFilter('search', e.target.value)}
                placeholder={tBuyer('searchPlaceholder')}
                className="h-12 pl-12 rounded-xl bg-stone-50 dark:bg-stone-950"
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
              <Filter className="w-4 h-4" />
              {tCommon('filter')} {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {/* Submit execution handler wrapper for Desktop */}
            <button
              type="submit"
              className="hidden md:flex h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium items-center justify-center transition-colors shadow-sm whitespace-nowrap"
            >
              {tCommon('search')}
            </button>
          </div>

          {/* Desktop Filter Tool Bar Row Layout (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            <Select
              value={localFilters.cropId || "all"}
              onValueChange={(val) => handleUpdateLocalFilter('cropId', (val === 'all' || !val) ? '' : val)}
            >
              <SelectTrigger className="h-12 w-48 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-850 dark:text-stone-100 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer flex justify-between items-center gap-1.5 [&>span]:line-clamp-1">
                <SelectValue placeholder={tBuyer('allCrops')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-md max-h-60 overflow-y-auto">
                <SelectItem value="all" className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                  {tBuyer('allCrops')}
                </SelectItem>
                {crops.map((c) => (
                  <SelectItem key={c._id} value={c._id} className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              value={localFilters.state}
              onChange={(e) => handleUpdateLocalFilter('state', e.target.value)}
              placeholder={tBuyer('state')}
              className="h-12 rounded-xl w-32"
            />

            <Input
              type="text"
              value={localFilters.district}
              onChange={(e) => handleUpdateLocalFilter('district', e.target.value)}
              placeholder={tBuyer('district')}
              className="h-12 rounded-xl w-36"
            />

            <Select
              value={localFilters.sort}
              onValueChange={(val) => handleSortChange(val || 'newest')}
            >
              <SelectTrigger className="h-12 w-40 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-850 dark:text-stone-100 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer flex justify-between items-center gap-1.5 [&>span]:line-clamp-1 ml-auto">
                <SelectValue placeholder={tBuyer('newestFirst')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-md">
                <SelectItem value="newest" className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                  {tBuyer('newestFirst')}
                </SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-4 rounded-xl text-sm font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors border border-transparent hover:border-red-100"
              >
                {tBuyer('clearAll')}
              </button>
            )}
          </div>
        </form>

        {/* Mobile Expandable Filter Grid Block */}
        {filterOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Select
                  value={localFilters.cropId || "all"}
                  onValueChange={(val) => handleUpdateLocalFilter('cropId', (val === 'all' || !val) ? '' : val)}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-850 dark:text-stone-100 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer flex justify-between items-center gap-1.5 [&>span]:line-clamp-1">
                    <SelectValue placeholder={tBuyer('allCrops')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-md max-h-60 overflow-y-auto">
                    <SelectItem value="all" className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                      {tBuyer('allCrops')}
                    </SelectItem>
                    {crops.map((c) => (
                      <SelectItem key={c._id} value={c._id} className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                type="text"
                value={localFilters.state}
                onChange={(e) => handleUpdateLocalFilter('state', e.target.value)}
                placeholder={tBuyer('state')}
                className="h-12 rounded-xl"
              />
              <Input
                type="text"
                value={localFilters.district}
                onChange={(e) => handleUpdateLocalFilter('district', e.target.value)}
                placeholder={tBuyer('district')}
                className="h-12 rounded-xl"
              />
              
              <div className="col-span-2">
                <Select
                  value={localFilters.sort}
                  onValueChange={(val) => handleSortChange(val || 'newest')}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-850 dark:text-stone-100 px-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-green-800 transition-colors shadow-sm cursor-pointer flex justify-between items-center gap-1.5 [&>span]:line-clamp-1">
                    <SelectValue placeholder={tBuyer('newestFirst')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-md">
                    <SelectItem value="newest" className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer">
                      {tBuyer('newestFirst')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="h-12 flex-1 rounded-xl border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-sans font-medium text-sm transition-colors active:scale-95"
                >
                  {tCommon('clear')}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleApplyFilters()}
                className="h-12 flex-[2] rounded-xl bg-green-800 text-white font-sans font-medium text-sm transition-colors active:scale-95 shadow-sm"
              >
                {tBuyer('applyFilters')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MARKETPLACE FEED GRID WINDOW ─────────────────────────────────────────── */}
      <div className="space-y-4">
        
        {/* Metric Response Summary Area */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone-600 dark:text-stone-400 font-sans font-medium">
              {isLoading ? (
                <span className="inline-block h-4 w-44 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
              ) : (
                activeFilterCount > 0
                  ? tBuyer('cropsAvailableFiltered', { total: meta?.total?.toLocaleString('en-IN') ?? 0 })
                  : tBuyer('cropsAvailable', { total: meta?.total?.toLocaleString('en-IN') ?? 0 })
              )}
            </p>

            {/* Grid / Map view toggle */}
            <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-0.5 shadow-sm flex-shrink-0">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.65rem] text-xs font-medium font-sans transition-colors ${
                  view === 'grid'
                    ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                <Grid className="w-4 h-4" />
                {tBuyer('gridView')}
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.65rem] text-xs font-medium font-sans transition-colors ${
                  view === 'map'
                    ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                <Map className="w-4 h-4" />
                {tBuyer('mapView')}
              </button>
            </div>
          </div>

          {/* Dynamic Active Filter Validation Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip, i) => (
                <FilterChip key={i} label={chip.label} onRemove={chip.clear} />
              ))}
            </div>
          )}
        </div>

        {/* ── MAP VIEW ─────────────────────────────────────────────────────────── */}
        {view === 'map' ? (
          isMapError ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 text-center space-y-4 shadow-sm">
              <svg className="w-12 h-12 mx-auto text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-stone-600 dark:text-stone-400 font-sans font-medium">{tBuyer('errorLoading')}</p>
            </div>
          ) : (
            <div className="relative">
              <ListingsMapView listings={mapListings} />
              {isMapLoading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white dark:bg-stone-900 rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 text-xs font-sans text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  <svg className="animate-spin h-3.5 w-3.5 text-green-700" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {tBuyer('loadingMap')}
                </div>
              )}
              {!isMapLoading && mapListings.length === 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white dark:bg-stone-900 rounded-full px-4 py-1.5 shadow-md text-xs font-sans font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  {tBuyer('noMappedCrops')}
                </div>
              )}
            </div>
          )
        ) : (
        <>
        {/* Main Interface Content Delivery State Guard */}
        {isError ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 text-center space-y-4 shadow-sm">
            <svg className="w-12 h-12 mx-auto text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-stone-600 dark:text-stone-400 font-sans font-medium">{tBuyer('errorLoading')}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm"
            >
              {tBuyer('retry')}
            </button>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <EmptyState
                icon={Globe}
                title={tBuyer('noCropsAvailable')}
                subtitle={activeFilterCount > 0 ? tBuyer('changeFilters') : tBuyer('comingSoon')}
                action={activeFilterCount > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="h-11 px-6 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    {tBuyer('removeFilters')}
                  </button>
                ) : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {listings.map((l) => <CropCard key={l._id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {/* ── PAGINATION PANEL ROW CONTROL ────────────────────────────────────────────── */}
        <Pagination
          page={page}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={setPage}
          isFetching={isFetching}
        />
        </>
        )}
      </div>
    </div>
  );
}