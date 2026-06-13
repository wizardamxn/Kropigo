'use client';

import { DashboardShell } from '@/components/shared/DashboardShell';
import { LayoutDashboard, ClipboardList, PlusCircle, ShoppingBag } from 'lucide-react';

const navLinks = [
  { 
    href: '/kisan/dashboard', 
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  { 
    href: '/kisan/listings', 
    label: 'Listings',
    Icon: ClipboardList,
  },
  { 
    href: '/kisan/listings/create', 
    label: 'Create',
    Icon: PlusCircle,
  },
  { 
    href: '/kisan/orders', 
    label: 'Orders',
    Icon: ShoppingBag,
  },
];

export default function KisanLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navLinks={navLinks}
      accent="green"
      role="kisan"
      allowedRoles={['kisan']}
    >
      {children}
    </DashboardShell>
  );
}