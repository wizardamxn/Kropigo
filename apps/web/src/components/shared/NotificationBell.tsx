'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { markAllRead, markOneRead, Notification } from '@/store/notificationSlice';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { useGetNotificationsQuery, useMarkAllReadMutation } from '@/store/endpoints/notificationApi';
import { addNotification } from '@/store/notificationSlice';

// Premium context-aware SVG icons replacing the raw emojis
const getNotificationIcon = (type: string) => {
  switch (type) {
    case SOCKET_EVENTS.NEW_DEAL:
      return (
        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
      );
    case SOCKET_EVENTS.OFFER_ACCEPTED:
      return (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
        </div>
      );
    case SOCKET_EVENTS.ORDER_STATUS_UPDATED:
      return (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </div>
      );
    case SOCKET_EVENTS.NEW_OFFER_RECEIVED:
      return (
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
        </div>
      );
    default:
      return (
        <div className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </div>
      );
  }
};

const getNavigationPath = (notification: Notification): string | null => {
  const { type, payload } = notification;
  if (type === SOCKET_EVENTS.NEW_DEAL && payload?.orderId) return `/admin/orders/${payload.orderId}`;
  if (type === SOCKET_EVENTS.OFFER_ACCEPTED && payload?.orderId) return `/buyer/orders/${payload.orderId}`;
  if (type === SOCKET_EVENTS.ORDER_STATUS_UPDATED && payload?.orderId) return `/buyer/orders/${payload.orderId}`;
  if (type === SOCKET_EVENTS.NEW_OFFER_RECEIVED && payload?.listingId) return `/kisan/listings/${payload.listingId}/view`;
  return null;
};

const fmtTime = (isoString: string) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return 'just now';
  if (hours < 1) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const NotificationBell = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const [triggerMarkAll] = useMarkAllReadMutation();

  const { data: apiNotifications } = useGetNotificationsQuery({ 
    page: 1, 
    unreadOnly: false 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const dropdownWidth = Math.min(384, viewportWidth - 32);

    let left = rect.right - dropdownWidth;

    if (left < 16) {
      left = 16;
    }

    if (left + dropdownWidth > viewportWidth - 16) {
      left = viewportWidth - dropdownWidth - 16;
    }

    const top = rect.bottom + 8;
    const maxHeight = Math.min(360, viewportHeight - top - 16);

    setCoords({ top, left, width: dropdownWidth, maxHeight });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Safe data synchronization without infinite re-renders or rendering issues
  useEffect(() => {
    if (apiNotifications?.data) {
      apiNotifications.data.forEach((n: any) => {
        dispatch(addNotification({
          id: n._id,
          type: n.type,
          message: n.message,
          payload: n.payload,
          isRead: n.isRead,
          timestamp: new Date(n.createdAt).toISOString()
        }));
      });
    }
  }, [apiNotifications, dispatch]);

  // Unified click-outside layout closure handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await triggerMarkAll().unwrap();
      dispatch(markAllRead());
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const handleItemClick = (notification: Notification) => {
    dispatch(markOneRead(notification.id));
    setIsOpen(false);
    const path = getNavigationPath(notification);
    if (path) router.push(path);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      
      {/* Bell Action Target Wrapper */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center ${
          isOpen 
            ? 'bg-stone-100 dark:bg-stone-800 text-green-800 dark:text-green-500' 
            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-amber-500 dark:bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── DROPDOWN PANEL (Responsive layout positioning using CSS anchor patterns) ─── */}
      {isOpen && mounted && coords && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
          }}
          className="z-[100] bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col"
        >
          {/* Menu Header Area */}
          <div className="flex-shrink-0 px-4 py-3.5 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/20">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 font-sans tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:underline transition-colors font-sans"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Interactive Notifications Stack */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/40">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center text-stone-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <p className="font-serif text-base font-medium text-stone-800 dark:text-stone-200">कोई नया अपडेट नहीं है</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">No notifications found right now.</p>
                </div>
              </div>
            ) : (
              [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors flex items-start gap-3.5 min-h-[64px] ${
                    !notification.isRead ? 'bg-green-50/30 dark:bg-green-950/10' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-sans leading-snug break-words ${
                      !notification.isRead ? 'text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-400'
                    }`}>
                      {notification.message}
                    </p>
                    <span className="block text-xs text-stone-400 dark:text-stone-500 mt-1 font-sans">
                      {fmtTime(notification.timestamp)}
                    </span>
                  </div>

                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-green-700 dark:bg-green-500 rounded-full flex-shrink-0 mt-2 shadow-sm animate-pulse" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};