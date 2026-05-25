'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Link from 'next/link';

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

// Order progress steps in sequence
const PROGRESS_STEPS = [
  'sale_confirmed',
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
];

function OrderProgressBar({ status }: { status: string }) {
  if (status === 'qc_failed') {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-sans">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        QC Failed — Our team will contact you
      </div>
    );
  }
  const currentStep = PROGRESS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 w-full">
      {PROGRESS_STEPS.map((step, idx) => (
        <div
          key={step}
          className={`flex-1 h-1.5 rounded-full transition-colors ${
            idx <= currentStep
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-stone-200 dark:bg-stone-700'
          }`}
          title={STATUS_LABELS[step]}
        />
      ))}
    </div>
  );
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useGetOrdersQuery({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const orders = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <header>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            My Orders
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-2">
            Track every confirmed deal from QC to delivery.
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
                  ? 'bg-amber-700 dark:bg-amber-800 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {status === '' ? 'All Orders' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-16 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-xl text-stone-700 dark:text-stone-300">No orders yet</p>
              <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">
                Submit an interest on a listing and wait for the kisan to accept.
              </p>
            </div>
            <Link href="/buyer/marketplace" className="mt-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-sans text-sm font-medium transition-colors">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/buyer/orders/${order._id}`)}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="font-serif text-xl text-stone-800 dark:text-stone-100">
                        {(order.listingId as any)?.cropId?.name ?? '—'}
                      </p>
                      <p className="font-mono text-xs text-stone-400 mt-0.5">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[order.status] ?? ''}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <p className="font-sans text-sm font-semibold text-stone-700 dark:text-stone-200">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <OrderProgressBar status={order.status} />

                  <div className="flex justify-between items-center mt-3">
                    <p className="font-sans text-xs text-stone-400">
                      {order.quantity} {order.unit} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-sans text-xs text-amber-700 dark:text-amber-500 font-medium flex items-center gap-1">
                      View details <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </p>
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
