'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useGetMyInterestsQuery } from '@/store/endpoints/interestsApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Status config ────────────────────────────────────────────────────────────

type Status = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

const STATUS_TABS: { value: '' | Status; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const statusConfig: Record<Status, { badge: string; dot: string; label: string }> = {
  pending: {
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  accepted: {
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50',
    dot: 'bg-green-500',
    label: 'Accepted',
  },
  rejected: {
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
    dot: 'bg-red-500',
    label: 'Rejected',
  },
  withdrawn: {
    badge: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
    dot: 'bg-stone-400',
    label: 'Withdrawn',
  },
};

// ─── Interest Card ────────────────────────────────────────────────────────────

function InterestCard({ interest }: { interest: any }) {
  const listing = interest.listingId;
  const crop = listing?.cropId;
  const thumb = listing?.mediaUrls?.[0];
  const cfg = statusConfig[interest.status as Status] ?? statusConfig.pending;
  const totalValue = interest.quantity
    ? interest.price * interest.quantity
    : null;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="flex items-stretch gap-0">
        {/* Thumbnail */}
        <div className="w-24 h-auto flex-shrink-0 bg-stone-100 dark:bg-stone-800 relative overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={crop?.name ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600 min-h-[88px]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-serif text-base font-medium text-stone-800 dark:text-stone-100 truncate">
                {crop?.name ?? '—'}
              </h3>
              {crop?.category && (
                <span className="text-xs text-stone-400 dark:text-stone-500 font-sans capitalize">{crop.category}</span>
              )}
            </div>

            {/* Status badge */}
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${interest.status === 'pending' ? 'animate-pulse' : ''}`} />
              {cfg.label}
            </span>
          </div>

          {/* Price & Qty row */}
          <div className="flex items-center gap-3 flex-wrap text-sm font-sans">
            <span className="font-semibold text-stone-800 dark:text-stone-100">
              {fmtPrice(interest.price)}
              <span className="text-stone-400 dark:text-stone-500 font-normal text-xs ml-0.5">/ {listing?.unit}</span>
            </span>
            {interest.quantity && (
              <>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="text-stone-600 dark:text-stone-300">{interest.quantity} {listing?.unit}</span>
              </>
            )}
            {totalValue && (
              <>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <span className="text-amber-700 dark:text-amber-500 font-semibold">
                  Total: {fmtPrice(totalValue)}
                </span>
              </>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-1">
            <span className="text-xs text-stone-400 dark:text-stone-500 font-sans">
              {interest.status === 'accepted'
                ? `Accepted ${fmtRelative(interest.updatedAt)}`
                : interest.status === 'rejected'
                ? `Declined ${fmtRelative(interest.updatedAt)}`
                : `Submitted ${fmtRelative(interest.createdAt)}`}
            </span>

            <div className="flex items-center gap-4">
              {interest.status === 'accepted' && (
                <div className="flex items-center gap-3">
                  <span className="text-green-600 dark:text-green-500 font-medium font-sans text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Deal Confirm Ho Gayi
                  </span>
                  <Link
                    href={interest.orderId ? `/buyer/orders/${interest.orderId}` : '#'}
                    className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-md font-sans transition-colors"
                  >
                    Order Track Karein
                  </Link>
                </div>
              )}
              {listing?._id && (
                <Link
                  href={`/buyer/marketplace/${typeof listing === 'string' ? listing : listing._id}`}
                  className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-500 hover:underline font-sans flex-shrink-0"
                >
                  View Listing
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse flex h-24">
      <div className="w-24 bg-stone-200 dark:bg-stone-800 flex-shrink-0" />
      <div className="flex-1 p-4 space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<string, { title: string; sub: string }> = {
  '': { title: 'No interests yet', sub: "You haven't expressed interest in any listings yet." },
  pending: { title: 'No pending interests', sub: 'Interests you submit will appear here while awaiting seller response.' },
  accepted: { title: 'No accepted offers', sub: 'Accepted interests will appear here once a kisan accepts your offer.' },
  rejected: { title: 'No rejected offers', sub: 'Declined interests will appear here.' },
  withdrawn: { title: 'No withdrawn interests', sub: 'Withdrawn interests will appear here.' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyInterestsPage() {
  const [activeTab, setActiveTab] = useState<'' | Status>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetMyInterestsQuery(
    activeTab ? { status: activeTab, page, limit: 10 } : { page, limit: 10 }
  );

  const interests: any[] = data?.data ?? [];
  const meta = data?.meta;
  const emptyMsg = EMPTY_MESSAGES[activeTab];

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            My Interests
          </h1>
          <p className="font-sans text-stone-500 dark:text-stone-400 mt-1 text-sm">
            Track all the crop offers you've submitted to kisans.
          </p>
        </div>

        {/* ── Status Tabs ─────────────────────────────────────────── */}
        <div className="flex overflow-x-auto gap-1 pb-0.5 -mx-0.5 px-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              id={`tab-${tab.value || 'all'}`}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className={`flex-shrink-0 h-9 px-4 rounded-lg text-sm font-medium transition-all font-sans ${
                activeTab === tab.value
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        {isError ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-red-600 dark:text-red-400 font-sans">Failed to load your interests.</p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className={`space-y-3 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            ) : interests.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400 dark:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-xl text-stone-800 dark:text-stone-100">{emptyMsg.title}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-sans mt-1 max-w-xs">{emptyMsg.sub}</p>
                </div>
                {activeTab === '' && (
                  <Link
                    href="/buyer/marketplace"
                    className="h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                )}
              </div>
            ) : (
              interests.map((interest) => (
                <InterestCard key={interest._id} interest={interest} />
              ))
            )}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-5 py-3 shadow-sm">
            <button
              id="interests-prev-btn"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Prev
            </button>
            <span className="text-sm text-stone-600 dark:text-stone-400 font-sans">
              Page <span className="font-semibold text-stone-800 dark:text-stone-100">{meta.page}</span> of {meta.totalPages}
            </span>
            <button
              id="interests-next-btn"
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
    </RoleGuard>
  );
}
