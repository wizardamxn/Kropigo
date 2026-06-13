'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGetListingsQuery, useDeleteListingMutation } from '@/store/endpoints/listingsApi';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';

const STATUS_OPTIONS = ['', 'draft', 'open', 'interest_received', 'sale_confirmed', 'cancelled', 'expired', 'closed'];

export default function KisanListings() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const t = useTranslations('kisanListings');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('kisanDashboard');

  const { data, isLoading, isError, isFetching } = useGetListingsQuery(
    { sellerId: user?.id, ...(status && { status }), page, limit: 10 },
    { skip: !user?.id }
  );

  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const listings: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await deleteListing(id);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded-lg w-48"></div>
          <div className="flex gap-2">
            <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl w-32"></div>
            <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl w-40"></div>
          </div>
        </div>
        <div className="h-96 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
        <svg className="w-12 h-12 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <p className="font-sans text-lg text-red-800 dark:text-red-300 font-medium">{t('failedToLoad')}</p>
        <button onClick={() => window.location.reload()} className="h-12 px-6 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">{tCommon('tryAgain')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {t('title')}
          </h1>
          <p className="font-sans text-sm text-stone-600 dark:text-stone-400 mt-1">
          {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="appearance-none h-12 w-full sm:w-48 px-4 pr-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-sans shadow-sm focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : t('allStatuses')}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <Link
            href="/kisan/listings/create"
            className="h-12 px-5 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('newListing')}
          </Link>
        </div>
      </div>

      {/* Main Content Area Container */}
      <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {listings.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-1">{t('noListingsFound')}</p>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                {status ? t('noListingsForStatus', { status: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }) : t('noListingsYet')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto min-w-[800px]">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-950/50 font-sans text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                      <th className="px-6 py-4">{tDashboard('crop')}</th>
                      <th className="px-6 py-4">{t('qty')}</th>
                      <th className="px-6 py-4">{tDashboard('status')}</th>
                      <th className="px-6 py-4 text-center">{tCommon('interests')}</th>
                      <th className="px-6 py-4 text-center">{t('views')}</th>
                      <th className="px-6 py-4">{t('date')}</th>
                      <th className="px-6 py-4 text-right">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans text-sm">
                    {listings.map((l) => {
                      const thumbUrl = l.mediaUrls?.[0];
                      return (
                        <tr key={l._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {thumbUrl ? (
                                <Image
                                  src={thumbUrl}
                                  alt={l.cropId?.name ?? ''}
                                  width={48}
                                  height={48}
                                  className="rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-800 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-800">
                                  <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <span className="text-stone-800 dark:text-stone-200 font-medium truncate max-w-[160px]">
                                {l.cropId?.name ?? l.cropId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-stone-600 dark:text-stone-300 font-medium">
                            {l.quantity} <span className="text-stone-400 text-xs font-normal">{l.unit}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={l.status} />
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {l.interestCount > 0 ? (
                              <span className="relative inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 shadow-sm">
                                {l.interestCount}
                                {l.hasUnreadInterests && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-stone-400 dark:text-stone-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center text-stone-500 dark:text-stone-400">
                            {l.viewCount || 0}
                          </td>
                          <td className="px-6 py-3.5 text-stone-500 dark:text-stone-400 text-xs">
                            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/kisan/listings/${l._id}/view`}
                                className="p-2 text-stone-500 hover:text-green-800 dark:text-stone-400 dark:hover:text-green-500 transition-colors rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                aria-label="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                href={`/kisan/listings/${l._id}`}
                                className="p-2 text-stone-500 hover:text-green-800 dark:text-stone-400 dark:hover:text-green-500 transition-colors rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                aria-label="Edit Listing"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </Link>
                              {['draft', 'open'].includes(l.status) && (
                                <button
                                  onClick={() => handleDelete(l._id)}
                                  disabled={isDeleting}
                                  className="p-2 text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                  aria-label="Delete Listing"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
              {listings.map((l) => {
                const thumbUrl = l.mediaUrls?.[0];
                return (
                  <div
                    key={l._id}
                    onClick={() => router.push(`/kisan/listings/${l._id}/view`)}
                    className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.99] transition-all duration-200"
                  >
                    {thumbUrl ? (
                      <div className="relative w-full h-32 overflow-hidden border-b border-stone-100 dark:border-stone-800">
                        <Image
                          src={thumbUrl}
                          alt={l.cropId?.name ?? ''}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center border-b border-stone-100 dark:border-stone-800">
                        <svg className="w-8 h-8 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-lg font-medium text-stone-800 dark:text-stone-100">{l.cropId?.name ?? l.cropId}</h3>
                          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>

                      <div className="grid grid-cols-1 gap-3 bg-stone-50 dark:bg-stone-950/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">{t('qty')}</span>
                          <span className="font-sans text-sm font-medium text-stone-800 dark:text-stone-200">{l.quantity} {l.unit}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-xs font-medium">
                            <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            {l.viewCount || 0}
                          </div>
                          {l.interestCount > 0 && (
                            <span className="relative inline-flex items-center px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 text-[11px] font-semibold">
                              {t('bids', { count: l.interestCount })}
                              {l.hasUnreadInterests && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link
                            href={`/kisan/listings/${l._id}/view`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            {tCommon('view')}
                          </Link>
                          <Link
                            href={`/kisan/listings/${l._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            {tCommon('edit')}
                          </Link>
                          {['draft', 'open'].includes(l.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(l._id);
                              }}
                              disabled={isDeleting}
                              className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                              aria-label="Delete listing"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Panel Section */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {tCommon('prev')}
                </button>

                <span className="font-sans text-xs text-stone-600 dark:text-stone-400">
                  {tCommon('page', { current: meta.page, total: meta.totalPages })}
                </span>

                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {tCommon('next')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}