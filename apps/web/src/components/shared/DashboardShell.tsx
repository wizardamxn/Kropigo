'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { User, LogIn } from 'lucide-react';

interface NavLinkItem {
  href: string;
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
  icon?: React.ReactNode;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navLinks: NavLinkItem[];
  accent: 'amber' | 'green' | 'red';
  role: 'buyer' | 'kisan' | 'admin';
  brandSubtitle?: string;
  allowedRoles?: ('buyer' | 'kisan' | 'admin')[];
}

export function DashboardShell({
  children,
  navLinks,
  accent,
  role,
  brandSubtitle,
  allowedRoles,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { isAuthenticated, role: authRole } = useAuth();
  useSocket();
  useNotifications();

  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');

  const isLinkActive = (href: string) => {
    if (href.endsWith('/listings/create')) {
      return pathname === href;
    }
    const baseDir = href.split('/').slice(0, 3).join('/'); // e.g. /buyer/dashboard or /kisan/listings
    return pathname === href || (href !== `/${role}/dashboard` && pathname.startsWith(baseDir));
  };

  const getAccentClasses = (isActive: boolean) => {
    if (accent === 'amber') {
      return isActive
        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 shadow-sm md:shadow-none'
        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200';
    }
    if (accent === 'red') {
      return isActive
        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 shadow-sm md:shadow-none border border-red-100/50 dark:border-red-900/30'
        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 border border-transparent';
    }
    // Default green
    return isActive
      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-500 shadow-sm md:shadow-none'
      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200';
  };

  const ringColor = accent === 'amber'
    ? 'focus-visible:ring-amber-500'
    : accent === 'red'
    ? 'focus-visible:ring-red-500'
    : 'focus-visible:ring-green-800 dark:focus-visible:ring-green-700';

  const navLinkClasses = (isActive: boolean) => `
    flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all 
    min-h-[48px] flex-1 md:flex-initial md:w-full justify-center md:justify-start font-sans font-medium text-center md:text-left
    focus-visible:ring-2 focus-visible:ring-offset-2 ${ringColor} focus:outline-none
    ${getAccentClasses(isActive)}
  `;

  const shellContent = (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300 relative">
      
      {/* ─── ACCESSIBILITY SKIP LINK ─── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-stone-900 focus:border focus:border-stone-200 dark:focus:border-stone-800 focus:rounded-xl font-sans text-sm font-semibold text-green-800 dark:text-green-500 shadow-md focus:outline-none focus:ring-2 focus:ring-green-800"
      >
        Skip to Content
      </a>

      {/* ─── MOBILE TOP NAVIGATION BAR (Fixed layout boundary) ─── */}
      <header className="print:hidden md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-5 flex items-center justify-between z-40 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={34} height={34} className="rounded-xl shadow-sm ring-1 ring-black/6 dark:ring-white/10 object-cover shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
            {brandSubtitle && (
              <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 leading-none mt-0.5">{brandSubtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="w-[44px] h-[44px] shrink-0" /> {/* Spacer where the fixed NotificationBell sits */}
        </div>
      </header>

      {/* ─── GLOBAL APP SIDEBAR / BOTTOM BAR SYSTEM ─── */}
      <nav className="print:hidden fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe flex flex-row items-center md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto transition-colors duration-300">
        
        {/* Single Notification Bell Instance: Fixed on Mobile Header, Absolute in Sidebar on Desktop */}
        <div className="fixed top-2.5 right-5 md:absolute md:top-7 md:right-7 md:left-auto z-[45] transform scale-95 md:scale-100">
          <NotificationBell />
        </div>

        {/* Brand & Notification Center — Desktop Only */}
        <div className="hidden md:flex items-start justify-between w-full mb-8 px-2">
          <div className="flex flex-col items-start gap-2.5">
            <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={48} height={48} className="rounded-2xl shadow-md ring-1 ring-black/6 dark:ring-white/10 object-cover" />
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
              {brandSubtitle && (
                <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">{brandSubtitle}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="w-[44px] h-[44px] shrink-0" /> {/* Spacer where the absolute NotificationBell sits */}
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Primary Navigation Elements */}
        <div className="flex flex-row md:flex-col justify-between md:justify-start w-full gap-1 md:gap-2 flex-1 md:flex-initial">
          {navLinks.map(({ href, label, Icon, icon }) => (
            <Link
              key={href}
              href={href}
              className={navLinkClasses(isLinkActive(href))}
              aria-current={isLinkActive(href) ? 'page' : undefined}
            >
              {Icon ? <Icon className="w-5 h-5 md:w-6 md:h-6" /> : icon}
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{tCommon(label.toLowerCase() as any)}</span>
            </Link>
          ))}

          {/* Conditional Profile / Authentication entries per role */}
          {role === 'buyer' && (
            isAuthenticated && authRole === 'buyer' ? (
              <Link
                href="/buyer/profile"
                className={navLinkClasses(pathname === '/buyer/profile')}
                aria-current={pathname === '/buyer/profile' ? 'page' : undefined}
              >
                <User className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{tCommon('profile')}</span>
              </Link>
            ) : !isAuthenticated ? (
              <Link
                href="/login"
                className={navLinkClasses(pathname === '/login')}
                aria-current={pathname === '/login' ? 'page' : undefined}
              >
                <LogIn className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{tAuth('signIn')}</span>
              </Link>
            ) : null
          )}

          {role === 'kisan' && (
            <Link 
              href="/kisan/profile"
              className={navLinkClasses(pathname === '/kisan/profile')}
              aria-current={pathname === '/kisan/profile' ? 'page' : undefined}
            >
              <User className="w-5 h-5 md:w-6 h-6" />
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{tCommon('profile')}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ─── MAIN APP CONTENT VIEW PORTAL ─── */}
      <main
        id="main-content"
        tabIndex={-1}
        aria-live="polite"
        className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 transition-all duration-300 focus:outline-none"
      >
        {children}
      </main>

    </div>
  );

  if (allowedRoles) {
    return <RoleGuard allowedRoles={allowedRoles}>{shellContent}</RoleGuard>;
  }

  return shellContent;
}

export default DashboardShell;
