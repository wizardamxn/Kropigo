'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, isFetching }: PaginationProps) {
  const t = useTranslations('common');

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 mt-4 select-none">
      <button
        disabled={page === 1 || isFetching}
        onClick={() => onPageChange(page - 1)}
        className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('prev')}</span>
      </button>

      <span className="font-sans text-xs text-stone-600 dark:text-stone-400">
        {t('page', { current: page, total: totalPages })}
      </span>

      <button
        disabled={page >= totalPages || isFetching}
        onClick={() => onPageChange(page + 1)}
        className="h-10 px-4 rounded-lg flex items-center gap-2 font-sans text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
      >
        <span>{t('next')}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Pagination;
