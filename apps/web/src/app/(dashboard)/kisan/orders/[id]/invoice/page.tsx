'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetOrderByIdQuery } from '@/store/endpoints/ordersApi';
import { useTranslations } from 'next-intl';
import InvoiceView from '@/components/orders/InvoiceView';
import { ArrowLeft, FileText } from 'lucide-react';

export default function KisanInvoicePage() {
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
        <Link href="/kisan/orders" className="text-sm underline text-stone-500">Back to Orders</Link>
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
          <ArrowLeft className="w-4 h-4" />
          {t('backToOrder')}
        </button>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-8 text-center space-y-3">
          <FileText className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-500" />
          <p className="font-serif text-xl text-stone-800 dark:text-stone-100">{t('notDeliveredTitle')}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">{t('notDeliveredDesc')}</p>
          <Link
            href={`/kisan/orders/${id}`}
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
          <ArrowLeft className="w-4 h-4" />
          {t('backToOrder')}
        </button>
      </div>
      <InvoiceView order={order} />
    </div>
  );
}
