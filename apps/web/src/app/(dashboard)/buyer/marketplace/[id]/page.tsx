'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetListingByIdQuery, useSubmitInterestMutation, useGetMyInterestForListingQuery } from '@/store/endpoints/listingsApi';
import { useGetMandiRatesQuery } from '@/store/endpoints/mandiApi';
import { useAuth } from '@/hooks/useAuth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Mandi Rate Table ─────────────────────────────────────────────────────────

function MandiRateTable({ cropId, askingPrice, unit }: { cropId: string; askingPrice: number; unit: string }) {
  const { data, isLoading } = useGetMandiRatesQuery(cropId);
  const rates: any[] = (data?.data ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded-xl" />
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
      {/* Delta badge */}
      {delta !== null && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          delta > 0
            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40'
            : delta < 0
            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
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
            <strong>{fmtPrice(Math.abs(delta))}</strong>{' '}
            {delta > 0 ? 'above' : delta < 0 ? 'below' : 'equal to'} latest modal rate
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950/50 text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-medium">Market</th>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Min</th>
              <th className="px-4 py-2.5 text-right font-medium">Max</th>
              <th className="px-4 py-2.5 text-right font-medium">Modal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {rates.map((r, i) => (
              <tr
                key={r._id}
                className={`${i === 0 ? 'bg-amber-50/50 dark:bg-amber-950/10' : 'bg-white dark:bg-stone-900'}`}
              >
                <td className="px-4 py-2.5 text-stone-800 dark:text-stone-200 font-medium">
                  {r.market}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500 rounded font-semibold">
                      LATEST
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-stone-500 dark:text-stone-400">{fmtShortDate(r.date)}</td>
                <td className="px-4 py-2.5 text-right text-stone-600 dark:text-stone-300">{fmtPrice(r.minPrice)}</td>
                <td className="px-4 py-2.5 text-right text-stone-600 dark:text-stone-300">{fmtPrice(r.maxPrice)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-stone-800 dark:text-stone-100">{fmtPrice(r.modalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 font-sans">
        All prices per {unit} · Source: Agmarknet / manual entry
      </p>
    </div>
  );
}

// ─── Interest Panel ───────────────────────────────────────────────────────────

function InterestPanel({ listing }: { listing: any }) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');
  const [showReSubmit, setShowReSubmit] = useState(false);

  const [submitInterest, { isLoading: isSubmitting }] = useSubmitInterestMutation();

  // Only fetch buyer's interest if they're authenticated
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

  // ── Waiting for auth init ──────────────────────────────────────────────────
  if (!isInitialized) return null;

  // ── Guest (not logged in) ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <p className="font-serif text-lg text-stone-800 dark:text-stone-100">Sign in to Express Interest</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Create an account or log in as a buyer to contact this kisan.
          </p>
        </div>
        <Link
          href={`/login?redirect=/buyer/marketplace/${listing._id}`}
          className="inline-flex items-center justify-center h-11 px-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-sans font-medium text-sm transition-colors shadow-sm"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  // ── Loading buyer's own interest ──────────────────────────────────────────
  if (interestLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-6 animate-pulse space-y-3">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl" />
      </div>
    );
  }

  // ── ACCEPTED ──────────────────────────────────────────────────────────────
  if (myInterest?.status === 'accepted') {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-serif text-lg text-green-800 dark:text-green-300 font-medium">
              Offer Accepted! 🎉
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 font-sans">
              The kisan has accepted your offer. Contact them to finalise the deal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/60 dark:bg-green-950/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
          <div>
            <p className="text-xs text-green-700/60 dark:text-green-500/60 uppercase tracking-wider font-sans mb-0.5">Your Offered Price</p>
            <p className="font-serif text-xl text-green-800 dark:text-green-300">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-green-700/60 dark:text-green-500/60 uppercase tracking-wider font-sans mb-0.5">Quantity</p>
              <p className="font-serif text-xl text-green-800 dark:text-green-300">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
        </div>

        {/* Seller contact — revealed only on acceptance */}
        {listing.sellerId?.phone && (
          <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl p-4 border border-green-200 dark:border-green-800/40 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-semibold text-stone-600 dark:text-stone-300 flex-shrink-0">
              {(listing.sellerId?.name ?? 'K')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-sans font-medium text-stone-800 dark:text-stone-100 text-sm">{listing.sellerId?.name}</p>
              <a
                href={`tel:${listing.sellerId.phone}`}
                className="font-sans text-amber-700 dark:text-amber-500 text-sm font-semibold hover:underline"
              >
                📞 {listing.sellerId.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  if (myInterest?.status === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-amber-800 dark:text-amber-400">Awaiting seller response</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-500/70 font-sans">Submitted {fmtDate(myInterest.createdAt)}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            Pending
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/60 dark:bg-stone-900/60 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Offered Price</p>
            <p className="font-serif text-xl text-stone-800 dark:text-stone-100">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Quantity</p>
              <p className="font-serif text-xl text-stone-800 dark:text-stone-100">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
          {myInterest.quantity && (
            <div className="col-span-2">
              <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Total Value</p>
              <p className="font-serif text-xl font-bold text-amber-700 dark:text-amber-500">
                {fmtPrice(myInterest.price * myInterest.quantity)}
              </p>
            </div>
          )}
        </div>

        {myInterest.notes && (
          <div className="text-sm text-stone-600 dark:text-stone-400 font-sans bg-white/50 dark:bg-stone-900/50 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-800/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">Your Notes</span>
            {myInterest.notes}
          </div>
        )}
      </div>
    );
  }

  // ── REJECTED or WITHDRAWN — offer form again ───────────────────────────────
  const showBanner = myInterest?.status === 'rejected' || myInterest?.status === 'withdrawn';
  const statusCfg = myInterest ? interestStatusConfig[myInterest.status] : null;

  return (
    <div className="space-y-4">
      {/* Previous status banner */}
      {showBanner && statusCfg && !showReSubmit && (
        <div className={`rounded-2xl border ${statusCfg.bg} ${statusCfg.border} p-5 space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-sans font-semibold ${statusCfg.text}`}>
                {myInterest.status === 'rejected'
                  ? 'The seller has declined your offer.'
                  : 'This interest was withdrawn.'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                {myInterest.status === 'rejected'
                  ? 'You can submit a new offer at a different price.'
                  : 'You can submit a new interest if the listing is still open.'}
              </p>
            </div>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
          </div>
          {listing.status === 'open' || listing.status === 'interest_received' ? (
            <button
              onClick={() => setShowReSubmit(true)}
              className="w-full h-10 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Submit New Offer
            </button>
          ) : null}
        </div>
      )}

      {/* Interest submission form */}
      {(!myInterest || showReSubmit) && (listing.status === 'open' || listing.status === 'interest_received') && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4"
        >
          <div>
            <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">Express Interest</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Propose your buying price to the kisan. They will accept or decline.
            </p>
          </div>

          {localError && (
            <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
              {localError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-sans">
                Offered Price (₹ per {listing.unit}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-sans text-sm">₹</span>
                <input
                  id="interest-price-input"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={String(listing.askingPrice)}
                  min="1"
                  required
                  className="w-full h-11 pl-8 pr-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-sans">
                Quantity ({listing.unit}) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                id="interest-qty-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Max ${listing.quantity}`}
                min="1"
                max={listing.quantity}
                className="w-full h-11 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 font-sans">
                Notes <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="interest-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Preferred pickup date, payment terms..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {showReSubmit && (
              <button
                type="button"
                onClick={() => setShowReSubmit(false)}
                className="flex-1 h-11 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              id="submit-interest-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-sans font-medium text-sm transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : showReSubmit ? 'Submit New Offer' : 'Express Interest'}
            </button>
          </div>
        </form>
      )}

      {/* Listing is closed */}
      {listing.status === 'sale_confirmed' || listing.status === 'closed' || listing.status === 'cancelled' || listing.status === 'expired' ? (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-5 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400 font-sans">
            This listing is no longer accepting interests.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, isError } = useGetListingByIdQuery(id);
  const listing = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-5 animate-pulse">
        <div className="h-6 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="aspect-video w-full bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-8 w-56 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">Listing not found.</p>
        <Link href="/buyer/marketplace" className="text-sm underline text-stone-500">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const images: string[] = listing.mediaUrls ?? [];
  const crop = listing.cropId;
  const seller = listing.sellerId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 space-y-7 pb-20">

      {/* ── Back ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 font-sans transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      {/* ── Photo Carousel ───────────────────────────────────────────── */}
      {images.length > 0 ? (
        <section>
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <img
              src={images[activeImage]}
              alt={`${crop?.name ?? 'Crop'} — image ${activeImage + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activeImage
                      ? 'border-amber-500 dark:border-amber-500 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="w-full aspect-video rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-600">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* ── Crop Header ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {crop?.category && (
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                  {crop.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium leading-tight">
              {crop?.name ?? '—'}
            </h1>
          </div>
          <span className="text-sm px-3 py-1 rounded-full border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-sans capitalize bg-white dark:bg-stone-900">
            {listing.status?.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-stone-500 dark:text-stone-400 font-sans flex-wrap">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {listing.viewCount ?? 0} views
          </span>
          <span>·</span>
          <span>Listed {fmtDate(listing.createdAt)}</span>
          {listing.expiresAt && (
            <>
              <span>·</span>
              <span>Expires {fmtShortDate(listing.expiresAt)}</span>
            </>
          )}
        </div>
      </section>

      {/* ── Pricing & Quantity ────────────────────────────────────────── */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          Pricing & Quantity
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mb-1">Asking Price</p>
            <p className="font-serif text-3xl text-stone-800 dark:text-stone-100">
              {fmtPrice(listing.askingPrice)}
              <span className="text-base text-stone-400 dark:text-stone-500 font-sans font-normal ml-1">/ {listing.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mb-1">Available</p>
            <p className="font-serif text-3xl text-stone-800 dark:text-stone-100">
              {listing.quantity}
              <span className="text-base text-stone-400 dark:text-stone-500 font-sans font-normal ml-1">{listing.unit}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Description ──────────────────────────────────────────────── */}
      {listing.description && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">Description</h2>
          <p className="font-sans text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </section>
      )}

      {/* ── Kisan Profile Card ───────────────────────────────────────── */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          Kisan
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-500 font-sans font-bold text-lg flex-shrink-0">
            {(seller?.name ?? 'K')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{seller?.name ?? '—'}</p>
              {seller?.isVerified && (
                <span className="flex items-center gap-0.5 text-xs text-green-700 dark:text-green-500 font-semibold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {seller?.averageRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-500 text-xs">{'★'.repeat(Math.round(seller.averageRating))}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-sans">{seller.averageRating.toFixed(1)}</span>
              </div>
            )}
            {seller?.location && (
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">{seller.location}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Location ────────────────────────────────────────────────── */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">
          Pickup Location
        </h2>
        <p className="font-sans text-stone-800 dark:text-stone-100">{listing.farmAddress}</p>
        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm">{listing.farmDistrict}, {listing.farmState}</p>
      </section>

      {/* ── Mandi Rate Table ─────────────────────────────────────────── */}
      {crop?._id && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">
              Mandi Rates
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-sans">Last 7 days</span>
          </div>
          <MandiRateTable
            cropId={crop._id}
            askingPrice={listing.askingPrice}
            unit={listing.unit}
          />
        </section>
      )}

      {/* ── Express Interest Panel ───────────────────────────────────── */}
      <section className="pt-2">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium mb-4">
          Your Interest
        </h2>
        <InterestPanel listing={listing} />
      </section>

    </div>
  );
}
