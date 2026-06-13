'use client';

import { useGetNotificationsQuery, useMarkAllReadMutation, useMarkNotificationReadMutation } from '@/store/endpoints/notificationApi';
import { useGetOrdersQuery, IOrder } from '@/store/endpoints/ordersApi';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { useRouter } from 'next/navigation';
import { DealNotificationCard } from '@/components/admin/DealNotificationCard';
import { useDispatch } from 'react-redux';
import { markOneRead } from '@/store/notificationSlice';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  label: string;
  value: number;
  highlight?: boolean;
  icon: React.ReactNode;
}

function SummaryCard({ label, value, highlight = false, icon }: SummaryCardProps) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 flex flex-col gap-3 ${
      highlight 
        ? 'border-red-200 dark:border-red-900/40 bg-white dark:bg-stone-900 ring-2 ring-red-500/10' 
        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        highlight 
          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
          : 'bg-stone-50 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
      }`}>
        {icon}
      </div>
      <div>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{label}</h3>
        <p className={`font-serif text-2xl md:text-3xl font-bold ${highlight ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: IOrder[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-12 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <p className="font-sans text-sm text-stone-500 dark:text-stone-400 font-medium">No active or historical orders listed.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Structural Grid Table Representation */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-stone-50/50 dark:bg-stone-950/40 font-sans text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Crop Produce</th>
              <th className="px-6 py-4 text-right">Total Amount</th>
              <th className="px-6 py-4 text-center">Fulfillment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans text-sm text-stone-700 dark:text-stone-300">
            {orders.map(order => (
              <tr
                key={order._id}
                onClick={() => router.push(`/admin/orders/${order._id}`)}
                className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-mono text-xs text-stone-400 dark:text-stone-500">
                  #{order._id.slice(-6).toUpperCase()}
                </td>
                <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium truncate max-w-[200px]">
                  {(order.listingId as any)?.cropId?.name || '—'}
                </td>
                <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-100 font-semibold text-right">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Fluid Responsive Layout Row Matrix Alternative */}
      <div className="md:hidden flex flex-col gap-3">
        {orders.map(order => (
          <div 
            key={order._id}
            onClick={() => router.push(`/admin/orders/${order._id}`)}
            className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm active:scale-[0.99] transition-transform cursor-pointer flex flex-col gap-3"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-stone-400 mb-0.5">#{order._id.slice(-6).toUpperCase()}</p>
                <p className="font-sans font-semibold text-stone-800 dark:text-stone-100 truncate">{(order.listingId as any)?.cropId?.name || '—'}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-stone-100 dark:border-stone-800/60">
              <span className="font-sans text-xs text-stone-400 uppercase tracking-wider font-medium">Gross Total</span>
              <span className="font-sans font-bold text-sm text-stone-800 dark:text-stone-100">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [markAllRead] = useMarkAllReadMutation();
  const [markNotificationRead] = useMarkNotificationReadMutation();

  const handleNotificationClick = async (notification: any) => {
    dispatch(markOneRead(notification._id));
    try {
      await markNotificationRead(notification._id).unwrap();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
    router.push(`/admin/orders/${notification.payload.orderId}`);
  };

  const { data: notifications, isLoading: notifLoading } = useGetNotificationsQuery({ page: 1 });
  const { data: recentOrders, isLoading: ordersLoading } = useGetOrdersQuery({ page: 1, limit: 5 });

  const newDealNotifications = notifications?.data.filter(
    n => n.type === SOCKET_EVENTS.NEW_DEAL
  ) || [];

  const unreadDeals = newDealNotifications.filter(n => !n.isRead);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 w-full overflow-hidden">
      
      {/* Header View Window */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          Admin Dashboard
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-1 text-sm md:text-base">
          Platform overview, live deal pipelines, and operational logistics logs.
        </p>
      </div>
      
      {/* Operational Summary Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          label="New Deals" 
          value={unreadDeals.length}
          highlight={unreadDeals.length > 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <SummaryCard 
          label="Total Orders" 
          value={recentOrders?.pagination.total || 0} 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <SummaryCard 
          label="In Progress" 
          value={recentOrders?.data.filter(o => !['delivered', 'qc_failed'].includes(o.status)).length || 0} 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <SummaryCard 
          label="Delivered" 
          value={recentOrders?.data.filter(o => o.status === 'delivered').length || 0} 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        />
      </div>

      {/* Main Structural Twin Grid Columns Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Hand Column Panel: Recent Platform Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
                Recent Orders
              </h2>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">Real-time exchange tracking ledger logs</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-xs font-semibold text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:underline transition-colors px-2 py-1 min-h-[32px]"
            >
              View All Orders
            </button>
          </div>
          
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <OrdersTable orders={recentOrders?.data || []} />
          )}
        </div>

        {/* Right Hand Column Panel: New System Deals Stream Feed */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-end border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-stone-800 dark:text-stone-100 font-medium tracking-tight flex items-center gap-2">
                New Deals
                {unreadDeals.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md shadow-sm">
                    {unreadDeals.length} New
                  </span>
                )}
              </h2>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">Live operational socket notifications</p>
            </div>
            {unreadDeals.length > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:underline transition-colors px-1 mb-0.5"
              >
                Mark All Read
              </button>
            )}
          </div>

          {notifLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) :newDealNotifications.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-sans text-stone-500 dark:text-stone-400 text-sm font-medium">No fresh incoming deal streams monitored.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1.5 scrollbar-thin border border-transparent">
              {newDealNotifications.map((notification) => (
                <div key={notification._id} className="transition-transform duration-200 hover:-translate-x-0.5">
                  <DealNotificationCard
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}