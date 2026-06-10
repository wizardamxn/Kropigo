'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '@/lib/socket';
import { addNotification } from '@/store/notificationSlice';
import { notificationApi } from '@/store/endpoints/notificationApi';
import { ordersApi } from '@/store/endpoints/ordersApi';
import { listingsApi } from '@/store/endpoints/listingsApi';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { RootState } from '@/store';
import { v4 as uuidv4 } from 'uuid';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    // Admin: new deal created
    const onNewDeal = (data: any) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.NEW_DEAL,
        message: data.message || `New deal: ${data.cropName} — ${data.quantity} ${data.unit} | ₹${data.totalAmount?.toLocaleString('en-IN')}`,
        payload: data,
        isRead: false,
        timestamp: data.createdAt || new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
      // New order exists — refresh the admin orders list
      dispatch(ordersApi.util.invalidateTags(['Order']));
    };

    // Buyer: offer accepted
    const onOfferAccepted = (data: any) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.OFFER_ACCEPTED,
        message: data.message || `🎉 Aapka offer accept ho gaya! ${data.cropName} — ₹${data.totalAmount?.toLocaleString('en-IN')}`,
        payload: data,
        isRead: false,
        timestamp: data.createdAt || new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
      // Interest flipped to accepted and an order was created — refresh those views
      dispatch(ordersApi.util.invalidateTags(['Order']));
      dispatch(listingsApi.util.invalidateTags(['Interest', 'Listing']));
    };

    // Buyer: offer rejected
    const onOfferRejected = (data: any) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.OFFER_REJECTED,
        message: data.message || `Aapka offer accept nahi hua: ${data.cropName}`,
        payload: data,
        isRead: false,
        timestamp: data.createdAt || new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
      dispatch(listingsApi.util.invalidateTags([
        'Interest',
        { type: 'Listing', id: data.listingId },
      ]));
    };

    // Both kisan & buyer: order status changed
    const onOrderStatusUpdated = (data: any) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.ORDER_STATUS_UPDATED,
        message: data.message || `Order status updated: ${data.status ?? data.cropName}`,
        payload: data,
        isRead: false,
        timestamp: data.createdAt || new Date().toISOString(),
      }));

      // Invalidate the specific order so any open order detail page refetches
      dispatch(ordersApi.util.invalidateTags([
        { type: 'Order', id: data.orderId },
        'Order'
      ]));

      // Also invalidate notifications cache
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    };

    // Kisan: new offer received on listing
    const onNewOfferReceived = (data: any) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.NEW_OFFER_RECEIVED,
        message: data.message || `Naya offer: ${data.cropName} — ₹${data.offeredPrice}/unit by ${data.buyerName}`,
        payload: data,
        isRead: false,
        timestamp: data.createdAt || new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
      // Refresh the listing + its interests list (cache key `interests-<id>`)
      dispatch(listingsApi.util.invalidateTags([
        { type: 'Listing', id: data.listingId },
        { type: 'Listing', id: `interests-${data.listingId}` },
        'Listing',
      ]));
    };

    socket.on(SOCKET_EVENTS.NEW_DEAL, onNewDeal);
    socket.on(SOCKET_EVENTS.OFFER_ACCEPTED, onOfferAccepted);
    socket.on(SOCKET_EVENTS.OFFER_REJECTED, onOfferRejected);
    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, onOrderStatusUpdated);
    socket.on(SOCKET_EVENTS.NEW_OFFER_RECEIVED, onNewOfferReceived);

    return () => {
      // Remove only our own handlers — a bare socket.off(event) would also
      // strip listeners registered elsewhere on the shared singleton socket.
      socket.off(SOCKET_EVENTS.NEW_DEAL, onNewDeal);
      socket.off(SOCKET_EVENTS.OFFER_ACCEPTED, onOfferAccepted);
      socket.off(SOCKET_EVENTS.OFFER_REJECTED, onOfferRejected);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, onOrderStatusUpdated);
      socket.off(SOCKET_EVENTS.NEW_OFFER_RECEIVED, onNewOfferReceived);
    };
  }, [isAuthenticated, dispatch]);
};
