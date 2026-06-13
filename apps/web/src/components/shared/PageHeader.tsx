'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref, onBack, actions }: PageHeaderProps) {
  const router = useRouter();

  const handleBackClick = (e: React.MouseEvent) => {
    if (onBack) {
      e.preventDefault();
      onBack();
    } else if (backHref) {
      // standard routing
    } else {
      e.preventDefault();
      router.back();
    }
  };

  const hasBack = !!backHref || !!onBack;

  return (
    <div className="flex flex-col gap-3">
      {hasBack && (
        <div className="flex items-center">
          {backHref ? (
            <Link
              href={backHref}
              onClick={onBack ? handleBackClick : undefined}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-150 font-sans text-sm font-medium transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          ) : (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-150 font-sans text-sm font-medium transition-colors w-fit cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-stone-600 dark:text-stone-450 text-base md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
export default PageHeader;
