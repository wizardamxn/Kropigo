'use client';

import Image from 'next/image';
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
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (
      <svg className="w-5 h-5 md:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useSocket();
  useNotifications();

  const isLinkActive = (href: string) => {
    return pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">

        {/* ─── MOBILE TOP NAVIGATION BAR (Fixed layout boundary for Notifications) ─── */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-5 flex items-center justify-between z-40 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2.5">
            <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={34} height={34} className="rounded-xl shadow-sm ring-1 ring-black/6 dark:ring-white/10 object-cover shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">Ops Panel</span>
            </div>
          </div>
          <div className="transform scale-95">
            <NotificationBell />
          </div>
        </header>

        {/* ─── GLOBAL CONTROL PANEL SIDEBAR / BOTTOM NAVIGATION BAR ─── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 pb-safe flex flex-row items-center md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:h-screen md:sticky md:top-0 md:overflow-y-auto transition-colors duration-300">

          {/* Brand Header & Control Hub — Desktop Only */}
          <div className="hidden md:flex items-start justify-between w-full mb-8 px-2">
            <div className="flex flex-col items-start gap-2.5">
              <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={48} height={48} className="rounded-2xl shadow-md ring-1 ring-black/6 dark:ring-white/10 object-cover" />
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-none">KropiGo</span>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">Ops Panel</span>
              </div>
            </div>
            <NotificationBell />
          </div>

          {/* Symmetrical Core Navigation Link Grid Matrix */}
          <div className="flex flex-row md:flex-col justify-between md:justify-start w-full gap-1 md:gap-2 flex-1 md:flex-initial">
            {navLinks.map(({ href, label, icon }) => {
              const isActive = isLinkActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all 
                              min-h-[48px] flex-1 md:flex-initial md:w-full justify-center md:justify-start font-sans font-medium text-center md:text-left
                              ${isActive
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 shadow-sm md:shadow-none border border-red-100/50 dark:border-red-900/30'
                                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200 border border-transparent'
                              }`}
                >
                  {icon}
                  <span className="text-[10px] sm:text-xs md:text-base tracking-tight md:tracking-normal">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ─── APP ROUTER VIEW PORTAL WINDOW ─── */}
        {/* pt-20 cleanly offsets fixed mobile top navbar boundary frame structure defensively */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 transition-all duration-300">
          {children}
        </main>

      </div>
    </RoleGuard>
  );
}