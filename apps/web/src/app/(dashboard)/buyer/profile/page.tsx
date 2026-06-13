'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useLogout';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { User, CheckCircle2, Clock, Lock, LogOut } from 'lucide-react';

export default function BuyerProfilePage() {
  const { user } = useAuth();
  const [handleLogout, isLoading] = useLogout();
  const t = useTranslations('buyerProfile');

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden pb-12">

        {/* Profile Page Header */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            {t('title')}
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-1 text-sm md:text-base">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Content Layout Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">

          {/* Left Column: Identity Card Visual */}
          <div className="md:col-span-1">
            <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center text-center">

              {/* Initials Avatar Badge Element */}
              <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-950 border-4 border-white dark:border-stone-900 shadow-sm overflow-hidden mb-4 flex items-center justify-center text-green-800 dark:text-green-500 font-serif text-4xl font-bold">
                {(user?.name ?? 'B')[0].toUpperCase()}
              </div>

              <h2 className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100 truncate w-full px-2">
                {user?.name || 'Buyer User'}
              </h2>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-1 mb-4">
                {t('accountType', { role: user?.role || 'Buyer' })}
              </p>

              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 font-sans text-xs font-semibold border border-green-200/60 dark:border-green-800/40 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {t('verifiedAccount')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-sans text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40 shadow-sm">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {t('pendingVerification')}
                </span>
              )}
            </section>
          </div>

          {/* Right Column: Account Specifications & Session Controls */}
          <div className="md:col-span-2 space-y-6">

            {/* Core Contact Parameters Grid */}
            <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800/60 pb-4">
                <User className="w-5 h-5 text-stone-400" />
                <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">
                  {t('accountDetails')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    {t('emailAddress')}
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200 break-all">
                    {user?.email || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    {t('phoneNumber')}
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200">
                    {user?.phone || '—'}
                  </span>
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-stone-100 dark:border-stone-800/40">
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    {t('primaryDelivery')}
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200">
                    {user?.location || t('locationNotSpecified')}
                  </span>
                </div>
              </div>
            </section>

            {/* Device Session Management Controls Container */}
            <section className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-stone-400" />
                <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">{t('sessionManagement')}</h3>
              </div>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
                {t('logoutDesc')}
              </p>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="h-12 w-full sm:w-auto px-6 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-sans font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 self-start shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                {isLoading ? t('signingOut') : t('signOutSecurely')}
              </button>
            </section>

          </div>
        </div>
      </div>
    </RoleGuard>
  );
}