'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { OrderStatus } from '@kropi/schemas/enum';

const ORDER_STATUS_FILTERS = [
  'sale_confirmed', 'admin_notified', 'qc_scheduled', 'qc_passed',
  'qc_failed', 'pickup_scheduled', 'in_transit', 'delivered',
] as const;

export default function KisanOrdersPage() {
  const router = useRouter();
  const tStatus = useTranslations('status');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useGetOrdersQuery({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const orders = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={['kisan']}>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <header>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            Confirmed Deals
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-2">
            Track the status of all your accepted orders.
          </p>
        </header>

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {(['', ...ORDER_STATUS_FILTERS] as const).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-green-800 dark:bg-green-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {status === '' ? 'All Orders' : tStatus(status as OrderStatus)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-16 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-xl text-stone-700 dark:text-stone-300">No orders found</p>
              <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">
                {statusFilter ? 'Try a different status filter.' : 'Accept a buyer interest to create your first order.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-stone-50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800">
                    <tr className="font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Crop</th>
                      <th className="px-6 py-4 font-medium">Buyer</th>
                      <th className="px-6 py-4 font-medium text-right">Total</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => router.push(`/kisan/orders/${order._id}`)}
                        className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-stone-500 dark:text-stone-400">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-sans font-medium text-stone-800 dark:text-stone-100">
                          {(order.listingId as any)?.cropId?.name ?? '—'}
                        </td>
                        <td className="px-6 py-4 font-sans text-stone-600 dark:text-stone-300">
                          {(order.buyerId as any)?.name ?? '—'}
                        </td>
                        <td className="px-6 py-4 font-sans font-medium text-stone-800 dark:text-stone-100 text-right">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 font-sans text-sm text-stone-500 dark:text-stone-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/kisan/orders/${order._id}`)}
                  className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm cursor-pointer hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98] transition-all duration-200 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-xs text-stone-400 mb-0.5">#{order._id.slice(-6).toUpperCase()}</p>
                      <p className="font-serif text-lg text-stone-800 dark:text-stone-100">{(order.listingId as any)?.cropId?.name ?? '—'}</p>
                      <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-0.5">Buyer: {(order.buyerId as any)?.name ?? '—'}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="font-sans text-xs text-stone-400 uppercase tracking-wider">Total</span>
                    <span className="font-sans font-medium text-green-800 dark:text-green-500">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
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
