'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetListingByIdQuery, useSubmitInterestMutation, useGetMyInterestForListingQuery } from '@/store/endpoints/listingsApi';
import { useGetMandiRatesQuery } from '@/store/endpoints/mandiApi';
import { useAuth } from '@/hooks/useAuth';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtPrice = (n: number) => '₹' + n.toLocaleString('en-IN');

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtShortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const interestStatusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    text: 'text-amber-800 dark:text-amber-400',
    label: 'Pending',
  },
  accepted: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800/50',
    text: 'text-green-800 dark:text-green-400',
    label: 'Accepted',
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/50',
    text: 'text-red-700 dark:text-red-400',
    label: 'Rejected',
  },
  withdrawn: {
    bg: 'bg-stone-50 dark:bg-stone-900',
    border: 'border-stone-200 dark:border-stone-700',
    text: 'text-stone-600 dark:text-stone-400',
    label: 'Withdrawn',
  },
};

// ─── MANDI RATE TABLE COMPONENT ───────────────────────────────────────────────

function MandiRateTable({ cropId, askingPrice, unit }: { cropId: string; askingPrice: number; unit: string }) {
  const { data, isLoading } = useGetMandiRatesQuery(cropId);
  const rates: any[] = (data?.data ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 font-sans italic">
        No mandi rates available for this crop.
      </p>
    );
  }

  const latestModal = rates[0]?.modalPrice;
  const delta = latestModal ? askingPrice - latestModal : null;

  return (
    <div className="space-y-3">
      {/* Delta Badge Metric Analyzer */}
      {delta !== null && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
          delta > 0
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'
            : delta < 0
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {delta > 0
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              : delta < 0
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />}
          </svg>
          <span>
            Asking price is{' '}
            <strong className="font-semibold">{fmtPrice(Math.abs(delta))}</strong>{' '}
            {delta > 0 ? 'above' : delta < 0 ? 'below' : 'equal to'} latest modal rate
          </span>
        </div>
      )}

      {/* Structured Table Responsive View */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <table className="w-full text-sm font-sans text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950/50 text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Min</th>
              <th className="px-4 py-3 text-right font-medium">Max</th>
              <th className="px-4 py-3 text-right font-medium">Modal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
            {rates.map((r, i) => (
              <tr
                key={r._id}
                className={`transition-colors duration-150 ${i === 0 ? 'bg-green-50/30 dark:bg-green-900/10' : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'}`}
              >
                <td className="px-4 py-3 font-sans text-stone-800 dark:text-stone-100 font-medium">
                  {r.market}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 rounded font-bold tracking-wider uppercase">
                      Latest
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{fmtShortDate(r.date)}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtPrice(r.minPrice)}</td>
                <td className="px-4 py-3 text-right font-mono">{fmtPrice(r.maxPrice)}</td>
                <td className="px-4 py-3 text-right font-semibold font-mono text-stone-900 dark:text-stone-100">{fmtPrice(r.modalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 font-sans pl-1">
        All prices evaluated per {unit} • Data Source: Agmarknet / Market Entry records
      </p>
    </div>
  );
}

// ─── INTEREST PANEL COMPONENT ─────────────────────────────────────────────────

function InterestPanel({ listing }: { listing: any }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');
  const [showReSubmit, setShowReSubmit] = useState(false);

  const [submitInterest, { isLoading: isSubmitting }] = useSubmitInterestMutation();

  const { data: myInterestData, isLoading: interestLoading } = useGetMyInterestForListingQuery(
    listing._id,
    { skip: !isAuthenticated || !isInitialized }
  );

  const myInterest = myInterestData?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setLocalError('Please enter a valid offered price.');
      return;
    }
    try {
      await submitInterest({
        listingId: listing._id,
        body: {
          price: priceNum,
          quantity: quantity ? Number(quantity) : undefined,
          notes: notes || undefined,
        },
      }).unwrap();
      setPrice('');
      setQuantity('');
      setNotes('');
      setShowReSubmit(false);
    } catch (err: any) {
      setLocalError(err?.data?.message || 'Failed to submit interest. Please try again.');
    }
  };

  if (!isInitialized) return null;

  // ── Unauthenticated Guest Content Shield ──
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-800 dark:text-green-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p className="font-serif text-lg text-stone-800 dark:text-stone-100 font-medium">Sign in to Express Interest</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Create an account or log in as a verified buyer to submit offers directly to this producer.
          </p>
        </div>
        <Link
          href={`/login?redirect=/buyer/marketplace/${listing._id}`}
          className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium text-sm transition-colors shadow-sm w-full sm:w-auto"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  if (interestLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-6 animate-pulse space-y-4">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl w-full" />
        <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl w-full" />
      </div>
    );
  }

  // ── DEAL ACCEPTED STATE ──
  if (myInterest?.status === 'accepted') {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 text-green-700 dark:text-green-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-serif text-lg text-green-800 dark:text-green-300 font-medium">
              Offer Accepted
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 font-sans mt-0.5">
              The producer has accepted your purchase terms. You can now establish direct communication.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-white/60 dark:bg-stone-900/40 rounded-xl p-4 border border-green-100 dark:border-green-900/30 shadow-sm">
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">Your Offered Price</p>
            <p className="font-serif text-xl font-semibold text-green-800 dark:text-green-300">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">Quantity Placed</p>
              <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
        </div>

        {/* Revealed Direct Contact Credentials on Accepted State Match */}
        {listing.sellerId?.phone && (
          <div className="flex items-center gap-4 bg-white dark:bg-stone-900 rounded-xl p-4 border border-green-200 dark:border-green-800/40 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-serif font-bold text-stone-600 dark:text-stone-300 flex-shrink-0">
              {(listing.sellerId?.name ?? 'K')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-semibold text-stone-800 dark:text-stone-100 text-sm">{listing.sellerId?.name}</p>
              <a
                href={`tel:${listing.sellerId.phone}`}
                className="font-sans text-green-800 dark:text-green-400 text-sm font-semibold hover:underline flex items-center gap-1.5 mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {listing.sellerId.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DEAL AWAITING / PENDING STATE ──
  if (myInterest?.status === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-500">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-amber-800 dark:text-amber-400">Awaiting seller response</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">Submitted {fmtDate(myInterest.createdAt)}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            Pending
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">Offered Price</p>
            <p className="font-serif text-xl font-medium text-stone-800 dark:text-stone-100">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">Quantity</p>
              <p className="font-serif text-xl font-medium text-stone-800 dark:text-stone-100">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
          {myInterest.quantity && (
            <div className="col-span-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">Total Value Valuation</p>
              <p className="font-serif text-xl font-bold text-green-800 dark:text-green-500">
                {fmtPrice(myInterest.price * myInterest.quantity)}
              </p>
            </div>
          )}
        </div>

        {myInterest.notes && (
          <div className="text-sm text-stone-600 dark:text-stone-400 font-sans bg-white dark:bg-stone-900 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800/60 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">Your Proposal Notes</span>
            {myInterest.notes}
          </div>
        )}
      </div>
    );
  }

  const showBanner = myInterest?.status === 'rejected' || myInterest?.status === 'withdrawn';
  const statusCfg = myInterest ? interestStatusConfig[myInterest.status] : null;

  return (
    <div className="space-y-4">
      {/* Historical Status Validation Trace Banners */}
      {showBanner && statusCfg && !showReSubmit && (
        <div className={`rounded-2xl border p-5 space-y-4 ${statusCfg.bg} ${statusCfg.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-sans font-semibold ${statusCfg.text}`}>
                {myInterest.status === 'rejected'
                  ? 'The seller has declined your offer.'
                  : 'This interest expression was withdrawn.'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-1">
                {myInterest.status === 'rejected'
                  ? 'You are eligible to place an adjusted offer counter proposal alternative valuation strategy.'
                  : 'You can resubmit interest if the harvest parameters remain active and open.'}
              </p>
            </div>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
          </div>
          {(listing.status === 'open' || listing.status === 'interest_received') && (
            <button
              onClick={() => setShowReSubmit(true)}
              className="w-full h-12 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.99] shadow-sm"
            >
              Submit New Offer
            </button>
          )}
        </div>
      )}

      {/* Main Form Fields Input Frame View Component */}
      {(!myInterest || showReSubmit) && (listing.status === 'open' || listing.status === 'interest_received') && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 md:p-8 space-y-5 shadow-sm"
        >
          <div>
            <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">Express Purchase Interest</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-sans mt-1">
              Propose your contract buying conditions to the producer. They will review parameters.
            </p>
          </div>

          {localError && (
            <div className="text-sm font-sans font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 animate-in fade-in">
              {localError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-price-input">
                Offered Price (₹ per {listing.unit}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-sans text-sm">₹</span>
                <input
                  id="interest-price-input"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={String(listing.askingPrice)}
                  min="1"
                  required
                  className="w-full h-12 pl-9 pr-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-qty-input">
                Desired Quantity ({listing.unit}) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                id="interest-qty-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Maximum limit: ${listing.quantity}`}
                min="1"
                max={listing.quantity}
                className="w-full h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-notes-input">
                Proposal Notes & Terms <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="interest-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify details like shipping arrangements, verification windows, or multi-batch staging requirements..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 transition-all shadow-sm font-sans"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {showReSubmit && (
              <button
                type="button"
                onClick={() => setShowReSubmit(false)}
                className="h-12 flex-1 rounded-xl border-2 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              id="submit-interest-btn"
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-[2] rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 text-white font-sans font-medium text-sm transition-colors shadow-sm active:scale-[0.99]"
            >
              {isSubmitting ? 'Submitting offer...' : showReSubmit ? 'Submit Adjusted Counter Offer' : 'Express Interest'}
            </button>
          </div>
        </form>
      )}

      {/* Locked / Immutable Listing Warning States */}
      {['sale_confirmed', 'closed', 'cancelled', 'expired'].includes(listing.status?.toLowerCase()) && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/40 p-5 text-center shadow-sm">
          <p className="text-sm text-stone-500 dark:text-stone-400 font-sans font-medium">
            This listing transaction window is closed and is no longer accepting buyer negotiations.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DETAIL PAGE VIEW CONTAINER ──────────────────────────────────────────

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, isError } = useGetListingByIdQuery(id);
  const listing = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="aspect-video w-full bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-8 w-64 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-36 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm mt-8 space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans font-medium text-lg">Harvest catalog listing not found.</p>
        <Link href="/buyer/marketplace" className="inline-flex h-11 px-5 items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-xl text-sm font-sans font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const images: string[] = listing.mediaUrls ?? [];
  const crop = listing.cropId;
  const seller = listing.sellerId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">

      {/* Back Button Link Trigger Action */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans font-medium transition-colors w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 m0 0l7-7 m-7 7h18" />
        </svg>
        Back to Marketplace
      </button>

      {/* Image Carousel Panel Section */}
      {images.length > 0 ? (
        <section className="space-y-3">
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-sm">
            <img
              src={images[activeImage]}
              alt={`${crop?.name ?? 'Harvest Specimen'} — view ${activeImage + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                    i === activeImage
                      ? 'border-green-800 dark:border-green-500 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="w-full aspect-video rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-2 shadow-sm">
          <svg className="w-12 h-12 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-sans font-medium">No catalog media available</span>
        </div>
      )}

      {/* Crop Identity Header Section Card Grid */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {crop?.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
                  {crop.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium leading-tight">
              {crop?.name ?? '—'}
            </h1>
            {listing.variety && (
              <p className="text-sm font-sans text-stone-500 dark:text-stone-400 mt-1 font-medium capitalize">Variety Strain: <span className="text-stone-700 dark:text-stone-300">{listing.variety}</span></p>
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-sans bg-stone-50 dark:bg-stone-950 shadow-sm">
            {listing.status?.replace(/_/g, ' ')}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium text-stone-500 dark:text-stone-400 font-sans flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800/60">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {listing.viewCount ?? 0} active catalog views
          </span>
          <span>·</span>
          <span>Published: {fmtDate(listing.createdAt)}</span>
          {listing.expiresAt && (
            <>
              <span>·</span>
              <span className="text-red-600 dark:text-red-400">Trading Window Close: {fmtShortDate(listing.expiresAt)}</span>
            </>
          )}
        </div>
      </section>

      {/* Pricing & Metric Ledger Specification Info */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          Pricing & Metrics Grid Summary
        </h2>
        <div className="grid grid-cols-2 gap-5 divide-x divide-stone-200 dark:divide-stone-800">
          <div>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 font-sans mb-1 uppercase tracking-wider">Asking Unit Cost</p>
            <p className="font-serif text-2xl md:text-3xl font-bold text-green-800 dark:text-green-500">
              {fmtPrice(listing.askingPrice)}
              <span className="text-sm text-stone-400 dark:text-stone-500 font-sans font-normal ml-1">/ {listing.unit}</span>
            </p>
          </div>
          <div className="pl-5">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 font-sans mb-1 uppercase tracking-wider">Available Bulk Weight</p>
            <p className="font-serif text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100">
              {listing.quantity}
              <span className="text-sm text-stone-400 dark:text-stone-500 font-sans font-normal ml-1.5">{listing.unit}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Optional Free-Text Narrative Description Section */}
      {listing.description && (
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">Harvest Parameters & Field Condition Notes</h2>
          <p className="font-sans text-stone-700 dark:text-stone-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
            {listing.description}
          </p>
        </section>
      )}

      {/* Kisan Identification Core Profile Summary Card */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          Producer Verification Credentials
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/40 flex items-center justify-center font-serif font-bold text-lg flex-shrink-0">
            {(seller?.name ?? 'K')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{seller?.name ?? '—'}</p>
              {seller?.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                  Verified Producer
                </span>
              )}
            </div>
            {seller?.averageRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-500 text-sm">{'★'.repeat(Math.round(seller.averageRating))}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-medium">({seller.averageRating.toFixed(1)} rating)</span>
              </div>
            )}
            {seller?.location && (
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5 font-medium">{seller.location}</p>
            )}
          </div>
        </div>
      </section>

      {/* Farm Location Spatial Coordinates Section */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Pickup Location Specifications
        </h2>
        <p className="font-sans text-stone-800 dark:text-stone-100 font-medium text-sm md:text-base">{listing.farmAddress}</p>
        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm font-medium">{listing.farmDistrict}, {listing.farmState}</p>
      </section>

      {/* Agmarknet Government Analytics Tracker Frame */}
      {crop?._id && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">
              Market Index Rate Comparison
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-sans font-medium">Historical Window: 7 Days</span>
          </div>
          <MandiRateTable
            cropId={crop._id}
            askingPrice={listing.askingPrice}
            unit={listing.unit}
          />
        </section>
      )}

      {/* Real-time Interaction Intent Entry Gate */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium border-b border-stone-200 dark:border-stone-800 pb-2">
          Your Intent Status
        </h2>
        <InterestPanel listing={listing} />
      </section>

    </div>
  );
}