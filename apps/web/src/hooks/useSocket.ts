'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '@/lib/socket';
import { RootState } from '@/store';

export const useSocket = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    const onConnect = () => {
      console.log('[socket] connected:', socket.id);
    };
    const onConnectError = (err: Error) => {
      console.warn('[socket] connection error:', err.message);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);

    // Do NOT disconnect on unmount — socket is a singleton.
    // Only disconnect on logout via disconnectSocket().
    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    };
  }, [isAuthenticated]);
};
