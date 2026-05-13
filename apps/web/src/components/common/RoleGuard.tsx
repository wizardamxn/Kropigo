'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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
        // Redirect to their respective dashboard
        router.push(`/${role}/dashboard`);
        return;
      }
    }
  }, [isAuthenticated, role, router, pathname, allowedRoles]);

  if (!isAuthenticated) return null;
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};
