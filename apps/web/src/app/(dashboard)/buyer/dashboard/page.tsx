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
  sale_confirmed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50',
  admin_notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50',
  qc_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50',
  qc_passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50 dark:border-green-800/50',
  qc_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50',
  pickup_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/50',
  delivered: 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300 border-green-300/40 dark:border-green-700/50',
};

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: 'stone' | 'amber' | 'green' | 'blue';
  icon: React.ReactNode;
}

// Fixed property extraction parsing bug present in prior iteration
function StatCard({ label, value, sub, color = 'stone', icon }: StatCardProps) {
  const containerColors = {
    stone: 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
    amber: 'border-amber-200 dark:border-amber-900/30 bg-white dark:bg-stone-900',
    green: 'border-green-200 dark:border-green-900/30 bg-white dark:bg-stone-900',
    blue: 'border-blue-200 dark:border-blue-900/30 bg-white dark:bg-stone-900',
  };

  const iconColors = {
    stone: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    green: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const textColors = {
    stone: 'text-stone-800 dark:text-stone-100',
    amber: 'text-amber-700 dark:text-amber-500',
    green: 'text-green-800 dark:text-green-500',
    blue: 'text-blue-800 dark:text-blue-500',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-0.5 ${containerColors[color]}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
          {label}
        </p>
        <p className={`font-serif text-2xl md:text-3xl font-medium ${textColors[color]}`}>
          {value}
        </p>
        {sub && <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-1">{sub}</p>}
      </div>
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
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">

        {/* Header Section */}
        <header className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
            Dashboard
          </h1>
          <p className="font-sans text-stone-600 dark:text-stone-400 text-lg">
            Welcome back, <span className="font-medium text-amber-700 dark:text-amber-500">{user?.name}</span>
          </p>
        </header>

        {/* Statistics Metric Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Pending Interests" 
              value={pendingInterests} 
              color="amber" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard 
              label="Accepted Deals" 
              value={acceptedInterests} 
              color="green" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard 
              label="Active Orders" 
              value={activeOrders} 
              color="blue" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
            />
            <StatCard 
              label="Total Spent" 
              value={`₹${totalSpent.toLocaleString('en-IN')}`} 
              sub="across open and filled orders" 
              color="stone" 
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            />
          </div>
        )}

        {/* Quick Route Action Gateways */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/buyer/marketplace"
            className="bg-amber-800 dark:bg-amber-900/40 hover:bg-amber-700 dark:hover:bg-amber-900/60 text-white rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 group border border-transparent dark:border-amber-800/40"
          >
            <div className="w-12 h-12 bg-white/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6 text-white dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-base">Browse Crop Marketplace</p>
              <p className="font-sans text-sm text-amber-100/70 dark:text-stone-400">Explore listings and send crop bids</p>
            </div>
          </Link>
          
          <Link
            href="/buyer/orders"
            className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-base text-stone-800 dark:text-stone-100">Track My Orders</p>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">Review logistics & check status</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders Processing Feed */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-stone-100 dark:border-stone-800/60 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/20">
            <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">Recent Orders</h2>
            <Link href="/buyer/orders" className="font-sans text-sm font-semibold text-amber-700 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:underline">
              View All
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 rounded-xl w-full animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-stone-50 dark:bg-stone-950 rounded-full flex items-center justify-center text-stone-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-lg text-stone-800 dark:text-stone-100 mb-1">No orders yet</p>
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400">Browse the marketplace and submit an interest bid to get started.</p>
              </div>
              <Link href="/buyer/marketplace" className="mt-2 h-11 px-6 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-sans text-sm font-medium transition-colors flex items-center justify-center shadow-sm">
                Go to Marketplace
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:block">
              {/* Desktop Table Header View (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 dark:bg-stone-950/40 font-sans text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Crop Item</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4 text-right">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans text-sm">
                    {orders.slice(0, 5).map((order) => (
                      <tr 
                        key={order._id}
                        onClick={() => router.push(`/buyer/orders/${order._id}`)}
                        className="hover:bg-stone-50/40 dark:hover:bg-stone-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-stone-400 dark:text-stone-500">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-stone-800 dark:text-stone-200 font-medium">
                          {(order.listingId as any)?.cropId?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-stone-800 dark:text-stone-200 font-semibold">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Adaptive Feed List (Hidden on Desktop) */}
              <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800/80">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    onClick={() => router.push(`/buyer/orders/${order._id}`)}
                    className="p-4 flex flex-col gap-3 active:bg-stone-50 dark:active:bg-stone-800/60 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-950 flex items-center justify-center border border-stone-100 dark:border-stone-800/60">
                          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">
                            {(order.listingId as any)?.cropId?.name || '—'}
                          </p>
                          <p className="font-mono text-[11px] text-stone-400">#{order._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-stone-50 dark:border-stone-800/40">
                      <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">Total Amount</span>
                      <span className="font-sans font-bold text-stone-800 dark:text-stone-100 text-sm">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}