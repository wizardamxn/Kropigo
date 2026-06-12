'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/endpoints/authApi';
import { baseApi } from '@/store/baseApi';
import { disconnectSocket } from '@/lib/socket';

/**
 * Single source of truth for logging out. Clears the server cookie, the socket,
 * the RTK Query cache, and the auth slice, then routes to /login.
 *
 * Returns [logout, isLoggingOut].
 */
export const useLogout = (): [() => Promise<void>, boolean] => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {
      // Even if the network call fails, clear local state so the user is logged out.
      console.error('Logout request failed, clearing local session anyway', e);
    } finally {
      disconnectSocket();
      dispatch(clearUser());
      dispatch(baseApi.util.resetApiState()); // drop cached queries so the next user starts clean
      router.replace('/login');
    }
  };

  return [handleLogout, isLoading];
};
