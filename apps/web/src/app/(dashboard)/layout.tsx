'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="min-h-screen bg-gray-100">
        {/* We can add a top navbar or sidebar here later */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
