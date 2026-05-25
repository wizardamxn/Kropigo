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
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    href: '/kisan/listings', 
    label: 'Listings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  },
  { 
    href: '/kisan/listings/create', 
    label: 'Create',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  { 
    href: '/kisan/orders', 
    label: 'Orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
];

export default function KisanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSocket();
  useNotifications();

  return (
    <RoleGuard allowedRoles={['kisan']}>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col md:flex-row transition-colors duration-300">
        
        {/* Navigation: Bottom Bar on Mobile, Sticky Sidebar on Desktop */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex flex-row justify-around p-2 pb-safe md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto">
          
          {/* Brand Identity — Desktop Only */}
          <div className="hidden md:flex items-center justify-between mb-8 px-4">
            <span className="font-serif text-2xl font-bold text-green-800 dark:text-green-600">Kropigo</span>
            <NotificationBell />
          </div>

          <div className="flex flex-row md:flex-col justify-around md:justify-start w-full gap-2">
            {navLinks.map(({ href, label, icon }) => {
              const isActive = href === '/kisan/listings/create'
                ? pathname === href
                : pathname === href || (href !== '/kisan/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all min-h-[48px] min-w-[48px] md:w-full justify-center md:justify-start ${
                    isActive
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-500 font-medium shadow-sm md:shadow-none'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {icon}
                  <span className="text-[10px] md:text-base font-sans">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Profile Link - Pushed to right on mobile, bottom on desktop */}
          <div className="md:mt-auto flex">
            <Link 
              href="/kisan/profile"
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all min-h-[48px] min-w-[48px] md:w-full justify-center md:justify-start ${
                pathname === '/kisan/profile'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-500 font-medium shadow-sm md:shadow-none'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] md:text-base font-sans">Profile</span>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        {/* pb-24 ensures content isn't hidden behind the fixed mobile bottom nav */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

      </div>
    </RoleGuard>
  );
}