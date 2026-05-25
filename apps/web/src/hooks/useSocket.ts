'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { RootState } from '@/store';

export const useSocket = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = getSocket();

      socket.on('connect', () => {
        console.log('[socket] connected:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('[socket] connection error:', err.message);
      });
    }

    // Do NOT disconnect on unmount — socket is a singleton.
    // Only disconnect on logout via disconnectSocket().
  }, [isAuthenticated]);
};
