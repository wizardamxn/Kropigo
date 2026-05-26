'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/shared/NotificationBell';

const navLinks = [
  { 
    href: '/kisan/dashboard', 
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    href: '/kisan/listings', 
    label: 'Listings',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  },
  { 
    href: '/kisan/listings/create', 
    label: 'Create',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  { 
    href: '/kisan/orders', 
    label: 'Orders',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
];

export default function KisanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSocket();
  useNotifications();

  // Unified link comparison helper
  const isLinkActive = (href: string) => {
    return href === '/kisan/listings/create'
      ? pathname === href
      : pathname === href || (href !== '/kisan/dashboard' && pathname.startsWith(href));
  };

  const navLinkClasses = (isActive: boolean) => `
    flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all 
    min-h-[48px] flex-1 md:flex-initial md:w-full justify-center md:justify-start font-sans font-medium text-center md:text-left
    ${isActive
      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-500 shadow-sm md:shadow-none'
      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
    }
  `;

  return (
    <RoleGuard allowedRoles={['kisan']}>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">
        
        {/* ─── MOBILE TOP NAVIGATION BAR (Hidden on Desktop) ─── */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-5 flex items-center justify-between z-40 shadow-sm transition-colors duration-300">
          <span className="font-serif text-xl font-bold tracking-tight text-green-800 dark:text-green-500">
            Kropigo
          </span>
          <div className="transform scale-95">
            <NotificationBell />
          </div>
        </header>

        {/* ─── GLOBAL APP SIDEBAR / BOTTOM BAR SYSTEM ─── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe flex flex-row items-center md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto transition-colors duration-300">
          
          {/* Brand & Notification Center — Desktop Only */}
          <div className="hidden md:flex items-center justify-between w-full mb-8 px-2">
            <span className="font-serif text-2xl font-bold text-green-800 dark:text-green-500">
              Kropigo
            </span>
            <NotificationBell />
          </div>

          {/* Primary Navigation Elements */}
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

            {/* Profile Link — Inlined natively into the flex matrix on mobile */}
            <Link 
              href="/kisan/profile"
              className={navLinkClasses(pathname === '/kisan/profile')}
            >
              <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">Profile</span>
            </Link>
          </div>
        </nav>

        {/* ─── MAIN APP ROUTER CONTENT WINDOW ─── */}
        {/* pt-20 cleanly balances the mobile top navigation window without pushing desktop down */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 transition-all duration-300">
          {children}
        </main>

      </div>
    </RoleGuard>
  );
}