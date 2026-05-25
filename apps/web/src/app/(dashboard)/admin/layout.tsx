'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/shared/NotificationBell';

const navLinks = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();
  
  // Initialize Socket and Notifications for Admin
  useSocket();
  useNotifications();

  return (
    <RoleGuard allowedRoles={['admin']}>
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col md:flex-row transition-colors duration-300">

      {/* Navigation: Bottom Bar on Mobile, Sticky Sidebar on Desktop */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex flex-row justify-around p-2 pb-safe md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto">

        {/* Brand — Desktop Only */}
        <div className="hidden md:flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-2 font-serif text-2xl font-bold text-red-800 dark:text-red-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C8 3 4 7 4 12s4 9 8 9 8-4 8-9-4-9-8-9z" />
            </svg>
            Kropigo
          </div>
          <NotificationBell />
        </div>

        <div className="flex flex-row md:flex-col justify-around md:justify-start w-full gap-2">
          {navLinks.map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all min-h-[48px] min-w-[48px] md:w-full justify-center md:justify-start ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 font-medium shadow-sm md:shadow-none'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {icon}
                <span className="text-[10px] md:text-base font-sans">{label}</span>
              </Link>
            );
          })}
        </div>

      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto pt-6 px-4 md:p-8 pb-24 md:pb-8">
        {/* Mobile top bar for bell */}
        <div className="md:hidden flex justify-end mb-4">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
    </RoleGuard>
  );
}
