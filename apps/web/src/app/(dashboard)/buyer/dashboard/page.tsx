'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useGetMyInterestsQuery } from '@/store/endpoints/interestsApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';

const STATUS_LABELS: Record<string, string> = {
  sale_confirmed: 'Deal Confirmed',
  admin_notified: 'Admin Notified',
  qc_scheduled: 'QC Scheduled',
  qc_passed: 'QC Passed',
  qc_failed: 'QC Failed',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const STATUS_STYLES: Record<string, string> = {
  sale_confirmed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  admin_notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  qc_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  qc_passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50',
  qc_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50',
  pickup_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
  delivered: 'bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700',
};

function StatCard({ label, value, sub, color = 'stone' }: { label: string; value: number | string; sub?: string; color?: 'stone' | 'amber' | 'green' | 'blue' }) {
  const colorMap = {
    stone: 'bg-stone-100 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
  };
  return (
    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-2">
      <p className="font-sans text-sm text-stone-500 dark:text-stone-400 font-medium">{label}</p>
      <p className={`font-serif text-3xl font-medium ${colorMap[color].split(' ').slice(2).join(' ')}`}>{value}</p>
      {sub && <p className="font-sans text-xs text-stone-400 dark:text-stone-500">{sub}</p>}
    </div>
  );
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: ordersData, isLoading: ordersLoading } = useGetOrdersQuery({ page: 1, limit: 5 });
  const { data: interestsData, isLoading: interestsLoading } = useGetMyInterestsQuery({ limit: 100 });

  const orders = ordersData?.data ?? [];
  const interests = (interestsData as any)?.data ?? [];

  const pendingInterests = interests.filter((i: any) => i.status === 'pending').length;
  const acceptedInterests = interests.filter((i: any) => i.status === 'accepted').length;
  const totalSpent = orders
    .filter((o) => ['qc_passed', 'pickup_scheduled', 'in_transit', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const activeOrders = orders.filter((o) => !['delivered', 'qc_failed'].includes(o.status)).length;

  const isLoading = ordersLoading || interestsLoading;

  return (
    <RoleGuard allowedRoles={['buyer']}>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <header>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            Dashboard
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-lg">
            Welcome back, <span className="font-medium text-amber-700 dark:text-amber-500">{user?.name}</span>
          </p>
        </header>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Pending Interests" value={pendingInterests} color="amber" />
            <StatCard label="Accepted Deals" value={acceptedInterests} color="green" />
            <StatCard label="Active Orders" value={activeOrders} color="blue" />
            <StatCard label="Total Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} sub="across delivered orders" color="stone" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/buyer/marketplace"
            className="bg-amber-700 dark:bg-amber-800 hover:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold">Browse Crops</p>
              <p className="font-sans text-sm text-white/70">Find & bid on listings</p>
            </div>
          </Link>
          <Link
            href="/buyer/orders"
            className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">My Orders</p>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">Track your deals</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100">Recent Orders</h2>
            <Link href="/buyer/orders" className="font-sans text-sm font-medium text-amber-700 dark:text-amber-500 hover:underline">
              View all
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-6 animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-stone-200 dark:bg-stone-800 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-sans text-stone-500 dark:text-stone-400">No orders yet. Browse the marketplace to get started!</p>
              <Link href="/buyer/marketplace" className="mt-1 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-sans text-sm font-medium transition-colors">
                Go to Marketplace
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  onClick={() => router.push(`/buyer/orders/${order._id}`)}
                  className="px-6 py-4 flex justify-between items-center hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-sans font-medium text-stone-800 dark:text-stone-100 text-sm">
                        {(order.listingId as any)?.cropId?.name ?? '—'}
                      </p>
                      <p className="font-mono text-xs text-stone-400">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="font-sans text-sm font-medium text-stone-700 dark:text-stone-300 hidden sm:block">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </span>
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}
