'use client';

import { useState } from 'react';
import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';

const STATUS_LABELS: Record<string, string> = {
  sale_confirmed: 'Deal Confirmed',
  admin_notified: 'Admin Notified',
  qc_scheduled: 'QC Scheduled',
  qc_passed: 'QC Passed',
  qc_failed: 'QC Failed',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const STATUS_STYLES: Record<string, string> = {
  sale_confirmed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  admin_notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  qc_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  qc_passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50',
  qc_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50',
  pickup_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
  delivered: 'bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetOrdersQuery({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const orders = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <header>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            All Orders
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-2">
            {data?.pagination.total ?? 0} total orders on the platform
          </p>
        </header>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {['', ...Object.keys(STATUS_LABELS)].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {status === '' ? 'All Orders' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-stone-200 dark:bg-stone-800 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-16 flex flex-col items-center text-center gap-3 shadow-sm">
            <svg className="w-12 h-12 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-serif text-xl text-stone-700 dark:text-stone-300">No orders found</p>
            <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
              {statusFilter ? 'Try a different filter.' : 'Orders will appear here once deals are confirmed.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-stone-50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800">
                  <tr className="font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    <th className="px-5 py-4 font-medium">ID</th>
                    <th className="px-5 py-4 font-medium">Crop</th>
                    <th className="px-5 py-4 font-medium">Kisan</th>
                    <th className="px-5 py-4 font-medium">Buyer</th>
                    <th className="px-5 py-4 font-medium text-right">Total</th>
                    <th className="px-5 py-4 font-medium text-center">Status</th>
                    <th className="px-5 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => router.push(`/admin/orders/${order._id}`)}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-stone-400">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-sans font-medium text-stone-800 dark:text-stone-100">
                        {(order.listingId as any)?.cropId?.name ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-sans text-sm text-stone-700 dark:text-stone-200">{(order.sellerId as any)?.name ?? '—'}</p>
                        <p className="font-sans text-xs text-stone-400 dark:text-stone-500">{(order.sellerId as any)?.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-sans text-sm text-stone-700 dark:text-stone-200">{(order.buyerId as any)?.name ?? '—'}</p>
                        <p className="font-sans text-xs text-stone-400 dark:text-stone-500">{(order.buyerId as any)?.phone}</p>
                      </td>
                      <td className="px-5 py-4 font-sans font-medium text-stone-800 dark:text-stone-100 text-right">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-sans text-sm text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/admin/orders/${order._id}`)}
                  className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        {(order.listingId as any)?.cropId?.name ?? '—'}
                      </p>
                      <p className="font-mono text-xs text-stone-400">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLES[order.status] ?? ''}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2">
                      <p className="text-xs text-stone-400 mb-0.5">Kisan</p>
                      <p className="font-medium text-stone-700 dark:text-stone-200">{(order.sellerId as any)?.name ?? '—'}</p>
                      <p className="text-xs text-green-700 dark:text-green-400">{(order.sellerId as any)?.phone}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2">
                      <p className="text-xs text-stone-400 mb-0.5">Buyer</p>
                      <p className="font-medium text-stone-700 dark:text-stone-200">{(order.buyerId as any)?.name ?? '—'}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">{(order.buyerId as any)?.phone}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="font-sans text-xs text-stone-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="font-sans font-medium text-stone-800 dark:text-stone-100">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                {data?.pagination.total} total order{data?.pagination.total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-sans border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  ← Prev
                </button>
                <span className="px-3 py-2 text-sm font-sans text-stone-500 dark:text-stone-400">
                  {page} / {data?.pagination.pages ?? 1}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === (data?.pagination.pages ?? 1)}
                  className="px-4 py-2 text-sm font-sans border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 disabled:opacity-40 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
