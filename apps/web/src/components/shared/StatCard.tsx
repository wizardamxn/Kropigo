'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { STAT_CARD_COLORS } from './statusHelper';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon | React.ReactNode;
  color?: 'stone' | 'amber' | 'green' | 'blue' | 'red';
  href?: string;
}

export function StatCard({ title, value, sub, icon, color = 'stone', href }: StatCardProps) {
  const theme = STAT_CARD_COLORS[color] ?? STAT_CARD_COLORS.stone;

  // Check if icon is a Lucide icon component or raw React node
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (icon) {
      const IconComp = icon as React.ComponentType<{ className?: string }>;
      return <IconComp className="w-5 h-5" />;
    }
    return null;
  };

  const cardContent = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.icon} flex-shrink-0`}>
        {renderIcon()}
      </div>
      <div className="min-w-0">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1 truncate">
          {title}
        </p>
        <p className={`font-serif text-2xl md:text-3xl font-medium truncate ${theme.text}`}>
          {value}
        </p>
        {sub && (
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </>
  );

  const wrapperClass = `p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all duration-300 w-full text-left ${
    theme.container
  } ${href ? 'hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98] cursor-pointer' : ''}`;

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={wrapperClass}>
      {cardContent}
    </div>
  );
}

export default StatCard;
