'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ShoppingCart, FileEdit, ClipboardList, User, LogIn } from 'lucide-react';

const navLinks = [
  {
    href: '/buyer/dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    href: '/buyer/marketplace',
    label: 'Marketplace',
    Icon: ShoppingCart,
  },
  {
    href: '/buyer/interests',
    label: 'Interests',
    Icon: FileEdit,
  },
  {
    href: '/buyer/orders',
    label: 'Orders',
    Icon: ClipboardList,
  },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();
  useSocket();
  useNotifications();
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');

  // Active path matcher helper logic
  const isLinkActive = (href: string) => {
    return pathname === href || (href !== '/buyer/dashboard' && pathname.startsWith(href));
  };

  const navLinkClasses = (isActive: boolean) => `
    flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all 
    min-h-[48px] flex-1 md:flex-initial md:w-full justify-center md:justify-start font-sans font-medium text-center md:text-left
    ${isActive
      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 shadow-sm md:shadow-none'
      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
    }
  `;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">

      {/* ─── MOBILE TOP NAVIGATION BAR (Fixed structural exposure for Notifications) ─── */}
      <header className="print:hidden md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-5 flex items-center justify-between z-40 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={34} height={34} className="rounded-xl shadow-sm ring-1 ring-black/6 dark:ring-white/10 object-cover shrink-0" />
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">KropiGo</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="transform scale-95">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ─── GLOBAL APP NAVIGATION MATRIX ─── */}
      <nav className="print:hidden fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe flex flex-row items-center md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto transition-colors duration-300">

        {/* Brand Header — Desktop Only */}
        <div className="hidden md:flex items-start justify-between w-full mb-8 px-2">
          <div className="flex flex-col items-start gap-2.5">
            <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={48} height={48} className="rounded-2xl shadow-md ring-1 ring-black/6 dark:ring-white/10 object-cover" />
            <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
          </div>
          <div className="flex flex-col items-end gap-3">
            <NotificationBell />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Core Link Stack Loop */}
        <div className="flex flex-row md:flex-col justify-between md:justify-start w-full gap-1 md:gap-2 flex-1 md:flex-initial">
          {navLinks.map(({ href, label, Icon }) => {
            const labelKey = label.toLowerCase() as any;
            return (
              <Link
                key={href}
                href={href}
                className={navLinkClasses(isLinkActive(href))}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{t(labelKey)}</span>
              </Link>
            );
          })}

          {/* Conditional Profile / Authentication Link Entry Matrix */}
          {isAuthenticated && role === 'buyer' ? (
            <Link
              href="/buyer/profile"
              className={navLinkClasses(pathname === '/buyer/profile')}
            >
              <User className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{t('profile')}</span>
            </Link>
          ) : !isAuthenticated ? (
            <Link
              href="/login"
              className={navLinkClasses(pathname === '/login')}
            >
              <LogIn className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{tAuth('signIn')}</span>
            </Link>
          ) : null}
        </div>
      </nav>

      {/* ─── MAIN ROUTER ROUTE CONTROLLER PORTAL ─── */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}