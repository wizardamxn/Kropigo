'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetOrderByIdQuery } from '@/store/endpoints/ordersApi';
import { useTranslations } from 'next-intl';
import InvoiceView from '@/components/orders/InvoiceView';

export default function BuyerInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('invoice');

  const { data, isLoading, isError } = useGetOrderByIdQuery(id);
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-10 space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-32" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">Order not found.</p>
        <Link href="/buyer/orders" className="text-sm underline text-stone-500">Back to Orders</Link>
      </div>
    );
  }

  if (order.status !== 'delivered') {
    return (
      <div className="max-w-2xl mx-auto px-8 py-10">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToOrder')}
        </button>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-8 text-center space-y-3">
          <svg className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-serif text-xl text-stone-800 dark:text-stone-100">{t('notDeliveredTitle')}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">{t('notDeliveredDesc')}</p>
          <Link
            href={`/buyer/orders/${id}`}
            className="inline-block mt-2 text-sm underline text-stone-500 hover:text-stone-800 font-sans transition-colors"
          >
            {t('backToOrder')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="print:hidden max-w-2xl mx-auto px-8 mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToOrder')}
        </button>
      </div>
      <InvoiceView order={order} />
    </div>
  );
}
