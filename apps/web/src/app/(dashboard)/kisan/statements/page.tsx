'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useGetMyStatementsQuery } from '@/store/endpoints/statementsApi';
import Pagination from '@/components/shared/Pagination';
import EmptyState from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { FileText, TrendingUp, ShoppingBag, IndianRupee, CalendarDays, Printer } from 'lucide-react';

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDay = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function KisanStatements() {
  const t = useTranslations('kisanStatements');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetMyStatementsQuery({ page, limit: 30 });

  const statements = data?.data ?? [];
  const summary = data?.summary;
  const meta = data?.meta;

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {t('title')}
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-base md:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Link
          href="/kisan/statements/print?scope=all"
          className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-sm font-medium shadow-sm transition-colors w-fit"
        >
          <Printer className="w-4 h-4" />
          {t('printAll')}
        </Link>
      </div>

      {/* Lifetime summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{t('totalSellings')}</p>
            <p className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100">{summary?.lifetimeSales ?? 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{t('totalEarnings')}</p>
            <p className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100 flex items-center">
              <IndianRupee className="w-5 h-5" />{fmtMoney(summary?.lifetimeAmount ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Day-wise statements */}
      {isError ? (
        <div className="py-16 text-center text-stone-500 dark:text-stone-400 font-sans text-sm">
          {t('failedToLoad')}
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : statements.length === 0 ? (
        <EmptyState icon={FileText} title={t('emptyTitle')} subtitle={t('emptySubtitle')} />
      ) : (
        <div className="space-y-5">
          {statements.map((s) => (
            <section
              key={s._id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden"
            >
              {/* Day header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 bg-stone-50 dark:bg-stone-950/40 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CalendarDays className="w-5 h-5 text-stone-400 shrink-0" />
                  <h2 className="font-serif text-lg font-medium text-stone-800 dark:text-stone-100 truncate">{fmtDay(s.date)}</h2>
                  <Link
                    href={`/kisan/statements/print?scope=day&date=${encodeURIComponent(s.dateKey)}`}
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-green-700/40 text-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-sans text-xs font-medium transition-colors"
                    title={t('printDay')}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {t('printDay')}
                  </Link>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sans text-sm font-bold text-green-800 dark:text-green-400 flex items-center justify-end">
                    <IndianRupee className="w-3.5 h-3.5" />{fmtMoney(s.totalAmount)}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 font-sans">
                    {t('sellingsCount', { count: s.totalSales })}
                  </p>
                </div>
              </div>

              {/* Entries */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {s.entries.map((e) => (
                  <div key={e.orderId} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-stone-800 dark:text-stone-200 capitalize truncate">
                          {e.cropName}
                        </span>
                        {e.grade && (
                          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/40">
                            {t('grade', { grade: e.grade })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                        {e.quantity} {e.unit} · ₹{fmtMoney(e.agreedPrice)}/{e.unit}
                        {e.buyerName ? ` · ${e.buyerName}` : ''} · {fmtTime(e.soldAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-sans font-semibold text-stone-800 dark:text-stone-100 flex items-center">
                        <IndianRupee className="w-3.5 h-3.5" />{fmtMoney(e.totalAmount)}
                      </span>
                      <Link
                        href={`/kisan/statements/print?scope=crop&date=${encodeURIComponent(s.dateKey)}&crop=${encodeURIComponent(e.cropName)}&grade=${encodeURIComponent(e.grade ?? '')}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-500 hover:text-green-800 hover:border-green-700/40 dark:hover:text-green-400 transition-colors"
                        title={t('printCrop')}
                        aria-label={t('printCrop')}
                      >
                        <Printer className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
