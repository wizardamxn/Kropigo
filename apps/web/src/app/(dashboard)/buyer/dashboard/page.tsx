'use client';

import { useGetOrdersQuery } from '@/store/endpoints/ordersApi';
import { useGetMyInterestsQuery } from '@/store/endpoints/interestsApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { Clock, CheckCircle, Package, TrendingUp, ShoppingCart, ClipboardList } from 'lucide-react';



export default function BuyerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('buyerDashboard');

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

        <PageHeader
          title={t('title')}
          subtitle={`${t('welcomeBack')} ${user?.name ?? ''}`}
        />

        {/* Statistics Metric Grid */}
        {isLoading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title={t('pendingInterests')} 
              value={pendingInterests} 
              color="amber" 
              icon={Clock}
            />
            <StatCard 
              title={t('acceptedDeals')} 
              value={acceptedInterests} 
              color="green" 
              icon={CheckCircle}
            />
            <StatCard 
              title={t('activeOrders')} 
              value={activeOrders} 
              color="blue" 
              icon={Package}
            />
            <StatCard 
              title={t('totalSpent')} 
              value={`₹${totalSpent.toLocaleString('en-IN')}`} 
              sub={t('acrossOpenFilled')} 
              color="stone" 
              icon={TrendingUp}
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
              <ShoppingCart className="w-6 h-6 text-white dark:text-amber-400" />
            </div>
            <div>
              <p className="font-sans font-semibold text-base">{t('browseMarketplace')}</p>
              <p className="font-sans text-sm text-amber-100/70 dark:text-stone-400">{t('exploreListings')}</p>
            </div>
          </Link>
          
          <Link
            href="/buyer/orders"
            className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:scale-110 transition-all duration-300">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans font-semibold text-base text-stone-800 dark:text-stone-100">{t('trackOrders')}</p>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">{t('reviewLogistics')}</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders Processing Feed */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-stone-100 dark:border-stone-800/60 flex justify-between items-center bg-stone-50/50 dark:bg-stone-950/20">
            <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">{t('recentOrders')}</h2>
            <Link href="/buyer/orders" className="font-sans text-sm font-semibold text-amber-700 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:underline">
              {t('viewAll')}
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 rounded-xl w-full animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t('noOrdersYet')}
              subtitle={t('browseToStart')}
              action={
                <Link href="/buyer/marketplace" className="mt-2 h-11 px-6 rounded-xl bg-amber-800 hover:bg-amber-700 text-white font-sans text-sm font-medium transition-colors flex items-center justify-center shadow-sm">
                  {t('goToMarketplace')}
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col md:block">
              {/* Desktop Table Header View (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 dark:bg-stone-950/40 font-sans text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      <th className="px-6 py-4">{t('orderId')}</th>
                      <th className="px-6 py-4">{t('cropItem')}</th>
                      <th className="px-6 py-4">{t('totalAmount')}</th>
                      <th className="px-6 py-4 text-right">{t('fulfillmentStatus')}</th>
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
                          <StatusBadge status={order.status} />
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
                        <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-950 flex items-center justify-center border border-stone-100 dark:border-stone-800/60 shrink-0">
                          <Package className="w-5 h-5 text-stone-400" />
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">
                            {(order.listingId as any)?.cropId?.name || '—'}
                          </p>
                          <p className="font-mono text-[11px] text-stone-400">#{order._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-stone-50 dark:border-stone-800/40">
                      <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">{t('totalAmount')}</span>
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