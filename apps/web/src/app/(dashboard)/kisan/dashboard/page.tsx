'use client';

import { useAuth } from '@/hooks/useAuth';
import { useGetListingsQuery } from '@/store/endpoints/listingsApi';
import Link from 'next/link';

// Helper function to color-code status badges
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
    case 'draft':
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    case 'sale_confirmed':
    case 'closed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    default:
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
  }
};

// Helper function to format status text nicely
const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function KisanDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useGetListingsQuery(
    { sellerId: user?.id, limit: 100 },
    { skip: !user?.id }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/3"></div>
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/4"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
        <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <p className="font-sans text-red-800 dark:text-red-300 font-medium">Failed to load dashboard data.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl shadow-sm text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors">Try Again</button>
      </div>
    );
  }

  const listings: any[] = data?.data ?? [];
  const open = listings.filter((l) => l.status === 'open').length;
  const sold = listings.filter((l) => ['sale_confirmed', 'closed'].includes(l.status)).length;
  const draft = listings.filter((l) => l.status === 'draft').length;

  const interestListings = listings.filter((l) => (l.interestCount ?? 0) > 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          Dashboard
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 text-lg">
          Welcome back, <span className="font-medium text-green-800 dark:text-green-500">{user?.name}</span>
        </p>
      </header>

      {/* Summary Cards Grid */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Listings" value={listings.length} icon="M4 6h16M4 10h16M4 14h16M4 18h16" href="/kisan/listings" />
          <StatCard title="Active (Open)" value={open} icon="M5 13l4 4L19 7" color="green" href="/kisan/listings" />
          <StatCard title="Drafts" value={draft} icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" color="stone" href="/kisan/listings" />
          <StatCard title="Sold / Closed" value={sold} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="blue" href="/kisan/listings" />
        </div>
      </section>

      {/* Activity Summary */}
      <section className="bg-stone-50 dark:bg-stone-900/50 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">Activity</h2>
        <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-amber-700 dark:text-amber-400 text-base">{interestListings}</span> of your listings have received buyer interest.
          Visit <Link href="/kisan/listings" className="underline text-green-800 dark:text-green-500">My Listings</Link> to review and act on offers.
        </p>
      </section>

      {/* Recent Listings Section */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100">Recent Listings</h2>
          <Link 
            href="/kisan/listings" 
            className="font-sans text-sm font-medium text-green-800 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:underline px-2 py-1 rounded-lg"
          >
            View All
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <p className="font-sans text-stone-500 dark:text-stone-400">You haven't created any listings yet.</p>
            <Link 
              href="/kisan/listings/create" 
              className="mt-2 h-12 px-6 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors inline-flex items-center justify-center"
            >
              Create First Listing
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/50 font-sans text-sm text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Crop</th>
                    <th className="px-6 py-4 font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-center">Interests</th>
                    <th className="px-6 py-4 font-medium">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {listings.slice(0, 5).map((l) => (
                    <tr key={l._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-sans text-stone-800 dark:text-stone-200 font-medium">
                        <Link href={`/kisan/listings/${l._id}/view`} className="hover:underline">
                          {l.cropId?.name ?? l.cropId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-sans text-stone-600 dark:text-stone-300">
                        {l.quantity} <span className="text-stone-400 text-sm">{l.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(l.status)}`}>
                          {formatStatus(l.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {l.interestCount > 0 ? (
                          <span className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                            {l.interestCount}
                            {l.hasUnreadInterests && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm text-stone-500 dark:text-stone-400">
                        {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col gap-4 divide-y divide-stone-100 dark:divide-stone-800">
              {listings.slice(0, 5).map((l) => (
                <Link
                  key={l._id}
                  href={`/kisan/listings/${l._id}/view`}
                  className="p-4 flex flex-col gap-3 hover:bg-stone-50/40 dark:hover:bg-stone-800/10 active:scale-[0.99] transition-all duration-200 block text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
                        {l.cropId?.name ?? l.cropId}
                      </h3>
                      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                        {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(l.status)}`}>
                      {formatStatus(l.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end bg-stone-50 dark:bg-stone-950/50 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex flex-col">
                      <span className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Quantity</span>
                      <span className="font-sans text-stone-800 dark:text-stone-200">{l.quantity} {l.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Reusable Sub-component for the top statistics grid
function StatCard({ title, value, icon, color = 'green', href }: { title: string, value: number, icon: string, color?: 'green' | 'stone' | 'blue', href?: string }) {
  const colorMap = {
    green: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-500',
    stone: 'bg-stone-100 text-stone-700 dark:bg-stone-800/50 dark:text-stone-400',
    blue: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500'
  };

  const content = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className="font-sans text-sm text-stone-500 dark:text-stone-400 font-medium mb-1">{title}</p>
        <p className="font-serif text-3xl text-stone-800 dark:text-stone-100">{value}</p>
      </div>
    </>
  );

  const className = "bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col gap-3 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 active:scale-[0.98] transition-all duration-200 text-left w-full cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col gap-3">
      {content}
    </div>
  );
}