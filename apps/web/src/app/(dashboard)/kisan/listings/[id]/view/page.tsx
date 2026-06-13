'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  useGetListingByIdQuery,
  useGetListingInterestsQuery,
  useAcceptInterestMutation,
  useRejectInterestMutation,
} from '@/store/endpoints/listingsApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ChevronRight, Check, X, Loader2 } from 'lucide-react';

/*
  API: GET /listings/:id
  Hook: useGetListingByIdQuery(id)
  Response shape:
    data.data = {
      _id: string
      status: 'draft' | 'open' | 'interest_received' | 'sale_confirmed' | 'cancelled' | 'expired' | 'closed'
      viewCount: number
      createdAt: ISO string
      updatedAt: ISO string
      expiresAt?: ISO string

      cropId: { _id: string; name: string; category: string }   // populated
      sellerId: { _id: string; name: string; phone: string }     // populated

      quantity: number
      unit: 'kg' | 'quintal' | 'ton'
      description?: string

      farmAddress: string
      farmDistrict: string
      farmState: string
      lat?: number
      lng?: number

      mediaUrls: string[]           // Cloudinary URLs, max 6
    }
*/

export default function ListingViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const t = useTranslations('kisanListingView');
  const tDetail = useTranslations('listingDetail');
  const tCommon = useTranslations('common');
  const tDash = useTranslations('kisanDashboard');

  const { data, isLoading, isError } = useGetListingByIdQuery(id);
  const { data: interestsData, isLoading: interestsLoading } = useGetListingInterestsQuery(id);
  const [acceptInterest, { isLoading: isAccepting }] = useAcceptInterestMutation();
  const [rejectInterest, { isLoading: isRejecting }] = useRejectInterestMutation();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'accept' | 'reject' | null;
    interestId: string | null;
    buyerName: string;
  }>({ isOpen: false, type: null, interestId: null, buyerName: '' });

  const closeActionModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => setModalState({ isOpen: false, type: null, interestId: null, buyerName: '' }), 300);
  };

  const handleConfirmAction = async () => {
    if (!modalState.interestId || !modalState.type || !listing?._id) return;

    if (modalState.type === 'accept') {
      try {
        const response = await acceptInterest({ listingId: listing._id, interestId: modalState.interestId }).unwrap();
        closeActionModal();
        toast.success("Offer accepted successfully! Order created.");
        router.push(`/kisan/orders/${response.orderId}`);
      } catch (err: any) {
        toast.error(err?.data?.message || t('failedToAccept'));
      }
    } else if (modalState.type === 'reject') {
      try {
        await rejectInterest({ listingId: listing._id, interestId: modalState.interestId }).unwrap();
        closeActionModal();
        toast.success("Offer rejected successfully.");
      } catch (err: any) {
        toast.error(err?.data?.message || t('failedToReject'));
      }
    }
  };

  const listing = data?.data;
  const interests = interestsData?.data ?? [];

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse p-4">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-32" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────
  if (isError || !listing) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">{tDetail('listingNotFound')}</p>
        <Link href="/kisan/listings" className="text-sm underline text-stone-500">{t('backToListings')}</Link>
      </div>
    );
  }

  const images: string[] = listing.mediaUrls ?? [];
  const hasImages = images.length > 0;

  // ─── View ───────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* Back + Edit link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 font-sans transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToListings')}
        </button>
        <Link
          href={`/kisan/listings/${listing._id}`}
          className="text-sm font-medium text-green-700 dark:text-green-500 hover:underline font-sans"
        >
          {t('editListing')}
        </Link>
      </div>

      {/* ── IMAGE GALLERY ─────────────────────────────────────────── */}
      {/* data.data.mediaUrls[0..5] — Cloudinary image URLs */}
      {hasImages ? (
        <section>
          {/* Main image — data.data.mediaUrls[activeImage] */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <Image
              src={images[activeImage]}
              alt={`Crop image ${activeImage + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          {/* Thumbnails — data.data.mediaUrls.map(...) */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImage
                      ? 'border-green-600 dark:border-green-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="w-full aspect-video rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-600">
          <span className="font-sans text-sm">{t('noImages')}</span>
        </div>
      )}

      {/* ── HEADER: Crop name + status + views ────────────────────── */}
      {/*
        data.data.cropId.name      — crop display name
        data.data.cropId.category  — crop category
        data.data.status           — listing status
        data.data.viewCount        — number of profile views
        data.data.createdAt        — ISO date string
      */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-100 font-medium">
              {listing.cropId?.name ?? listing.cropId}
            </h1>
            <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">
              {listing.cropId?.category}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-stone-500 dark:text-stone-400 font-sans">
          <span>{t('views', { count: listing.viewCount ?? 0 })}</span>
          <span>·</span>
          <span>{t('listed', { date: new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) })}</span>
          {listing.expiresAt && (
            <>
              <span>·</span>
              <span>{t('expires', { date: new Date(listing.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) })}</span>
            </>
          )}
        </div>
      </section>

      {/* ── QUANTITY ──────────────────────────────────────────────── */}
      {/*
        data.data.quantity     — number
        data.data.unit         — 'kg' | 'quintal' | 'ton'
      */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {tDash('quantity')}
        </h2>
        <div>
          <p className="font-serif text-2xl text-stone-800 dark:text-stone-100">
            {listing.quantity}
            <span className="text-base text-stone-500 dark:text-stone-400 font-sans font-normal ml-1">{listing.unit}</span>
          </p>
        </div>
      </section>


      {/* ── DESCRIPTION ──────────────────────────────────────────── */}
      {/* data.data.description — optional free-text string */}
      {listing.description && (
        <section className="space-y-2">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {t('description')}
          </h2>
          <p className="font-sans text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </section>
      )}

      {/* ── LOCATION ─────────────────────────────────────────────── */}
      {/*
        data.data.farmAddress   — village / address line
        data.data.farmDistrict  — district
        data.data.farmState     — state
        data.data.lat           — optional latitude
        data.data.lng           — optional longitude
      */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {t('pickupLocation')}
        </h2>
        <p className="font-sans text-stone-800 dark:text-stone-100">
          {listing.farmAddress}
        </p>
        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm">
          {listing.farmDistrict}, {listing.farmState}
        </p>
        {listing.lat && listing.lng && (
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500">
            {t('gps', { lat: Number(listing.lat).toFixed(5), lng: Number(listing.lng).toFixed(5) })}
          </p>
        )}
      </section>

      {/* ── SELLER INFO ──────────────────────────────────────────── */}
      {/*
        data.data.sellerId.name   — seller display name
        data.data.sellerId.phone  — seller phone number
        data.data.sellerId._id    — seller user ID
      */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {t('seller')}
        </h2>
        <div className="flex items-center gap-3">
          {/* Avatar placeholder — no avatar field in current schema */}
          <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 font-sans font-semibold text-sm">
            {(listing.sellerId?.name ?? 'K')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-sans font-medium text-stone-800 dark:text-stone-100">
              {listing.sellerId?.name ?? '—'}
            </p>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
              {listing.sellerId?.phone ?? '—'}
            </p>
          </div>
        </div>
      </section>

      {/* ── BUYER OFFERS / INTERESTS ────────────────────────────── */}
      <section className="space-y-6 pt-4 border-t border-stone-200 dark:border-stone-800">
        <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 font-medium">
          {t('receivedOffers', { count: interests.length })}
        </h2>

        {interestsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-stone-100 dark:bg-stone-850 rounded-xl" />
            <div className="h-20 bg-stone-100 dark:bg-stone-850 rounded-xl" />
          </div>
        ) : interests.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-500 dark:text-stone-400 font-sans text-sm">
            {t('noOffers')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {interests.map((interest: any) => {
              // quantity is optional on an interest — fall back to the full
              // listing quantity (same rule the server uses on acceptance)
              const qty = interest.quantity ?? listing.quantity;
              const totalVal = interest.price * qty;
              const isPending = interest.status === 'pending';
              const isAccepted = interest.status === 'accepted';
              const isRejected = interest.status === 'rejected';
              const isWithdrawn = interest.status === 'withdrawn';

              const clickable = isAccepted && interest.orderId;

              return (
                <div
                  key={interest._id}
                  onClick={clickable ? () => router.push(`/kisan/orders/${interest.orderId}`) : undefined}
                  className={`p-5 rounded-2xl border transition-all ${
                    clickable ? 'cursor-pointer hover:shadow-md hover:border-green-300 dark:hover:border-green-700 active:scale-[0.99]' : ''
                  } ${
                    isAccepted
                      ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800/50 shadow-sm'
                      : isRejected || isWithdrawn
                      ? 'bg-stone-50/50 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800/60 opacity-60'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Buyer info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-sans font-semibold text-stone-600 dark:text-stone-300">
                        {interest.buyerId?.name ? interest.buyerId.name[0].toUpperCase() : 'B'}
                      </div>
                      <div>
                        <h4 className="font-sans font-semibold text-stone-800 dark:text-stone-200">
                          {interest.buyerId?.name ?? 'Anonymous Buyer'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                          <span>{t('phoneHidden')}</span>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={interest.status} />
                  </div>

                  {/* Bid price details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-50 dark:bg-stone-950/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800 my-4">
                    <div>
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">{t('offeredPrice')}</span>
                      <span className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        ₹{interest.price.toLocaleString('en-IN')}
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-normal ml-0.5">/ {listing.unit}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">{t('requestedQty')}</span>
                      <span className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        {qty}
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-normal ml-0.5"> {listing.unit}</span>
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">{t('totalDealValue')}</span>
                      <span className="font-serif text-lg font-bold text-green-800 dark:text-green-500">
                        ₹{totalVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {interest.notes && (
                    <div className="text-sm font-sans text-stone-600 dark:text-stone-400 leading-relaxed bg-stone-50/50 dark:bg-stone-900/30 p-3 rounded-lg border border-stone-100 dark:border-stone-800/50 mb-4">
                      <p className="font-medium text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">{t('buyerNotes')}</p>
                      {interest.notes}
                    </div>
                  )}

                  {/* Accept / Reject actions */}
                  {isPending && listing.status !== 'sale_confirmed' && (
                    <div className="flex gap-3 mt-4">
                      <Button
                        type="button"
                        onClick={() => setModalState({ isOpen: true, type: 'accept', interestId: interest._id, buyerName: interest.buyerId?.name || 'this buyer' })}
                        className="flex-1 h-11 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                      >
                        {t('acceptOffer')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setModalState({ isOpen: true, type: 'reject', interestId: interest._id, buyerName: interest.buyerId?.name || 'this buyer' })}
                        className="h-11 px-6 rounded-xl"
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="mt-3 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 text-sm font-sans px-4 py-3 rounded-xl border border-green-200/50 dark:border-green-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>
                          {t('dealConfirmed')}
                          {interest.orderId && <strong className="ml-1">{t('orderId', { id: interest.orderId })}</strong>}
                        </span>
                      </div>
                      {interest.orderId && (
                        <Link
                          href={`/kisan/orders/${interest.orderId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800 text-green-800 dark:text-green-300 rounded-lg font-medium transition-colors text-xs whitespace-nowrap self-start sm:self-auto"
                        >
                          {t('viewOrder')}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Dialog */}
      <Dialog open={modalState.isOpen} onOpenChange={(open) => { if (!open) closeActionModal(); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {modalState.type === 'accept' ? t('acceptOfferTitle') : t('rejectOfferTitle')}
            </DialogTitle>
            <DialogDescription>
              {modalState.type === 'accept'
                ? t('acceptConfirmDesc', { buyerName: modalState.buyerName })
                : t('rejectConfirmDesc', { buyerName: modalState.buyerName })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl">
            <div className={`p-2 rounded-full ${modalState.type === 'accept' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
              {modalState.type === 'accept' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {modalState.type === 'accept' ? t('acceptWarning') : t('rejectWarning')}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionModal} disabled={isAccepting || isRejecting}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isAccepting || isRejecting}
              className={modalState.type === 'accept'
                ? 'bg-green-700 hover:bg-green-800 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {(isAccepting || isRejecting) && (
                <Loader2 className="animate-spin h-4 w-4 mr-1" />
              )}
              {modalState.type === 'accept' ? t('yesAccept') : t('yesReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
