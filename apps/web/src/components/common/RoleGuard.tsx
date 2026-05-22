'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { isAuthenticated, isInitialized, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until /auth/me has resolved before making any redirect decisions
    if (!isInitialized) return;

    // 1. If not authenticated, redirect to login
    if (!isAuthenticated) {
      if (!pathname.startsWith('/login')) {
        router.push('/login');
      }
      return;
    }

    // 2. Check specific roles if provided
    if (allowedRoles && allowedRoles.length > 0 && role) {
      if (!allowedRoles.includes(role)) {
        const home = role === 'buyer' ? '/buyer/marketplace' : `/${role}/dashboard`;
        router.push(home);
        return;
      }
    }
  }, [isInitialized, isAuthenticated, role, router, pathname, allowedRoles]);

  // Still waiting for auth/me — render nothing (or a spinner)
  if (!isInitialized) return null;

  if (!isAuthenticated) return null;
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};