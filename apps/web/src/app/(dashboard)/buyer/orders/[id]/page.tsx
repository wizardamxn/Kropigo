'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery } from '@/store/endpoints/ordersApi';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function BuyerOrderViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('buyerOrderView');

  const { data, isLoading, isError } = useGetOrderByIdQuery(id);
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse p-4">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-32 mb-6" />
        <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">{t('notFound')}</p>
        <Link href="/buyer/interests" className="text-sm underline text-stone-500">{t('backToInterests')}</Link>
      </div>
    );
  }

  const crop = order.listingId?.cropId;
  const seller = order.sellerId;
  const totalValue = order.agreedPrice * (order.quantity || 1);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4 sm:px-0">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('back')}
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
              {t('title')}
            </h1>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('orderId')}<span className="font-mono">{order._id}</span>
            </p>
          </div>
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex gap-3 shadow-sm">
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="font-sans text-sm text-amber-900 dark:text-amber-300">
          <strong className="font-medium block mb-0.5">{t('nextSteps')}</strong>
          {t('nextStepsDesc')}
        </div>
      </div>

      {/* Order Summary */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800/60 pb-3">
          {t('dealSummary')}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">{t('crop')}</p>
            <p className="font-serif text-xl text-stone-800 dark:text-stone-100">
              {crop?.name ?? t('unknownCrop')}
              {crop?.category && <span className="text-sm font-sans text-stone-500 dark:text-stone-400 ml-2">({crop.category})</span>}
            </p>
          </div>

          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">{t('agreedRate')}</p>
            <p className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
              ₹{order.agreedPrice?.toLocaleString('en-IN')} <span className="text-sm text-stone-500">{t('perUnit', { unit: crop?.unit || 'unit' })}</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">{t('quantity')}</p>
            <p className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
              {order.quantity} <span className="text-sm text-stone-500">{t('unit', { unit: crop?.unit || 'unit' })}</span>
            </p>
          </div>

          <div className="col-span-2 md:col-span-2 bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
            <p className="text-xs text-green-700 dark:text-green-500 uppercase tracking-wider font-sans mb-1 font-semibold">{t('totalDealValue')}</p>
            <p className="font-serif text-2xl font-bold text-green-800 dark:text-green-400">
              ₹{totalValue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="text-sm font-sans text-stone-500 dark:text-stone-400 pt-4 border-t border-stone-100 dark:border-stone-800/60">
          {t('createdOn', { date: new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) })}
        </div>
      </section>

      {/* Seller Details */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100">
          {t('sellerInfo')}
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xl text-stone-600 dark:text-stone-300 font-sans font-semibold border border-stone-300 dark:border-stone-700 shadow-sm">
            {seller?.name ? seller.name[0].toUpperCase() : 'K'}
          </div>
          <div className="flex-1">
            <h3 className="font-sans text-lg font-semibold text-stone-800 dark:text-stone-100">
              {seller?.name ?? t('unknownKisan')}
            </h3>
            <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">
              {t('contactDetailsHidden')}
            </p>
          </div>
        </div>
      </section>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link href={`/buyer/marketplace/${typeof order.listingId === 'object' ? order.listingId._id : order.listingId}`} className="text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-sans transition-colors">
          {t('viewOriginalListing')}
        </Link>
        {order.status === 'delivered' && (
          <Link
            href={`/buyer/orders/${order._id}/invoice`}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('downloadInvoice')}
          </Link>
        )}
      </div>
    </div>
  );
}
