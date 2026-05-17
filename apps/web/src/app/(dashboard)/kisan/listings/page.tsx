'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useGetListingsQuery, useDeleteListingMutation } from '@/store/endpoints/listingsApi';

const STATUS_OPTIONS = ['', 'draft', 'open', 'interest_received', 'sale_confirmed', 'cancelled', 'expired', 'closed'];

const formatStatus = (status: string) => {
  if (!status) return 'All';
  return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
    case 'draft':
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    case 'sale_confirmed':
    case 'closed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    case 'cancelled':
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
    case 'interest_received':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    default:
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
  }
};

export default function KisanListings() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useGetListingsQuery(
    { sellerId: user?.id, ...(status && { status }), page, limit: 10 },
    { skip: !user?.id }
  );

  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();

  const listings: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
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
        <p className="font-sans text-lg text-red-800 dark:text-red-300 font-medium">Failed to load your listings.</p>
        <button onClick={() => window.location.reload()} className="h-12 px-6 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            My Listings
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-1">
            Manage your crop availability and prices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="appearance-none h-12 w-full sm:w-48 px-4 pr-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-sans shadow-sm focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{formatStatus(s)}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <Link
            href="/kisan/listings/create"
            className="h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Listing
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {listings.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-1">No listings found</p>
              <p className="font-sans text-stone-500 dark:text-stone-400">
                {status ? `You don't have any listings with the status "${formatStatus(status)}".` : "You haven't created any crop listings yet."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/50 font-sans text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
                    <th className="px-6 py-4 font-medium">Crop</th>
                    <th className="px-6 py-4 font-medium">Qty</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-center">Views</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {listings.map((l) => {
                    const thumbUrl = l.mediaUrls?.[0];
                    return (
                      <tr key={l._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                        {/* Crop column — thumbnail + name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={l.cropId?.name ?? ''}
                                className="w-54 h-24 rounded-lg object-cover flex-shrink-0 border border-stone-200 dark:border-stone-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 border border-stone-200 dark:border-stone-700">
                                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <span className="font-sans text-stone-800 dark:text-stone-200 font-medium">
                              {l.cropId?.name ?? l.cropId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-sans text-stone-600 dark:text-stone-300">
                          {l.quantity} <span className="text-stone-400 text-sm">{l.unit}</span>
                        </td>
                        <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium">
                          ₹{l.askingPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(l.status)}`}>
                            {formatStatus(l.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-sans text-stone-500 dark:text-stone-400">
                          {l.viewCount || 0}
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-stone-500 dark:text-stone-400">
                          {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <Link
                              href={`/kisan/listings/${l._id}/view`}
                              className="p-2 text-stone-500 hover:text-blue-600 dark:text-stone-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              aria-label="View Listing"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            {/* Edit */}
                            <Link
                              href={`/kisan/listings/${l._id}`}
                              className="p-2 text-stone-500 hover:text-green-700 dark:text-stone-400 dark:hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                              aria-label="Edit Listing"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </Link>
                            {/* Delete */}
                            {['draft', 'open'].includes(l.status) && (
                              <button
                                onClick={() => handleDelete(l._id)}
                                disabled={isDeleting}
                                className="p-2 text-stone-500 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
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

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
              {listings.map((l) => {
                const thumbUrl = l.mediaUrls?.[0];
                return (
                  <div key={l._id} className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col gap-0">

                    {/* Image banner */}
                    {thumbUrl ? (
                      <div className="w-full h-40 overflow-hidden">
                        <img
                          src={thumbUrl}
                          alt={l.cropId?.name ?? ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                        <svg className="w-10 h-10 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-xl font-medium text-stone-800 dark:text-stone-100">{l.cropId?.name ?? l.cropId}</h3>
                          <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(l.status)}`}>
                          {formatStatus(l.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-stone-50 dark:bg-stone-950/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                        <div className="flex flex-col">
                          <span className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Quantity</span>
                          <span className="font-sans text-stone-800 dark:text-stone-200">{l.quantity} {l.unit}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Asking Price</span>
                          <span className="font-sans font-medium text-green-800 dark:text-green-500">₹{l.askingPrice.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {l.viewCount || 0} views
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/kisan/listings/${l._id}/view`}
                            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/kisan/listings/${l._id}`}
                            className="h-10 px-4 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          >
                            Edit
                          </Link>
                          {['draft', 'open'].includes(l.status) && (
                            <button
                              onClick={() => handleDelete(l._id)}
                              disabled={isDeleting}
                              className="h-10 px-3 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Prev
                </button>

                <span className="font-sans text-sm text-stone-600 dark:text-stone-400">
                  Page <span className="font-medium text-stone-800 dark:text-stone-100">{meta.page}</span> of {meta.totalPages}
                </span>

                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
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
