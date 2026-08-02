import { useEffect, type PropsWithChildren } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiUrl, baseApi } from '@/store/baseApi';
import { addNotification } from '@/store/notificationSlice';
import { getToken } from '@/lib/secureToken';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const socketUrl = new URL(apiUrl).origin;

type InvalidateArg = Parameters<typeof baseApi.util.invalidateTags>[0];
type EventPayload = { orderId?: string; listingId?: string; [key: string]: unknown };

/**
 * Which cached resources each event dirties, beyond the notification list itself.
 * Port of web's useNotifications, but expressed in this app's tag conventions —
 * listing interests are keyed `{ Interest, id: listingId }` here, not web's
 * `{ Listing, id: 'interests-<id>' }`.
 */
const resourceTagsFor: Record<string, (data: EventPayload) => InvalidateArg> = {
  new_deal: () => ['Order'],
  offer_accepted: (data) => [
    'Order',
    'Interest',
    'Listing',
    ...(data.listingId ? [{ type: 'Listing' as const, id: data.listingId }] : []),
  ],
  offer_rejected: (data) => [
    'Interest',
    ...(data.listingId
      ? [{ type: 'Interest' as const, id: data.listingId }, { type: 'Listing' as const, id: data.listingId }]
      : []),
  ],
  order_status_updated: (data) => [
    'Order',
    ...(data.orderId ? [{ type: 'Order' as const, id: data.orderId }] : []),
  ],
  new_offer_received: (data) => [
    'Listing',
    'Interest',
    ...(data.listingId
      ? [{ type: 'Listing' as const, id: data.listingId }, { type: 'Interest' as const, id: data.listingId }]
      : []),
  ],
  interest_withdrawn: (data) => [
    'Listing',
    'Interest',
    ...(data.listingId
      ? [{ type: 'Listing' as const, id: data.listingId }, { type: 'Interest' as const, id: data.listingId }]
      : []),
  ],
  statement_updated: () => ['Statement'],
};

const events = Object.keys(resourceTagsFor);

export function SocketProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const token = getToken();
    if (!user || !token) return;

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    const onEvent = (type: string) => (data: EventPayload) => {
      dispatch(addNotification({
        id: String(data.notificationId ?? `${type}-${Date.now()}`),
        type,
        message: String(data.message ?? 'You have a new KropiGo update.'),
        payload: data,
        isRead: false,
        timestamp: String(data.createdAt ?? new Date().toISOString()),
      }));
      dispatch(baseApi.util.invalidateTags(['Notifications', 'NotificationCount']));
      // Refresh whatever the event actually changed, so an open listing or order
      // screen updates live instead of waiting for a pull-to-refresh.
      dispatch(baseApi.util.invalidateTags(resourceTagsFor[type](data)));
    };

    const handlers = events.map((event) => [event, onEvent(event)] as const);
    handlers.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
      socket.disconnect();
    };
  }, [dispatch, user]);

  return <>{children}</>;
}
