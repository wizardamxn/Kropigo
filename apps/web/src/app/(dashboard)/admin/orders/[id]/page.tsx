'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '@/store/endpoints/ordersApi';
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  sale_confirmed:   ['admin_notified'],
  admin_notified:   ['qc_scheduled'],
  qc_scheduled:     ['qc_passed', 'qc_failed'],
  qc_passed:        ['pickup_scheduled'],
  qc_failed:        [],
  pickup_scheduled: ['in_transit'],
  in_transit:       ['delivered'],
  delivered:        []
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

// ─── Status Update Panel ───────────────────────────────────────────────────────
function StatusUpdatePanel({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [updateStatus, { isLoading, isError, error }] = useUpdateOrderStatusMutation();

  const availableTransitions = VALID_TRANSITIONS[currentStatus] || [];
  const isTerminal = availableTransitions.length === 0;

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    try {
      await updateStatus({
        orderId,
        status: selectedStatus,
        note: note.trim() || undefined
      }).unwrap();
      setSelectedStatus('');
      setNote('');
    } catch (err: any) {
      console.error('Status update failed:', err);
    }
  };

  if (isTerminal) {
    return (
      <div className={`rounded-2xl p-5 border ${
        currentStatus === 'delivered'
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        <p className={`text-sm font-medium font-sans ${
          currentStatus === 'delivered'
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-red-700 dark:text-red-300'
        }`}>
          {currentStatus === 'delivered'
            ? '✓ Order successfully delivered. No further updates needed.'
            : '✗ Quality check failed. This order is closed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4 bg-white dark:bg-stone-900 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        Update Order Status
      </h3>

      {/* Current status */}
      <div className="flex items-center gap-2">
        <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Current:</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS_STYLES[currentStatus] ?? ''}` }>
          {STATUS_LABELS[currentStatus]}
        </span>
      </div>

      {/* Available transitions */}
      <div>
        <label className="block font-sans text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          Move to
        </label>
        <div className="flex gap-2 flex-wrap">
          {availableTransitions.map((nextStatus) => (
            <button
              key={nextStatus}
              id={`status-btn-${nextStatus}`}
              onClick={() => setSelectedStatus(nextStatus)}
              className={`px-3 py-1.5 rounded-lg font-sans text-sm font-medium border transition-all ${
                selectedStatus === nextStatus
                  ? `${STATUS_STYLES[nextStatus]} ring-2 ring-offset-1 ring-current`
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500'
              }`}
            >
              {STATUS_LABELS[nextStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Note field */}
      <div>
        <label className="block font-sans text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          Note{' '}<span className="normal-case font-normal text-stone-400">(optional — buyer aur kisan ko dikhega)</span>
        </label>
        <textarea
          id="order-status-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            selectedStatus === 'qc_scheduled'
              ? 'e.g. Hamari team kal 11 AM aapke farm visit karegi'
              : selectedStatus === 'qc_failed'
              ? 'e.g. Moisture level required se zyada tha'
              : selectedStatus === 'pickup_scheduled'
              ? 'e.g. Truck kal 2 PM tak pahunch jayega'
              : 'Admin note (buyer aur kisan ko dikhega)'
          }
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500"
        />
        <p className="font-sans text-xs text-stone-400 mt-1 text-right">{note.length}/500</p>
      </div>

      {/* Error message */}
      {isError && (
        <p className="font-sans text-xs text-red-600 dark:text-red-400">
          {(error as any)?.data?.message || 'Update failed. Please try again.'}
        </p>
      )}

      {/* Submit */}
      <button
        id="update-order-status-btn"
        onClick={handleSubmit}
        disabled={!selectedStatus || isLoading}
        className="w-full py-2.5 px-4 rounded-lg font-sans font-medium text-sm bg-stone-800 hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Updating…' : selectedStatus ? `Update to ${STATUS_LABELS[selectedStatus]}` : 'Select a status'}
      </button>
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

        {/* Two-column layout: left = detail sections, right = status update panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column (2/3) — all existing detail sections */}
          <div className="lg:col-span-2 space-y-6">

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

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kisan */}
              <section className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/30 p-6 shadow-sm">
                <h2 className="font-serif text-xl text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Kisan (Seller)
                  {kisan?.isVerified && (
                    <span className="ml-auto text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-green-200 text-green-800 dark:bg-green-800/50 dark:text-green-300">
                      ✓ Verified
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  {kisan?.profilePhoto ? (
                    <img src={kisan.profilePhoto} alt={kisan.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center text-green-800 dark:text-green-300 font-sans font-bold text-lg">
                      {kisan?.name?.[0]?.toUpperCase() ?? 'K'}
                    </div>
                  )}
                  <div>
                    <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{kisan?.name ?? '—'}</p>
                    {kisan?.location && (
                      <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">📍 {kisan.location}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {kisan?.phone && (
                    <a href={`tel:${kisan.phone}`} className="flex items-center gap-2 font-sans text-sm text-green-700 dark:text-green-400 hover:underline font-medium">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {kisan.phone}
                    </a>
                  )}
                  {kisan?.email && (
                    <a href={`mailto:${kisan.email}`} className="flex items-center gap-2 font-sans text-sm text-stone-500 dark:text-stone-400 hover:underline">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {kisan.email}
                    </a>
                  )}
                </div>
              </section>

              {/* Buyer */}
              <section className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 p-6 shadow-sm">
                <h2 className="font-serif text-xl text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Buyer
                  {buyer?.isVerified && (
                    <span className="ml-auto text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300">
                      ✓ Verified
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  {buyer?.profilePhoto ? (
                    <img src={buyer.profilePhoto} alt={buyer.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center text-amber-800 dark:text-amber-300 font-sans font-bold text-lg">
                      {buyer?.name?.[0]?.toUpperCase() ?? 'B'}
                    </div>
                  )}
                  <div>
                    <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{buyer?.name ?? '—'}</p>
                    {buyer?.location && (
                      <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">📍 {buyer.location}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {buyer?.phone && (
                    <a href={`tel:${buyer.phone}`} className="flex items-center gap-2 font-sans text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {buyer.phone}
                    </a>
                  )}
                  {buyer?.email && (
                    <a href={`mailto:${buyer.email}`} className="flex items-center gap-2 font-sans text-sm text-stone-500 dark:text-stone-400 hover:underline">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {buyer.email}
                    </a>
                  )}
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

          </div>{/* end left column */}

          {/* Right column (1/3) — status update panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <StatusUpdatePanel
                orderId={order._id}
                currentStatus={order.status}
              />
            </div>
          </div>

        </div>{/* end grid */}

      </div>
    </RoleGuard>
  );
}
