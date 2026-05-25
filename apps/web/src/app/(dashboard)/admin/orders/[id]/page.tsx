'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery } from '@/store/endpoints/ordersApi';
import { RoleGuard } from '@/components/auth/RoleGuard';

const STATUS_LABELS: Record<string, string> = {
  sale_confirmed: 'Deal Confirmed',
  admin_notified: 'Admin Notified',
  qc_scheduled: 'QC Scheduled',
  qc_passed: 'QC Passed',
  qc_failed: 'QC Failed',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const STATUS_STYLES: Record<string, string> = {
  sale_confirmed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  admin_notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  qc_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  qc_passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50',
  qc_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50',
  pickup_scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50',
  in_transit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
  delivered: 'bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700',
};

const PROGRESS_STEPS = [
  'sale_confirmed', 'admin_notified', 'qc_scheduled', 'qc_passed',
  'pickup_scheduled', 'in_transit', 'delivered',
];

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-medium">{label}</p>
      <p className="font-sans text-stone-800 dark:text-stone-100">{value}</p>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetOrderByIdQuery(id);
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse p-4">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-32 mb-6" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">Order not found or access denied.</p>
        <button onClick={() => router.back()} className="text-sm underline text-stone-500">Go back</button>
      </div>
    );
  }

  const crop = order.listingId?.cropId;
  const kisan = order.sellerId as any;
  const buyer = order.buyerId as any;
  const listing = order.listingId as any;
  const totalValue = (order.agreedPrice ?? 0) * (order.quantity ?? 1);
  const currentStep = PROGRESS_STEPS.indexOf(order.status);

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-4xl mx-auto space-y-6 pb-16 px-4 sm:px-0 animate-in fade-in duration-500">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
              Order Detail
            </h1>
            <p className="font-mono text-sm text-stone-500 dark:text-stone-400 mt-1">{order._id}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${STATUS_STYLES[order.status] ?? ''}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {/* Progress Track */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
          <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-5">Order Progress</h2>
          {order.status === 'qc_failed' ? (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-sans text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              QC Failed — Contact both parties
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {PROGRESS_STEPS.map((step, idx) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`h-2 w-full rounded-full ${idx <= currentStep ? 'bg-red-600 dark:bg-red-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
                  <span className="text-[9px] font-sans text-stone-400 dark:text-stone-500 text-center hidden md:block leading-tight">
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Deal Info */}
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
          <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800/60 pb-4 mb-6">Deal Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="col-span-2 md:col-span-4">
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Crop</p>
              <p className="font-serif text-2xl text-stone-800 dark:text-stone-100">{crop?.name ?? '—'}</p>
            </div>
            <InfoRow label="Agreed Price" value={`₹${order.agreedPrice?.toLocaleString('en-IN')} / ${crop?.unit ?? 'unit'}`} />
            <InfoRow label="Quantity" value={`${order.quantity} ${order.unit ?? crop?.unit ?? 'unit'}`} />
            <div className="col-span-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl p-4">
              <p className="font-sans text-xs text-red-700 dark:text-red-400 uppercase tracking-wider font-semibold mb-1">Total Deal Value</p>
              <p className="font-serif text-3xl font-bold text-red-800 dark:text-red-400">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
            {listing?.farmAddress && (
              <div className="col-span-2 md:col-span-4">
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Farm Location</p>
                <p className="font-sans text-stone-700 dark:text-stone-300">
                  {listing.farmAddress}{listing.farmDistrict ? `, ${listing.farmDistrict}` : ''}{listing.farmState ? `, ${listing.farmState}` : ''}
                </p>
              </div>
            )}
            <div className="col-span-2 md:col-span-4 text-sm font-sans text-stone-400">
              Created on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </section>

        {/* Parties — Admin sees full contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kisan */}
          <section className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/30 p-6 shadow-sm">
            <h2 className="font-serif text-xl text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Kisan (Seller)
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center text-green-800 dark:text-green-300 font-sans font-bold text-lg">
                {kisan?.name?.[0]?.toUpperCase() ?? 'K'}
              </div>
              <div>
                <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{kisan?.name ?? '—'}</p>
                {kisan?.phone && (
                  <a href={`tel:${kisan.phone}`} className="font-sans text-green-700 dark:text-green-400 hover:underline text-sm font-medium">
                    📞 {kisan.phone}
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Buyer */}
          <section className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-6 shadow-sm">
            <h2 className="font-serif text-xl text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Buyer
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center text-amber-800 dark:text-amber-300 font-sans font-bold text-lg">
                {buyer?.name?.[0]?.toUpperCase() ?? 'B'}
              </div>
              <div>
                <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{buyer?.name ?? '—'}</p>
                {buyer?.phone && (
                  <a href={`tel:${buyer.phone}`} className="font-sans text-amber-700 dark:text-amber-400 hover:underline text-sm font-medium">
                    📞 {buyer.phone}
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
            <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-6">Activity Timeline</h2>
            <ol className="relative border-l border-stone-200 dark:border-stone-700 space-y-6 ml-3">
              {[...order.timeline].reverse().map((event: any, idx: number) => (
                <li key={idx} className="ml-6">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-stone-400 dark:bg-stone-500 border-2 border-white dark:border-stone-900" />
                  <div>
                    <p className="font-sans font-semibold text-stone-800 dark:text-stone-100 text-sm">
                      {STATUS_LABELS[event.status] ?? event.status}
                    </p>
                    {event.note && (
                      <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5 italic">"{event.note}"</p>
                    )}
                    <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-1">
                      {new Date(event.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

      </div>
    </RoleGuard>
  );
}
