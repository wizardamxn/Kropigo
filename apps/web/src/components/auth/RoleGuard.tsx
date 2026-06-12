'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // If undefined, just requires authentication and profile completion
}

const homeFor = (role?: string) =>
  role === 'buyer' ? '/buyer/marketplace' : `/${role}/dashboard`;

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, role, hasCompletedProfile } = useAuth();

  useEffect(() => {
    // Wait until /auth/me has resolved before making any redirect decisions.
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!hasCompletedProfile && pathname !== '/profile-setup') {
      router.replace('/profile-setup');
      return;
    }

    if (hasCompletedProfile && pathname === '/profile-setup') {
      router.replace(homeFor(role));
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(homeFor(role)); // Wrong role → send to their own home
    }
  }, [isInitialized, isAuthenticated, role, hasCompletedProfile, allowedRoles, router, pathname]);

  // Render nothing until we have a definitive answer, to avoid flicker / wrong-content flash.
  if (!isInitialized) return null;
  if (!isAuthenticated) return null;
  if (!hasCompletedProfile && pathname !== '/profile-setup') return null;
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};
