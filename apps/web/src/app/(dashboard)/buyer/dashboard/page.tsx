'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /buyer/dashboard — permanent redirect to the buyer's home: /buyer/marketplace
 * This page exists only to safely handle any stale link or hard-coded redirect
 * that points to /buyer/dashboard (which is not the buyer's entry point).
 */
export default function BuyerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/buyer/marketplace');
  }, [router]);

  return null;
}
