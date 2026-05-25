'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { markAllRead, markOneRead, Notification } from '@/store/notificationSlice';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { useGetNotificationsQuery, useMarkAllReadMutation } from '@/store/endpoints/notificationApi';
import { addNotification } from '@/store/notificationSlice';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case SOCKET_EVENTS.NEW_DEAL:
      return '🤝';
    case SOCKET_EVENTS.OFFER_ACCEPTED:
      return '🎉';
    case SOCKET_EVENTS.ORDER_STATUS_UPDATED:
      return '📦';
    case SOCKET_EVENTS.NEW_OFFER_RECEIVED:
      return '💬';
    default:
      return '🔔';
  }
};

const getNavigationPath = (notification: Notification): string | null => {
  const { type, payload } = notification;
  if (type === SOCKET_EVENTS.NEW_DEAL && payload?.orderId) {
    return `/admin/orders/${payload.orderId}`;
  }
  if (type === SOCKET_EVENTS.OFFER_ACCEPTED && payload?.orderId) {
    return `/buyer/orders/${payload.orderId}`;
  }
  if (type === SOCKET_EVENTS.ORDER_STATUS_UPDATED && payload?.orderId) {
    return `/buyer/orders/${payload.orderId}`;
  }
  if (type === SOCKET_EVENTS.NEW_OFFER_RECEIVED && payload?.listingId) {
    return `/kisan/listings/${payload.listingId}/view`;
  }
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
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch persisted notifications from DB
  const { data: apiNotifications } = useGetNotificationsQuery({ 
    page: 1, 
    unreadOnly: false 
  });

  // Seed Redux slice with DB notifications on mount
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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen((o) => !o);
    if (!isOpen && unreadCount > 0) {
      dispatch(markAllRead());
    }
  };

  const handleItemClick = (notification: Notification) => {
    dispatch(markOneRead(notification.id));
    setIsOpen(false);
    const path = getNavigationPath(notification);
    if (path) router.push(path);
  };

  // Calculate fixed position
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Position the panel to the right of the button since it's in a left sidebar
      setPanelStyle({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left), // Don't go off left edge
      });
    }
  }, [isOpen]);

  return (
    <>
      {/* Bell Button */}
      <button
        ref={btnRef}
        id="notification-bell-btn"
        onClick={handleBellClick}
        className="relative p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none z-10">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Fixed position to escape overflow clipping */}
      {isOpen && (
        <div 
          ref={panelRef}
          style={panelStyle}
          className="fixed w-80 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 font-sans">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => dispatch(markAllRead())}
                className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-sans"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">🔕</span>
                <p className="text-sm text-stone-400 dark:text-stone-500 font-sans">Koi notification nahi hai</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                    !notification.isRead ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 dark:text-stone-300 font-sans leading-snug line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 font-sans">
                        {fmtTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

