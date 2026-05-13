'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function Home() {
  return (
    <RoleGuard>
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    </RoleGuard>
  );
}
