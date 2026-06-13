'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { OrderStatus } from '@kropi/schemas/enum';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { ClipboardList } from 'lucide-react';

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

        <PageHeader
          title="Confirmed Deals"
          subtitle="Track the status of all your accepted orders."
        />

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
          <TableSkeleton rows={5} cols={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders found"
            subtitle={statusFilter ? 'Try a different status filter.' : 'Accept a buyer interest to create your first order.'}
          />
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
            <Pagination
              page={page}
              totalPages={data?.pagination.pages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </RoleGuard>
  );
}
