'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetListingByIdQuery, useSubmitInterestMutation, useWithdrawInterestMutation, useGetMyInterestForListingQuery } from '@/store/endpoints/listingsApi';
import { useGetMandiRatesQuery } from '@/store/endpoints/mandiApi';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { INTEREST_STATUS_COLORS } from '@/components/shared/statusHelper';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtPrice = (n: number) => '₹' + n.toLocaleString('en-IN');

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtShortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Removed local interestStatusConfig - using INTEREST_STATUS_COLORS from statusHelper

// ─── MANDI RATE TABLE COMPONENT ───────────────────────────────────────────────

function MandiRateTable({ cropId, unit, t }: { cropId: string; unit: string; t: any }) {
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
        {t('noMandiRates')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Structured Table Responsive View */}
      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <table className="w-full text-sm font-sans text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-950/50 text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <th className="px-4 py-3 font-medium">{t('market')}</th>
              <th className="px-4 py-3 font-medium">{t('date')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('min')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('max')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('modal')}</th>
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
                      {t('latest')}
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
        {t('mandiDisclaimer', { unit })}
      </p>
    </div>
  );
}

// ─── INTEREST PANEL COMPONENT ─────────────────────────────────────────────────

function InterestPanel({ listing, t }: { listing: any, t: any }) {
  const tCommon = useTranslations('common');
  const { isAuthenticated, isInitialized } = useAuth();
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');
  const [showReSubmit, setShowReSubmit] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [submitInterest, { isLoading: isSubmitting }] = useSubmitInterestMutation();
  const [withdrawInterest, { isLoading: isWithdrawing }] = useWithdrawInterestMutation();

  const handleWithdraw = async () => {
    try {
      await withdrawInterest({ listingId: listing._id, interestId: myInterest._id }).unwrap();
      toast.success("Offer withdrawn successfully!");
      setWithdrawOpen(false);
    } catch {
      setWithdrawOpen(false);
    }
  };

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
      setLocalError(t('invalidPrice'));
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
      toast.success("Offer submitted successfully!");
      setPrice('');
      setQuantity('');
      setNotes('');
      setShowReSubmit(false);
    } catch (err: any) {
      setLocalError(err?.data?.message || t('submitError'));
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
          <p className="font-serif text-lg text-stone-800 dark:text-stone-100 font-medium">{t('signInTitle')}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-sans">
            {t('signInDesc')}
          </p>
        </div>
        <Link
          href={`/login?redirect=/buyer/marketplace/${listing._id}`}
          className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium text-sm transition-colors shadow-sm w-full sm:w-auto"
        >
          {t('signInBtn')}
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
              {t('offerAcceptedTitle')}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 font-sans mt-0.5">
              {t('offerAcceptedDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-white/60 dark:bg-stone-900/40 rounded-xl p-4 border border-green-100 dark:border-green-900/30 shadow-sm">
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">{t('yourOfferedPrice')}</p>
            <p className="font-serif text-xl font-semibold text-green-800 dark:text-green-300">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">{t('quantityPlaced')}</p>
              <p className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
        </div>

        {myInterest.orderId && (
          <Link
            href={`/buyer/orders/${myInterest.orderId}`}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium text-sm transition-colors shadow-sm"
          >
            {t('viewOrderBtn')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}

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
              <p className="font-sans font-semibold text-amber-800 dark:text-amber-400">{t('awaitingSeller')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">{t('submittedOn', { date: fmtDate(myInterest.createdAt) })}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            {t('statusPending')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div>
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">{t('offeredPrice')}</p>
            <p className="font-serif text-xl font-medium text-stone-800 dark:text-stone-100">{fmtPrice(myInterest.price)} / {listing.unit}</p>
          </div>
          {myInterest.quantity && (
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">{t('quantity')}</p>
              <p className="font-serif text-xl font-medium text-stone-800 dark:text-stone-100">{myInterest.quantity} {listing.unit}</p>
            </div>
          )}
          {myInterest.quantity && (
            <div className="col-span-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-sans mb-0.5">{t('totalValuation')}</p>
              <p className="font-serif text-xl font-bold text-green-800 dark:text-green-500">
                {fmtPrice(myInterest.price * myInterest.quantity)}
              </p>
            </div>
          )}
        </div>

        {myInterest.notes && (
          <div className="text-sm text-stone-600 dark:text-stone-400 font-sans bg-white dark:bg-stone-900 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800/60 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">{t('proposalNotes')}</span>
            {myInterest.notes}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/20"
          onClick={() => setWithdrawOpen(true)}
        >
          {t('withdrawBtn')}
        </Button>

        <ConfirmDialog
          isOpen={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          title={t('withdrawConfirmTitle')}
          description={t('withdrawConfirmDesc')}
          onConfirm={handleWithdraw}
          confirmText={t('withdrawConfirmYes')}
          cancelText={tCommon('cancel')}
          isLoading={isWithdrawing}
          variant="destructive"
        />
      </div>
    );
  }

  const showBanner = myInterest?.status === 'rejected' || myInterest?.status === 'withdrawn';
  const statusCfg = myInterest ? INTEREST_STATUS_COLORS[myInterest.status] : null;

  return (
    <div className="space-y-4">
      {/* Historical Status Validation Trace Banners */}
      {showBanner && statusCfg && !showReSubmit && (
        <div className={`rounded-2xl border p-5 space-y-4 ${statusCfg.bg} ${statusCfg.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-sans font-semibold ${statusCfg.text}`}>
                {myInterest.status === 'rejected'
                  ? t('declinedMsg')
                  : t('withdrawnMsg')}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-1">
                {myInterest.status === 'rejected'
                  ? t('declinedSubMsg')
                  : t('withdrawnSubMsg')}
              </p>
            </div>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              {t(statusCfg.labelKey)}
            </span>
          </div>
          {(listing.status === 'open' || listing.status === 'interest_received') && (
            <Button
              variant="outline"
              onClick={() => setShowReSubmit(true)}
              className="w-full h-12 rounded-xl"
            >
              {t('submitNewOffer')}
            </Button>
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
            <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium">{t('expressInterestTitle')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-sans mt-1">
              {t('expressInterestDesc')}
            </p>
          </div>

          {localError && (
            <Alert variant="destructive">
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-price-input">
                {t('offerPriceLabel', { unit: listing.unit })} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-sans text-sm z-10">₹</span>
                <Input
                  id="interest-price-input"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter your offer price"
                  min="1"
                  required
                  className="h-12 pl-7 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-qty-input">
                {t('qtyLabel', { unit: listing.unit })} <span className="text-stone-400 font-normal">{t('optional')}</span>
              </label>
              <Input
                id="interest-qty-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('maxLimit', { limit: listing.quantity })}
                min="1"
                max={listing.quantity}
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 font-sans" htmlFor="interest-notes-input">
                {t('notesLabel')} <span className="text-stone-400 font-normal">{t('optional')}</span>
              </label>
              <Textarea
                id="interest-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {showReSubmit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReSubmit(false)}
                className="h-12 flex-1 rounded-xl"
              >
                {t('cancelBtn')}
              </Button>
            )}
            <Button
              id="submit-interest-btn"
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-[2] rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
            >
              {isSubmitting ? t('submittingBtn') : showReSubmit ? t('submitAdjustedBtn') : t('expressInterestBtn')}
            </Button>
          </div>
        </form>
      )}

      {/* Locked / Immutable Listing Warning States */}
      {['sale_confirmed', 'closed', 'cancelled', 'expired'].includes(listing.status?.toLowerCase()) && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/40 p-5 text-center shadow-sm">
          <p className="text-sm text-stone-500 dark:text-stone-400 font-sans font-medium">
            {t('listingClosed')}
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
  const t = useTranslations('buyerMarketplaceView');

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
        <p className="text-red-600 dark:text-red-400 font-sans font-medium text-lg">{t('listingNotFound')}</p>
        <Link href="/buyer/marketplace" className="inline-flex h-11 px-5 items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-xl text-sm font-sans font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors">
          {t('returnToMarketplace')}
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
        {t('backToMarketplace')}
      </button>

      {/* Image Carousel Panel Section */}
      {images.length > 0 ? (
        <section className="space-y-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-sm">
            <Image
              src={images[activeImage]}
              alt={`${crop?.name ?? 'Harvest Specimen'} — view ${activeImage + 1}`}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                    i === activeImage
                      ? 'border-green-800 dark:border-green-500 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
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
          <span className="text-xs font-sans font-medium">{t('noMedia')}</span>
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
              <p className="text-sm font-sans text-stone-500 dark:text-stone-400 mt-1 font-medium capitalize">{t('varietyStrain')}: <span className="text-stone-700 dark:text-stone-300">{listing.variety}</span></p>
            )}
          </div>
          <StatusBadge status={listing.status} />
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium text-stone-500 dark:text-stone-400 font-sans flex-wrap pt-2 border-t border-stone-100 dark:border-stone-800/60">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {listing.viewCount ?? 0} {t('activeViews')}
          </span>
          <span>·</span>
          <span>{t('publishedOn', { date: fmtDate(listing.createdAt) })}</span>
          {listing.expiresAt && (
            <>
              <span>·</span>
              <span className="text-red-600 dark:text-red-400">{t('tradingWindowClose', { date: fmtShortDate(listing.expiresAt) })}</span>
            </>
          )}
        </div>
      </section>

      {/* Quantity Section */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          {t('availableQty')}
        </h2>
        <p className="font-serif text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100">
          {listing.quantity}
          <span className="text-sm text-stone-400 dark:text-stone-500 font-sans font-normal ml-1.5">{listing.unit}</span>
        </p>
      </section>

      {/* Optional Free-Text Narrative Description Section */}
      {listing.description && (
        <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">{t('harvestNotes')}</h2>
          <p className="font-sans text-stone-700 dark:text-stone-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
            {listing.description}
          </p>
        </section>
      )}

      {/* Kisan Identification Core Profile Summary Card */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans mb-4">
          {t('producerCredentials')}
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
                  {t('verifiedProducer')}
                </span>
              )}
            </div>
            {seller?.averageRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-500 text-sm">{'★'.repeat(Math.round(seller.averageRating))}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-medium">{t('rating', { rating: seller.averageRating.toFixed(1) })}</span>
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
          {t('pickupSpecs')}
        </h2>
        <p className="font-sans text-stone-800 dark:text-stone-100 font-medium text-sm md:text-base">{listing.farmAddress}</p>
        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm font-medium">{listing.farmDistrict}, {listing.farmState}</p>
      </section>

      {crop?._id && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-sans">
              {t('marketIndexComparison')}
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-sans font-medium">{t('historicalWindow')}</span>
          </div>
          <MandiRateTable
            cropId={crop._id}
            unit={listing.unit}
            t={t}
          />
        </section>
      )}

      {/* Real-time Interaction Intent Entry Gate */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100 font-medium border-b border-stone-200 dark:border-stone-800 pb-2">
          {t('yourIntentStatus')}
        </h2>
        <InterestPanel listing={listing} t={t} />
      </section>

    </div>
  );
}