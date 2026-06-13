'use client';

import { DashboardShell } from '@/components/shared/DashboardShell';
import { LayoutDashboard, ShoppingCart, FileEdit, ClipboardList } from 'lucide-react';

const navLinks = [
  {
    href: '/buyer/dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    href: '/buyer/marketplace',
    label: 'Marketplace',
    Icon: ShoppingCart,
  },
  {
    href: '/buyer/interests',
    label: 'Interests',
    Icon: FileEdit,
  },
  {
    href: '/buyer/orders',
    label: 'Orders',
    Icon: ClipboardList,
  },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navLinks={navLinks}
      accent="amber"
      role="buyer"
      allowedRoles={['buyer']}
    >
      {children}
    </DashboardShell>
  );
}