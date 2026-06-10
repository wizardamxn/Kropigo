'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useGetMyInterestsQuery } from '@/store/endpoints/interestsApi';
import { useTranslations } from 'next-intl';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtPrice = (n: number) => '₹' + n.toLocaleString('en-IN');

const fmtRelative = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

// ─── STATUS CONFIGURATION ────────────────────────────────────────────────────

type Status = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

const STATUS_TABS: { value: '' | Status; labelKey: string }[] = [
  { value: '', labelKey: 'tabAll' },
  { value: 'pending', labelKey: 'tabPending' },
  { value: 'accepted', labelKey: 'tabAccepted' },
  { value: 'rejected', labelKey: 'tabDeclined' },
  { value: 'withdrawn', labelKey: 'tabWithdrawn' },
];

const statusConfig: Record<Status, { badge: string; labelKey: string }> = {
  pending: {
    badge: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
    labelKey: 'badgePending',
  },
  accepted: {
    badge: 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200/60 dark:border-green-800/40',
    labelKey: 'badgeAccepted',
  },
  rejected: {
    badge: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-800/40',
    labelKey: 'badgeDeclined',
  },
  withdrawn: {
    badge: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
    labelKey: 'badgeWithdrawn',
  },
};

// ─── RE-ENGINEERED INTEREST CARD ─────────────────────────────────────────────

function InterestCard({ interest, t }: { interest: any, t: any }) {
  const listing = interest.listingId;
  const crop = listing?.cropId;
  const thumb = listing?.mediaUrls?.[0];
  const cfg = statusConfig[interest.status as Status] ?? statusConfig.pending;
  const totalValue = interest.quantity ? interest.price * interest.quantity : null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      
      {/* Top Section: Identity + Status */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0">
          {/* Compact, Uniform Thumbnail Box */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 flex-shrink-0 overflow-hidden">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100 truncate leading-tight">
              {crop?.name ?? '—'}
            </h3>
            {crop?.category && (
              <span className="inline-block text-xs font-sans text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                {crop.category}
              </span>
            )}
          </div>
        </div>

        {/* Crisp text-only status badge (No animation dots) */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shadow-sm h-7 ${cfg.badge}`}>
          {t(cfg.labelKey)}
        </span>
      </div>

      {/* Grid Layout: Completely replaces formatting layout wraps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 dark:bg-stone-950/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/60">
        <div>
          <span className="block text-[10px] uppercase font-sans font-semibold tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('offeredPrice')}</span>
          <span className="font-sans text-sm font-bold text-stone-800 dark:text-stone-200">
            {fmtPrice(interest.price)}<span className="text-stone-400 font-normal text-xs">/{listing?.unit}</span>
          </span>
        </div>
        
        <div>
          <span className="block text-[10px] uppercase font-sans font-semibold tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('volumeRequested')}</span>
          <span className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300">
            {interest.quantity ? `${interest.quantity} ${listing?.unit}` : t('fullBatch')}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-stone-200/60 dark:border-stone-800/60 pt-2 sm:pt-0 sm:pl-3">
          <span className="block text-[10px] uppercase font-sans font-semibold tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('estimatedValue')}</span>
          <span className="font-sans text-sm font-bold text-green-800 dark:text-green-500">
            {totalValue ? fmtPrice(totalValue) : '—'}
          </span>
        </div>
      </div>

      {/* Bottom Control Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 w-full">
        <span className="text-xs text-stone-400 dark:text-stone-500 font-sans font-medium">
          {interest.status === 'accepted'
            ? t('acceptedAt', { date: fmtRelative(interest.updatedAt) })
            : interest.status === 'rejected'
            ? t('declinedAt', { date: fmtRelative(interest.updatedAt) })
            : t('submittedAt', { date: fmtRelative(interest.createdAt) })}
        </span>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {interest.status === 'accepted' && (
            <Link
              href={interest.orderId ? `/buyer/orders/${interest.orderId}` : '#'}
              className="h-10 px-4 text-xs font-semibold bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-xl font-sans flex items-center justify-center gap-1.5 transition-colors shadow-sm order-1 sm:order-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {t('trackLogistics')}
            </Link>
          )}
          {listing?._id && (
            <Link
              href={`/buyer/marketplace/${typeof listing === 'string' ? listing : listing._id}`}
              className="h-10 px-4 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-sans flex items-center justify-center gap-1 transition-colors border border-stone-200/40 dark:border-stone-700 order-2 sm:order-1"
            >
              {t('viewListingSource')}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── SKELETON COMPONENT ──────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-1/2">
          <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-xl flex-shrink-0" />
          <div className="space-y-1.5 w-full">
            <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
            <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
          </div>
        </div>
        <div className="h-7 bg-stone-200 dark:bg-stone-800 rounded-full w-24" />
      </div>
      <div className="h-14 bg-stone-50 dark:bg-stone-950/40 rounded-xl w-full" />
    </div>
  );
}

const EMPTY_KEYS: Record<string, { titleKey: string; subKey: string }> = {
  '': { titleKey: 'noInterestsTitle', subKey: 'noInterestsSub' },
  pending: { titleKey: 'noPendingTitle', subKey: 'noPendingSub' },
  accepted: { titleKey: 'noAcceptedTitle', subKey: 'noAcceptedSub' },
  rejected: { titleKey: 'noDeclinedTitle', subKey: 'noDeclinedSub' },
  withdrawn: { titleKey: 'noWithdrawnTitle', subKey: 'noWithdrawnSub' },
};

// ─── MAIN HUB CONTROLLER ─────────────────────────────────────────────────────

export default function MyInterestsPage() {
  const [activeTab, setActiveTab] = useState<'' | Status>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetMyInterestsQuery(
    activeTab ? { status: activeTab, page, limit: 10 } : { page, limit: 10 }
  );

  const t = useTranslations('buyerInterests');

  const interests: any[] = data?.data ?? [];
  const meta = data?.meta;
  const emptyKeys = EMPTY_KEYS[activeTab];

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">

        {/* Header Block */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {t('title')}
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-1 text-sm md:text-base">
            {t('subtitle')}
          </p>
        </div>

        {/* Tab Selection Filter System */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_TABS.map((tab) => {
            const isTabActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                id={`tab-${tab.value || 'all'}`}
                onClick={() => { setActiveTab(tab.value); setPage(1); }}
                className={`flex-shrink-0 h-12 px-5 rounded-xl text-sm font-semibold font-sans transition-all active:scale-95 border whitespace-nowrap ${
                  isTabActive
                    ? 'bg-green-800 border-green-800 text-white shadow-sm dark:bg-green-700 dark:border-green-700'
                    : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Main Content Render Gate */}
        {isError ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 text-center space-y-4 shadow-sm">
            <svg className="w-12 h-12 mx-auto text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-stone-600 dark:text-stone-400 font-sans font-medium">{t('failedToLoad')}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm"
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : interests.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm px-4">
                <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">{t(emptyKeys.titleKey)}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-sans mt-1 max-w-xs mx-auto leading-relaxed">{t(emptyKeys.subKey)}</p>
                </div>
                {activeTab === '' && (
                  <Link
                    href="/buyer/marketplace"
                    className="h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center justify-center shadow-sm w-full sm:w-auto mt-2"
                  >
                    {t('browseMarketplace')}
                  </Link>
                )}
              </div>
            ) : (
              interests.map((interest) => (
                <InterestCard key={interest._id} interest={interest} t={t} />
              ))
            )}
          </div>
        )}

        {/* Pagination Row Block */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 px-5 py-3.5 shadow-sm mt-4">
            <button
              id="interests-prev-btn"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {t('prev')}
            </button>
            
            <span className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {t.rich('pageIndicator', {
                current: meta.page,
                total: meta.totalPages,
                bold: (chunks) => <span className="font-semibold text-stone-800 dark:text-stone-100">{chunks}</span>
              })}
            </span>
            
            <button
              id="interests-next-btn"
              disabled={page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              {t('next')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}