'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/shared/NotificationBell';

const navLinks = [
  {
    href: '/buyer/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: '/buyer/marketplace',
    label: 'Marketplace',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/buyer/interests',
    label: 'Interests',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: '/buyer/orders',
    label: 'Orders',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();
  useSocket();
  useNotifications();

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
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-5 flex items-center justify-between z-40 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={34} height={34} className="rounded-xl shadow-sm ring-1 ring-black/6 dark:ring-white/10 object-cover shrink-0" />
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">KropiGo</span>
        </div>
        <div className="transform scale-95">
          <NotificationBell />
        </div>
      </header>

      {/* ─── GLOBAL APP NAVIGATION MATRIX ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe flex flex-row items-center md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto transition-colors duration-300">

        {/* Brand Header — Desktop Only */}
        <div className="hidden md:flex items-start justify-between w-full mb-8 px-2">
          <div className="flex flex-col items-start gap-2.5">
            <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={48} height={48} className="rounded-2xl shadow-md ring-1 ring-black/6 dark:ring-white/10 object-cover" />
            <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
          </div>
          <NotificationBell />
        </div>

        {/* Core Link Stack Loop */}
        <div className="flex flex-row md:flex-col justify-between md:justify-start w-full gap-1 md:gap-2 flex-1 md:flex-initial">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={navLinkClasses(isLinkActive(href))}
            >
              {icon}
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{label}</span>
            </Link>
          ))}

          {/* Conditional Profile / Authentication Link Entry Matrix */}
          {isAuthenticated && role === 'buyer' ? (
            <Link
              href="/buyer/profile"
              className={navLinkClasses(pathname === '/buyer/profile')}
            >
              <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">Profile</span>
            </Link>
          ) : !isAuthenticated ? (
            <Link
              href="/login"
              className={navLinkClasses(pathname === '/login')}
            >
              <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">Sign In</span>
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