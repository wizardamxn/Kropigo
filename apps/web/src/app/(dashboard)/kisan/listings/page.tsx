'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGetListingsQuery, useDeleteListingMutation } from '@/store/endpoints/listingsApi';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeletons';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Package, Eye, Pencil, Trash2, ChevronDown, Plus, AlertTriangle, ImageIcon } from 'lucide-react';

const STATUS_OPTIONS = ['', 'draft', 'open', 'interest_received', 'sale_confirmed', 'cancelled', 'expired', 'closed'];

export default function KisanListings() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useGetListingsQuery(
    { sellerId: user?.id, ...(status && { status }), page, limit: 10 },
    { skip: !user?.id }
  );

  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const listings: any[] = data?.data ?? [];
  const meta = data?.meta;

  const t = useTranslations('kisanListings');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('kisanDashboard');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t('failedToLoad')}
        action={
          <button onClick={() => window.location.reload()} className="h-12 px-6 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors cursor-pointer">{tCommon('tryAgain')}</button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      <ConfirmDialog
        isOpen={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={async () => {
          if (deleteId) {
            await deleteListing(deleteId).unwrap();
            setDeleteId(null);
          }
        }}
        title={tCommon('delete')}
        description={t('deleteConfirm')}
        confirmText={tCommon('delete')}
        isLoading={isDeleting}
        variant="destructive"
      />

      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
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
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <Link
              href="/kisan/listings/create"
              className="h-12 px-5 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              {t('newListing')}
            </Link>
          </div>
        }
      />

      {/* Main Content Area Container */}
      <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('noListingsFound')}
            subtitle={status ? t('noListingsForStatus', { status: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }) : t('noListingsYet')}
          />
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
                                  <ImageIcon className="w-5 h-5 text-stone-400" />
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
                                <Eye className="w-5 h-5" />
                              </Link>
                              <Link
                                href={`/kisan/listings/${l._id}`}
                                className="p-2 text-stone-500 hover:text-green-800 dark:text-stone-400 dark:hover:text-green-500 transition-colors rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                aria-label="Edit Listing"
                              >
                                <Pencil className="w-5 h-5" />
                              </Link>
                              {['draft', 'open'].includes(l.status) && (
                                <button
                                  onClick={() => setDeleteId(l._id)}
                                  disabled={isDeleting}
                                  className="p-2 text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                  aria-label="Delete Listing"
                                >
                                  <Trash2 className="w-5 h-5" />
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
                        <ImageIcon className="w-8 h-8 text-stone-300 dark:text-stone-600" />
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
                            <Eye className="w-4 h-4 opacity-75" />
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
                                setDeleteId(l._id);
                              }}
                              disabled={isDeleting}
                              className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                              aria-label="Delete listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {meta && (
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                isFetching={isFetching}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}