'use client';

import { DashboardShell } from '@/components/shared/DashboardShell';
import { LayoutDashboard, ShoppingBag, ShieldCheck } from 'lucide-react';

const navLinks = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    Icon: ShoppingBag,
  },
  {
    href: '/admin/kisans',
    label: 'Kisans',
    Icon: ShieldCheck,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navLinks={navLinks}
      accent="red"
      role="admin"
      brandSubtitle="Ops Panel"
      allowedRoles={['admin']}
    >
      {children}
    </DashboardShell>
  );
}