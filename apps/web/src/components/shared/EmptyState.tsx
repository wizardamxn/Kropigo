'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400 dark:text-stone-500">
        <Icon className="w-8 h-8" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">
          {title}
        </h3>
        {subtitle && (
          <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
