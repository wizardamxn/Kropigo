'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearUser, setUser } from '@/store/slices/authSlice';
import { useGetMeQuery } from '@/store/endpoints/authApi';

/**
 * Fires GET /auth/me on mount using the httpOnly cookie.
 * Populates Redux with the current user so components can read it.
 * If the cookie is missing or invalid the server returns 401 and we stay logged out.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((s) => s.auth);

  const { data, isSuccess, isError } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (isSuccess && data?.data?.user) {
      dispatch(setUser(data.data.user));
    }
  }, [isSuccess, data]);

  useEffect(() => {
    if (isError) {
      dispatch(clearUser()); // sets isInitialized = true even on 401
    }
  }, [isError]);

  // Block rendering until we know auth status
  if (!isInitialized) return null; // or a loading spinner

  return <>{children}</>;
}