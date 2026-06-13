'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '@/store/endpoints/ordersApi';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { OrderStatus } from '@kropi/schemas/enum';

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

// ─── Party Card ───────────────────────────────────────────────────────────────
function PartyCard({ person, role }: { person: any; role: 'kisan' | 'buyer' }) {
  const isKisan = role === 'kisan';
  const accent = isKisan
    ? { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800/30', dot: 'bg-green-500', heading: 'text-green-900 dark:text-green-300', link: 'text-green-700 dark:text-green-400', badge: 'bg-green-200 text-green-800 dark:bg-green-800/50 dark:text-green-300', section: 'bg-green-100/60 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' }
    : { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/30', dot: 'bg-amber-500', heading: 'text-amber-900 dark:text-amber-300', link: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300', section: 'bg-amber-100/60 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' };

  const label = isKisan ? 'Kisan (Seller)' : 'Buyer';
  const initial = isKisan ? 'K' : 'B';

  return (
    <section className={`${accent.bg} rounded-2xl border ${accent.border} p-6 shadow-sm space-y-5`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`font-serif text-xl ${accent.heading} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${accent.dot} inline-block`} />
          {label}
        </h2>
        <div className="flex items-center gap-2">
          {person?.isActive === false && (
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Inactive</span>
          )}
          {person?.isVerified ? (
            <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${accent.badge}`}>✓ Verified</span>
          ) : (
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">Unverified</span>
          )}
        </div>
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-4">
        {person?.profilePhoto ? (
          <Image src={person.profilePhoto} alt={person.name ?? ''} width={56} height={56} className="rounded-2xl object-cover ring-2 ring-white dark:ring-stone-800 shadow-sm shrink-0" />
        ) : (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-sans font-bold text-xl shrink-0 ${isKisan ? 'bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-300' : 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300'}`}>
            {person?.name?.[0]?.toUpperCase() ?? initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-sans font-bold text-stone-900 dark:text-stone-50 text-base truncate">{person?.name ?? '—'}</p>
          {person?.fathersName && <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">S/O {person.fathersName}</p>}
          {person?.marka && <p className={`font-sans text-xs font-semibold mt-0.5 ${accent.link}`}>Marka: {person.marka}</p>}
          {person?.location && <p className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-0.5">📍 {person.location}</p>}
          {person?.createdAt && (
            <p className="font-sans text-[10px] text-stone-400 dark:text-stone-500 mt-1">
              Joined {new Date(person.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Rating */}
      {person?.totalRatings > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">★</span>
          <span className="font-sans text-sm font-semibold text-stone-700 dark:text-stone-200">{person.averageRating?.toFixed(1)}</span>
          <span className="font-sans text-xs text-stone-400">({person.totalRatings} ratings)</span>
        </div>
      )}

      {/* Contact */}
      <div className="space-y-2">
        {person?.phone && (
          <a href={`tel:${person.phone}`} className={`flex items-center gap-2 font-sans text-sm ${accent.link} hover:underline font-medium`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {person.phone}
          </a>
        )}
        {person?.email && (
          <a href={`mailto:${person.email}`} className="flex items-center gap-2 font-sans text-sm text-stone-500 dark:text-stone-400 hover:underline">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {person.email}
          </a>
        )}
      </div>

      {/* Bank Details */}
      {person?.bankDetails?.accountNumber && (
        <div className={`rounded-xl border ${accent.section} p-4 space-y-2`}>
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Bank Details</p>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Account</span>
              <span className="font-mono text-sm text-stone-800 dark:text-stone-100 font-medium">{person.bankDetails.accountNumber}</span>
            </div>
            {person.bankDetails.ifscCode && (
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs text-stone-500 dark:text-stone-400">IFSC</span>
                <span className="font-mono text-sm text-stone-800 dark:text-stone-100">{person.bankDetails.ifscCode}</span>
              </div>
            )}
            {person.bankDetails.bankName && (
              <div className="flex justify-between items-center">
                <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Bank</span>
                <span className="font-sans text-sm text-stone-700 dark:text-stone-200">{person.bankDetails.bankName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Photos */}
      {(person?.farmerIdPhoto || person?.aadharCardPhoto || person?.bankPassbookPhoto) && (
        <div className="space-y-2">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Documents</p>
          <div className="flex flex-wrap gap-2">
            {person.farmerIdPhoto && (
              <a href={person.farmerIdPhoto} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium border ${accent.section} ${accent.link} hover:opacity-80 transition-opacity`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                Farmer ID
              </a>
            )}
            {person.aadharCardPhoto && (
              <a href={person.aadharCardPhoto} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium border ${accent.section} ${accent.link} hover:opacity-80 transition-opacity`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Aadhaar
              </a>
            )}
            {person.bankPassbookPhoto && (
              <a href={person.bankPassbookPhoto} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium border ${accent.section} ${accent.link} hover:opacity-80 transition-opacity`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Passbook
              </a>
            )}
          </div>
        </div>
      )}

    </section>
  );
}

// ─── Status Update Panel ───────────────────────────────────────────────────────
function StatusUpdatePanel({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [updateStatus, { isLoading, isError, error }] = useUpdateOrderStatusMutation();
  const tStatus = useTranslations('status');

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
        <StatusBadge status={currentStatus as OrderStatus} />
      </div>

      {/* Available transitions */}
      <div>
        <label className="block font-sans text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          Move to
        </label>
        <div className="flex gap-2 flex-wrap">
          {availableTransitions.map((nextStatus) => (
            <Button
              key={nextStatus}
              id={`status-btn-${nextStatus}`}
              variant={selectedStatus === nextStatus ? 'default' : 'outline'}
              onClick={() => setSelectedStatus(nextStatus)}
              className="rounded-lg text-sm"
            >
              {tStatus(nextStatus as OrderStatus)}
            </Button>
          ))}
        </div>
      </div>

      {/* Note field */}
      <div>
        <label className="block font-sans text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
          Note{' '}<span className="normal-case font-normal text-stone-400">(optional — buyer aur kisan ko dikhega)</span>
        </label>
        <Textarea
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
          className="rounded-lg resize-none"
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
      <Button
        id="update-order-status-btn"
        onClick={handleSubmit}
        disabled={!selectedStatus || isLoading}
        className="w-full rounded-lg bg-stone-800 hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900"
      >
        {isLoading ? 'Updating…' : selectedStatus ? `Update to ${tStatus(selectedStatus as OrderStatus)}` : 'Select a status'}
      </Button>
    </div>
  );
}


export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetOrderByIdQuery(id);
  const order = data?.data;
  const tStatus = useTranslations('status');

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
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
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
                        {tStatus(step as OrderStatus)}
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
              <PartyCard person={kisan} role="kisan" />
              <PartyCard person={buyer} role="buyer" />
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
                          {tStatus((event.status ?? 'sale_confirmed') as OrderStatus)}
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
