'use client';

import { useGetNotificationsQuery, useMarkAllReadMutation } from '@/store/endpoints/notificationApi';
import { useGetOrdersQuery, IOrder } from '@/store/endpoints/ordersApi';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { useRouter } from 'next/navigation';
import { DealNotificationCard } from '@/components/admin/DealNotificationCard';

// Helper for status badges
const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('delivered') || s.includes('success')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
  }
  if (s.includes('failed') || s.includes('cancelled')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
  }
  if (s.includes('pending') || s.includes('processing')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
};

const SummaryCard = ({ label, value, highlight = false, icon }: { label: string, value: number, highlight?: boolean, icon: React.ReactNode }) => (
  <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 ${
    highlight 
      ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' 
      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
  }`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
      highlight 
        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
    }`}>
      {icon}
    </div>
    <div>
      <h3 className="font-sans text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">{label}</h3>
      <p className={`font-serif text-3xl ${highlight ? 'text-red-600 dark:text-red-400' : 'text-stone-800 dark:text-stone-100'}`}>
        {value}
      </p>
    </div>
  </div>
);

const OrdersTable = ({ orders }: { orders: IOrder[] }) => {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-10 flex flex-col items-center justify-center text-center gap-3">
        <svg className="w-12 h-12 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v1m-6 4h.01M15 9h.01M12 14h.01M15 14h.01M9 14h.01M12 18h.01" /></svg>
        <span className="font-sans text-stone-500 dark:text-stone-400">कोई ऑर्डर नहीं मिला (No orders found)</span>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950/50 font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Crop</th>
              <th className="px-6 py-4 font-medium text-right">Total Amount</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {orders.map(order => (
              <tr
                key={order._id}
                onClick={() => router.push(`/admin/orders/${order._id}`)}
                className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-mono text-sm text-stone-500 dark:text-stone-400">
                  #{order._id.slice(-6).toUpperCase()}
                </td>
                <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium">
                  {(order.listingId as any)?.cropId?.name || '—'}
                </td>
                <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium text-right">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-3">
        {orders.map(order => (
          <div 
            key={order._id}
            onClick={() => router.push(`/admin/orders/${order._id}`)}
            className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400 font-mono mb-0.5">#{order._id.slice(-6).toUpperCase()}</p>
                <p className="font-serif text-lg font-medium text-stone-800 dark:text-stone-100">{(order.listingId as any)?.cropId?.name || '—'}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${getStatusBadge(order.status)}`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-800">
              <span className="font-sans text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total</span>
              <span className="font-sans font-medium text-stone-800 dark:text-stone-100">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [markAllRead] = useMarkAllReadMutation();

  const { data: notifications, isLoading: notifLoading } = 
    useGetNotificationsQuery({ page: 1 });

  const { data: recentOrders, isLoading: ordersLoading } = 
    useGetOrdersQuery({ page: 1, limit: 5 });

  const newDealNotifications = notifications?.data.filter(
    n => n.type === SOCKET_EVENTS.NEW_DEAL
  ) || [];

  const unreadDeals = newDealNotifications.filter(n => !n.isRead);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          नियंत्रण कक्ष <span className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-sans font-normal ml-2 tracking-normal">(Admin Dashboard)</span>
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-lg">
          Platform overview, live deals, and recent operational metrics.
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <SummaryCard 
          label="New Deals" 
          value={unreadDeals.length}
          highlight={unreadDeals.length > 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <SummaryCard 
          label="Total Orders" 
          value={recentOrders?.pagination.total || 0} 
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v1m-6 4h.01M15 9h.01M12 14h.01M15 14h.01M9 14h.01M12 18h.01" /></svg>}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">
                हाल के ऑर्डर्स
              </h2>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">Recent platform transactions</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-sm font-medium text-green-700 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 hover:underline transition-colors px-2 py-1"
            >
              View all
            </button>
          </div>
          
          {ordersLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-stone-200 dark:bg-stone-800 rounded-xl w-full"></div>
              ))}
            </div>
          ) : (
            <OrdersTable orders={recentOrders?.data || []} />
          )}
        </div>

        {/* Right Column: New Deals Feed */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-end border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 flex items-center gap-2">
                नई डील्स
                {unreadDeals.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-sans font-medium animate-pulse">
                    {unreadDeals.length} New
                  </span>
                )}
              </h2>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">Live deal notifications</p>
            </div>
            {unreadDeals.length > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:underline transition-colors mb-1"
              >
                Mark read
              </button>
            )}
          </div>

          {notifLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-stone-200 dark:bg-stone-800 rounded-xl w-full"></div>
              ))}
            </div>
          ) : newDealNotifications.length === 0 ? (
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="font-sans text-stone-500 dark:text-stone-400 text-sm">अभी कोई नई डील नहीं है<br/>(No new deals at the moment)</span>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
              {newDealNotifications.map((notification) => (
                <div key={notification._id} className="transform transition-all duration-300 hover:-translate-x-1">
                  <DealNotificationCard
                    notification={notification}
                    onClick={() => {
                      router.push(`/admin/orders/${notification.payload.orderId}`);
                    }}
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