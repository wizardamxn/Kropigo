'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useGetMyInterestsQuery } from '@/store/endpoints/interestsApi';
import { useWithdrawInterestMutation } from '@/store/endpoints/listingsApi';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/shared/Pagination';
import { ListSkeleton } from '@/components/shared/Skeletons';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { FileText, AlertTriangle, ImageIcon, ClipboardList, ExternalLink } from 'lucide-react';

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


// ─── RE-ENGINEERED INTEREST CARD ─────────────────────────────────────────────

function InterestCard({ interest, t }: { interest: any, t: any }) {
  const tCommon = useTranslations('common');
  const listing = interest.listingId;
  const crop = listing?.cropId;
  const thumb = listing?.mediaUrls?.[0];
  const totalValue = interest.quantity ? interest.price * interest.quantity : null;
  const listingId = typeof listing === 'string' ? listing : listing?._id;

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawInterest, { isLoading: isWithdrawing }] = useWithdrawInterestMutation();

  const handleWithdraw = async () => {
    if (!listingId) return;
    try {
      await withdrawInterest({ listingId, interestId: interest._id }).unwrap();
      setWithdrawOpen(false);
    } catch {
      setWithdrawOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      
      {/* Top Section: Identity + Status */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0">
          {/* Compact, Uniform Thumbnail Box */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 shrink-0 overflow-hidden">
            {thumb ? (
              <Image src={thumb} alt="" fill className="object-cover" sizes="56px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <ImageIcon className="w-5 h-5" />
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

        <StatusBadge status={interest.status} />
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
              <ClipboardList className="w-4 h-4" />
              {t('trackLogistics')}
            </Link>
          )}
          {listing?._id && (
            <Link
              href={`/buyer/marketplace/${typeof listing === 'string' ? listing : listing._id}`}
              className="h-10 px-4 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-sans flex items-center justify-center gap-1 transition-colors border border-stone-200/40 dark:border-stone-700 order-2 sm:order-1"
            >
              {t('viewListingSource')}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {interest.status === 'pending' && listingId && (
            <button
              onClick={() => setWithdrawOpen(true)}
              disabled={isWithdrawing}
              className="h-10 px-4 text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-sans flex items-center justify-center gap-1.5 transition-colors border border-red-200/60 dark:border-red-800/40 order-3 disabled:opacity-60"
            >
              {isWithdrawing ? t('withdrawing') : t('withdrawBtn')}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title={t('withdrawConfirmTitle')}
        description={t('withdrawConfirmDesc')}
        onConfirm={handleWithdraw}
        confirmText={isWithdrawing ? t('withdrawing') : t('withdrawConfirmYes')}
        isLoading={isWithdrawing}
        variant="destructive"
      />

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

        <PageHeader title={t('title')} subtitle={t('subtitle')} />

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
          <EmptyState
            icon={AlertTriangle}
            title={t('failedToLoad')}
            action={
              <button
                onClick={() => window.location.reload()}
                className="h-11 px-6 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm cursor-pointer"
              >
                {t('retry')}
              </button>
            }
          />
        ) : (
          <div className={`space-y-4 transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {isLoading ? (
              <ListSkeleton count={4} />
            ) : interests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t(emptyKeys.titleKey)}
                subtitle={t(emptyKeys.subKey)}
                action={
                  activeTab === '' ? (
                    <Link
                      href="/buyer/marketplace"
                      className="h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center justify-center shadow-sm w-full sm:w-auto mt-2"
                    >
                      {t('browseMarketplace')}
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              interests.map((interest) => (
                <InterestCard key={interest._id} interest={interest} t={t} />
              ))
            )}
          </div>
        )}

        {/* Pagination Row Block */}
        {meta && (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            isFetching={isFetching}
          />
        )}

      </div>
    </RoleGuard>
  );
}