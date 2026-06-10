'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

// We will fetch STATUS_LABELS from translations in the component

const STATUS_STYLES: Record<string, string> = {
  sale_confirmed: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  admin_notified: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
  qc_scheduled: 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  qc_passed: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/30',
  qc_failed: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30',
  pickup_scheduled: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
  in_transit: 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
  delivered: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-300 border-green-200/50 dark:border-green-800/40',
};

const PROGRESS_STEPS = [
  'sale_confirmed',
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
];

function OrderProgressBar({ status, t }: { status: string, t: any }) {
  if (status === 'qc_failed') {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-sans font-medium bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        {t('qcFailedMsg')}
      </div>
    );
  }

  const currentStep = PROGRESS_STEPS.indexOf(status);
  
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-1 w-full">
        {PROGRESS_STEPS.map((step, idx) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              idx <= currentStep
                ? 'bg-green-800 dark:bg-green-600 shadow-sm'
                : 'bg-stone-200 dark:bg-stone-800'
            }`}
            title={t(`status${step.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[10px] font-sans text-stone-400 font-medium uppercase tracking-wider px-1">
        <span>{t('orderPlaced')}</span>
        <span>{t('outForDelivery')}</span>
      </div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const t = useTranslations('buyerOrders');

  const STATUS_KEYS = [
    'sale_confirmed',
    'admin_notified',
    'qc_scheduled',
    'qc_passed',
    'qc_failed',
    'pickup_scheduled',
    'in_transit',
    'delivered',
  ];

  const { data, isLoading, isFetching } = useGetOrdersQuery({
    page,
    limit: 15,
    status: statusFilter || undefined,
  });

  const orders = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">

        {/* Page Title Header */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {t('title')}
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-1 text-sm md:text-base">
            {t('subtitle')}
          </p>
        </div>

        {/* Scrollable Status Filter Track */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`flex-shrink-0 h-12 px-5 rounded-xl text-sm font-semibold font-sans transition-all border whitespace-nowrap active:scale-95 ${
              statusFilter === ''
                ? 'bg-green-800 border-green-800 text-white shadow-sm dark:bg-green-700 dark:border-green-700'
                : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            {t('allOrders')}
          </button>
          {STATUS_KEYS.map((status) => {
            const isTabActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`flex-shrink-0 h-12 px-5 rounded-xl text-sm font-semibold font-sans transition-all border whitespace-nowrap active:scale-95 ${
                  isTabActive
                    ? 'bg-green-800 border-green-800 text-white shadow-sm dark:bg-green-700 dark:border-green-700'
                    : 'text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {t(`status${status.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}
              </button>
            );
          })}
        </div>

        {/* Master Response Delivery Canvas */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-16 flex flex-col items-center justify-center text-center gap-4 shadow-sm px-4">
            <div className="w-16 h-16 bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400 rounded-full border border-stone-100 dark:border-stone-800">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">{t('noOrdersFound')}</p>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {t('noOrdersDesc')}
              </p>
            </div>
            <Link href="/buyer/marketplace" className="mt-2 h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-semibold transition-all shadow-sm flex items-center justify-center w-full sm:w-auto">
              {t('browseMarketplace')}
            </Link>
          </div>
        ) : (
          <>
            <div className={`space-y-4 transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/buyer/orders/${order._id}`)}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-800 dark:text-stone-100 leading-tight">
                        {(order.listingId as any)?.cropId?.name ?? '—'}
                      </h3>
                      <p className="font-mono text-xs text-stone-400 dark:text-stone-500 mt-1 font-medium">{t('orderId', { id: order._id.slice(-6).toUpperCase() })}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase shadow-sm ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700'}`}>
                        {t(`status${order.status.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}
                      </span>
                      <p className="font-sans text-base font-bold text-stone-800 dark:text-stone-200">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Operational Timeline Progress Stream */}
                  <OrderProgressBar status={order.status} t={t} />

                  <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-800/60 mt-1">
                    <p className="font-sans text-xs text-stone-500 dark:text-stone-400 font-medium">
                      {t('bulkLoad')}<span className="text-stone-800 dark:text-stone-200 font-semibold">{order.quantity} {order.unit}</span> • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-sans text-xs font-semibold text-green-800 dark:text-green-500 flex items-center gap-1.5 hover:underline">
                      {t('reviewDetails')} 
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 px-5 py-3.5 shadow-sm gap-4">
              <span className="font-sans text-xs sm:text-sm text-stone-500">
                {t.rich('showingRecords', {
                  count: orders.length,
                  total: data?.pagination.total ?? 0,
                  bold: (chunks) => <span className="font-semibold text-stone-800 dark:text-stone-100">{chunks}</span>
                })}
              </span>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setPage((p) => Math.max(1, p - 1)); }}
                  disabled={page === 1 || isFetching}
                  className="h-10 px-4 rounded-xl text-xs font-semibold font-sans border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 shadow-sm"
                >
                  {t('prev')}
                </button>
                <span className="text-xs font-sans font-semibold text-stone-500 dark:text-stone-400 min-w-[36px] text-center">
                  {page} / {data?.pagination.pages ?? 1}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
                  disabled={page === (data?.pagination.pages ?? 1) || isFetching}
                  className="h-10 px-4 rounded-xl text-xs font-semibold font-sans border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 shadow-sm"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}