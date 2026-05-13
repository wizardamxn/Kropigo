'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // If undefined, just requires authentication and profile completion
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, role, hasCompletedProfile } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasCompletedProfile && pathname !== '/profile-setup') {
      router.replace('/profile-setup');
      return;
    }

    if (hasCompletedProfile && pathname === '/profile-setup') {
        router.replace(`/${role}/dashboard`);
        return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(`/${role}/dashboard`); // Redirect to their actual dashboard
    }
  }, [isAuthenticated, role, hasCompletedProfile, allowedRoles, router, pathname]);

  // If not authenticated, or requires profile setup, or wrong role, don't render children yet to avoid flicker
  if (!isAuthenticated) return null;
  if (!hasCompletedProfile && pathname !== '/profile-setup') return null;
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};
