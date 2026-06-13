'use client';

import { useAuth } from '@/hooks/useAuth';
import { useGetListingsQuery } from '@/store/endpoints/listingsApi';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { List, Activity, FileText, CheckCircle, Package, AlertTriangle } from 'lucide-react';

export default function KisanDashboard() {
  const { user } = useAuth();
  const t = useTranslations('kisanDashboard');
  const tCommon = useTranslations('common');
  const { data, isLoading, isError } = useGetListingsQuery(
    { sellerId: user?.id, limit: 100 },
    { skip: !user?.id }
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-10 bg-stone-100 dark:bg-stone-800 rounded-lg w-1/3 animate-pulse" />
          <div className="h-5 bg-stone-100 dark:bg-stone-800 rounded-lg w-1/4 animate-pulse" />
        </div>
        <CardSkeleton count={4} />
        <div className="h-64 bg-stone-100 dark:bg-stone-800 rounded-2xl w-full animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
        <p className="font-sans text-red-800 dark:text-red-300 font-medium">{t('failedToLoad')}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">{tCommon('tryAgain')}</button>
      </div>
    );
  }

  const listings: any[] = data?.data ?? [];
  const open = listings.filter((l) => l.status === 'open').length;
  const sold = listings.filter((l) => ['sale_confirmed', 'closed'].includes(l.status)).length;
  const draft = listings.filter((l) => l.status === 'draft').length;

  const interestListings = listings.filter((l) => (l.interestCount ?? 0) > 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <PageHeader
        title={t('title')}
        subtitle={t('welcomeBack', { name: user?.name ?? '' })}
      />

      {/* Summary Cards Grid */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={t('totalListings')} value={listings.length} icon={List} href="/kisan/listings" />
          <StatCard title={t('activeOpen')} value={open} icon={Activity} color="green" href="/kisan/listings" />
          <StatCard title={t('drafts')} value={draft} icon={FileText} color="stone" href="/kisan/listings" />
          <StatCard title={t('soldClosed')} value={sold} icon={CheckCircle} color="blue" href="/kisan/listings" />
        </div>
      </section>

      {/* Activity Summary */}
      <section className="bg-stone-50 dark:bg-stone-900/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">{t('activity')}</h2>
        <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-amber-700 dark:text-amber-400 text-base">{interestListings}</span>{' '}
          {t('interestMessage', { count: interestListings }).replace('{count}', '')}{' '}
          Visit <Link href="/kisan/listings" className="underline text-green-800 dark:text-green-500">{t('visitListings')}</Link> to review and act on offers.
        </p>
      </section>

      {/* Recent Listings Section */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">{t('recentListings')}</h2>
          <Link 
            href="/kisan/listings" 
            className="font-sans text-sm font-medium text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:underline px-2 py-1 rounded-lg"
          >
            {tCommon('viewAll')}
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('noListings')}
            action={
              <Link 
                href="/kisan/listings/create" 
                className="mt-2 h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors inline-flex items-center justify-center"
              >
                {t('createFirst')}
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/50 font-sans text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">{t('crop')}</th>
                    <th className="px-6 py-4 font-medium">{t('quantity')}</th>
                    <th className="px-6 py-4 font-medium">{t('status')}</th>
                    <th className="px-6 py-4 font-medium text-center">{tCommon('interests')}</th>
                    <th className="px-6 py-4 font-medium">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {listings.slice(0, 5).map((l) => (
                    <tr key={l._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium">
                        <Link href={`/kisan/listings/${l._id}/view`} className="hover:underline">
                          {l.cropId?.name ?? l.cropId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-sans text-stone-600 dark:text-stone-300">
                        {l.quantity} <span className="text-stone-400 text-sm">{l.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {l.interestCount > 0 ? (
                          <span className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                            {l.interestCount}
                            {l.hasUnreadInterests && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-stone-500 dark:text-stone-400">
                        {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col gap-4 divide-y divide-stone-100 dark:divide-stone-800">
              {listings.slice(0, 5).map((l) => (
                <Link
                  key={l._id}
                  href={`/kisan/listings/${l._id}/view`}
                  className="p-4 flex flex-col gap-3 hover:bg-stone-50/40 dark:hover:bg-stone-800/10 active:scale-[0.99] transition-all duration-200 block text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
                        {l.cropId?.name ?? l.cropId}
                      </h3>
                      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                        {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="flex justify-between items-end bg-stone-50 dark:bg-stone-950/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex flex-col">
                      <span className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('quantity')}</span>
                      <span className="font-sans text-stone-800 dark:text-stone-200">{l.quantity} {l.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
