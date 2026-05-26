'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/endpoints/authApi';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { disconnectSocket } from '@/lib/socket';

export default function BuyerProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (err) {
      console.error('Logout request failed, proceeding with local clearing', err);
    } finally {
      disconnectSocket();
      sessionStorage.removeItem('accessToken');
      dispatch(clearUser());
      router.replace('/login');
    }
  };

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden pb-12">

        {/* Profile Page Header */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            My Profile
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-1 text-sm md:text-base">
            Manage your account credentials, security parameters, and active platform sessions.
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
                Account Type: {user?.role || 'Buyer'}
              </p>

              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 font-sans text-xs font-semibold border border-green-200/60 dark:border-green-800/40 shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-sans text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40 shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Verification
                </span>
              )}
            </section>
          </div>

          {/* Right Column: Account Specifications & Session Controls */}
          <div className="md:col-span-2 space-y-6">

            {/* Core Contact Parameters Grid */}
            <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800/60 pb-4">
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">
                  Account Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Email Address
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200 break-all">
                    {user?.email || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Phone Number
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200">
                    {user?.phone || '—'}
                  </span>
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-stone-100 dark:border-stone-800/40">
                  <span className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                    Primary Delivery Location
                  </span>
                  <span className="block font-sans text-base font-medium text-stone-800 dark:text-stone-200">
                    {user?.location || 'Location not specified'}
                  </span>
                </div>
              </div>
            </section>

            {/* Device Session Management Controls Container */}
            <section className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">Session Management</h3>
              </div>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
                Log out of your marketplace account. This will terminate your real-time data sync channel and clear active credentials on this device.
              </p>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="h-12 w-full sm:w-auto px-6 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-sans font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 self-start shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {isLoading ? 'Signing out...' : 'Sign Out Securely'}
              </button>
            </section>

          </div>
        </div>
      </div>
    </RoleGuard>
  );
}