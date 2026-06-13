'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkNotificationReadMutation,
  INotification,
} from '@/store/endpoints/notificationApi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { markAllRead, markOneRead } from '@/store/notificationSlice';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { API_URL } from '@/lib/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const LIMIT = 10;

// Premium context-aware SVG icons replacing raw placeholder labels
const getNotificationIcon = (type: string) => {
  switch (type) {
    case SOCKET_EVENTS.NEW_DEAL:
      return (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
      );
    case SOCKET_EVENTS.OFFER_ACCEPTED:
      return (
        <div className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-900/30 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
        </div>
      );
    case SOCKET_EVENTS.ORDER_STATUS_UPDATED:
      return (
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </div>
      );
    case SOCKET_EVENTS.NEW_OFFER_RECEIVED:
      return (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
        </div>
      );
    case SOCKET_EVENTS.OFFER_REJECTED:
      return (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      );
    default:
      return (
        <div className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl border border-stone-200 dark:border-stone-700 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </div>
      );
  }
};

const getNavigationPath = (type: string, payload: any, role?: string): string | null => {
  // Order notifications go to the viewer's own role section — kisans and
  // buyers both receive ORDER_STATUS_UPDATED for the same order.
  const orderBase = role === 'kisan' ? '/kisan/orders' : role === 'admin' ? '/admin/orders' : '/buyer/orders';
  if (type === SOCKET_EVENTS.NEW_DEAL && payload?.orderId) return `/admin/orders/${payload.orderId}`;
  if (type === SOCKET_EVENTS.OFFER_ACCEPTED && payload?.orderId) return `${orderBase}/${payload.orderId}`;
  if (type === SOCKET_EVENTS.ORDER_STATUS_UPDATED && payload?.orderId) return `${orderBase}/${payload.orderId}`;
  if (type === SOCKET_EVENTS.OFFER_REJECTED && payload?.listingId) return `/buyer/marketplace/${payload.listingId}`;
  if (type === SOCKET_EVENTS.NEW_OFFER_RECEIVED && payload?.listingId) return `/kisan/listings/${payload.listingId}/view`;
  return null;
};

const fmtTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized, role } = useAuth();
  const { unreadCount: localUnreadCount } = useSelector((state: RootState) => state.notifications);
  // The server count covers all notifications, not just those loaded locally;
  // its cache tag is invalidated on every socket event and mark-read mutation.
  const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated });
  const unreadCount = unreadData?.count ?? localUnreadCount;

  // --- Pagination state ---
  const [items, setItems] = useState<INotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // --- RTK mutations ---
  const [triggerMarkAll] = useMarkAllReadMutation();
  const [triggerMarkRead] = useMarkNotificationReadMutation();

  const fetchPage = useCallback(async (pageNum: number) => {
    if (isFetchingRef.current || !isAuthenticated) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/notifications?page=${pageNum}&limit=${LIMIT}&unreadOnly=false`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const newItems: INotification[] = json.data ?? [];
      const pagination = json.pagination;

      setItems(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const unique = newItems.filter(n => !existingIds.has(n._id));
        return [...prev, ...unique];
      });

      setHasMore(pagination.page < pagination.pages);
    } catch (e: any) {
      setError('Failed to load notifications. Please try refreshing.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      setInitialLoad(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      fetchPage(1);
    }
  }, [isAuthenticated, isInitialized]); // eslint-disable-line

  useEffect(() => {
    if (page > 1) {
      fetchPage(page);
    }
  }, [page]); // eslint-disable-line

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          setPage(p => p + 1);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, items.length, loading]);

  const handleMarkAllRead = async () => {
    setError('');
    try {
      await triggerMarkAll().unwrap();
      dispatch(markAllRead());
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      setError('Failed to mark all notifications as read.');
    }
  };

  const handleMarkOneRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setError('');
    try {
      await triggerMarkRead(id).unwrap();
      dispatch(markOneRead(id));
      setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      setError('Failed to mark notification as read.');
    }
  };

  const handleItemClick = async (n: INotification) => {
    setItems(prev => prev.map(item => item._id === n._id ? { ...item, isRead: true } : item));
    dispatch(markOneRead(n._id));
    try {
      await triggerMarkRead(n._id).unwrap();
    } catch (err) {
      console.error('Failed to sync item read status onto server stack:', err);
    }
    const path = getNavigationPath(n.type, n.payload, role);
    if (path) router.push(path);
  };

  const handleRefresh = () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setInitialLoad(true);
    isFetchingRef.current = false;
    fetchPage(1);
  };

  // ─── SEGMENTED AUTHENTICATION SHIELDS ──────────────────────────────────────
  if (!isInitialized) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-16 bg-stone-200 dark:bg-stone-800 rounded-xl w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div>
          <h2 className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100">Access Denied</h2>
          <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">Please sign in to view your real-time notification records index feed.</p>
        </div>
        <Button
          onClick={() => router.replace('/login')}
          className="w-full h-12 rounded-xl bg-green-800 hover:bg-green-700 text-white font-semibold"
        >
          Proceed to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 w-full overflow-hidden">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight flex items-center gap-3">
            Notifications Hub
            {unreadCount > 0 && (
              <span className="bg-green-800 dark:bg-green-700 text-white text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold shadow-sm">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-1 font-medium">
            {items.length} items loaded • Page {page} {hasMore ? '' : '(All records caught up)'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="rounded-xl text-xs">
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl text-xs">
            Refresh Feed
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {initialLoad && loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 py-20 text-center flex flex-col items-center justify-center gap-4 shadow-sm px-4">
          <div className="w-16 h-16 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400 border border-stone-100 dark:border-stone-800">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-100">Inbox Completely Clear</p>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">No alerts or status log entries monitored on your account profile path.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const isUnread = !n.isRead;
            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer shadow-sm relative group hover:shadow-md ${isUnread
                    ? 'bg-green-50/20 dark:bg-green-950/10 border-green-200/80 dark:border-green-900/40'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800/80 hover:bg-stone-50/50 dark:hover:bg-stone-800/40'
                  }`}
              >
                {/* Visual Context SVG Asset Node */}
                {getNotificationIcon(n.type)}

                {/* Metric Payload Description Information Block */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">
                      {n.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 font-sans whitespace-nowrap">
                      {fmtTime(n.createdAt)}
                    </span>
                  </div>
                  <p className={`font-sans text-sm leading-snug break-words pr-4 ${isUnread ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-400'}`}>
                    {n.message}
                  </p>
                </div>

                {/* Action Frame Mark-Read Option Trigger */}
                <div className="flex items-center self-center flex-shrink-0 h-full">
                  {isUnread ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleMarkOneRead(n._id, e)}
                      className="rounded-lg text-xs md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <div className="w-2 h-2 border border-transparent mr-2" />
                  )}
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll Sentinel Flag Intersection Element Target */}
          <div ref={sentinelRef} className="h-px w-full" />

          {/* Lazy Page Loading Stream Footnote Spacers */}
          {loading && !initialLoad && (
            <div className="text-center py-4 font-sans text-xs font-medium text-stone-400 dark:text-stone-500 flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Retrieving historical logs...
            </div>
          )}

          {/* Complete Array Traversal Index End Banner Marker */}
          {!hasMore && items.length > 0 && (
            <div className="text-center py-4 font-sans text-xs text-stone-400 dark:text-stone-600 font-medium tracking-wide">
              — All {items.length} operational records successfully synchronized —
            </div>
          )}
        </div>
      )}
    </div>
  );
}