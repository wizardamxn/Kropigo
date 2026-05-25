'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '@/lib/socket';
import { addNotification } from '@/store/notificationSlice';
import { notificationApi } from '@/store/endpoints/notificationApi';
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
    socket.on(SOCKET_EVENTS.NEW_DEAL, (data) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.NEW_DEAL,
        message: `New deal: ${data.cropName} — ${data.quantity} ${data.unit} | ₹${data.totalAmount?.toLocaleString('en-IN')}`,
        payload: data,
        isRead: false,
        timestamp: new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    // Buyer: offer accepted
    socket.on(SOCKET_EVENTS.OFFER_ACCEPTED, (data) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.OFFER_ACCEPTED,
        message: `🎉 Aapka offer accept ho gaya! ${data.cropName} — ₹${data.totalAmount?.toLocaleString('en-IN')}`,
        payload: data,
        isRead: false,
        timestamp: new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    // Both kisan & buyer: order status changed
    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, (data) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.ORDER_STATUS_UPDATED,
        message: `Order update: ${data.status ?? data.cropName}`,
        payload: data,
        isRead: false,
        timestamp: new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    // Kisan: new offer received on listing
    socket.on(SOCKET_EVENTS.NEW_OFFER_RECEIVED, (data) => {
      dispatch(addNotification({
        id: data.notificationId || uuidv4(),
        type: SOCKET_EVENTS.NEW_OFFER_RECEIVED,
        message: `Naya offer: ${data.cropName} — ₹${data.offeredPrice}/unit by ${data.buyerName}`,
        payload: data,
        isRead: false,
        timestamp: new Date().toISOString(),
      }));
      dispatch(notificationApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    return () => {
      socket.off(SOCKET_EVENTS.NEW_DEAL);
      socket.off(SOCKET_EVENTS.OFFER_ACCEPTED);
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED);
      socket.off(SOCKET_EVENTS.NEW_OFFER_RECEIVED);
    };
  }, [isAuthenticated, dispatch]);
};
