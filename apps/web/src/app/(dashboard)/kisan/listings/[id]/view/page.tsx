'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  useGetListingByIdQuery,
  useGetListingInterestsQuery,
  useAcceptInterestMutation,
  useRejectInterestMutation,
} from '@/store/endpoints/listingsApi';

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
      askingPrice: number           // per unit, in INR
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

  const { data, isLoading, isError } = useGetListingByIdQuery(id);
  const { data: interestsData, isLoading: interestsLoading } = useGetListingInterestsQuery(id);
  const [acceptInterest, { isLoading: isAccepting }] = useAcceptInterestMutation();
  const [rejectInterest, { isLoading: isRejecting }] = useRejectInterestMutation();

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
        <p className="text-red-600 dark:text-red-400 font-sans">Listing not found.</p>
        <Link href="/kisan/listings" className="text-sm underline text-stone-500">Back to listings</Link>
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
          ← Back
        </button>
        <Link
          href={`/kisan/listings/${listing._id}`}
          className="text-sm font-medium text-green-700 dark:text-green-500 hover:underline font-sans"
        >
          Edit Listing
        </Link>
      </div>

      {/* ── IMAGE GALLERY ─────────────────────────────────────────── */}
      {/* data.data.mediaUrls[0..5] — Cloudinary image URLs */}
      {hasImages ? (
        <section>
          {/* Main image — data.data.mediaUrls[activeImage] */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <img
              src={images[activeImage]}
              alt={`Crop image ${activeImage + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails — data.data.mediaUrls.map(...) */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImage
                      ? 'border-green-600 dark:border-green-500'
                      : 'border-transparent opacity-60 hover:opacity-100'
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
          <span className="font-sans text-sm">No images uploaded</span>
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
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium font-sans border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 capitalize">
            {listing.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-stone-500 dark:text-stone-400 font-sans">
          <span>{listing.viewCount ?? 0} views</span>
          <span>·</span>
          <span>Listed {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {listing.expiresAt && (
            <>
              <span>·</span>
              <span>Expires {new Date(listing.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </>
          )}
        </div>
      </section>

      {/* ── PRICING & QUANTITY ────────────────────────────────────── */}
      {/*
        data.data.askingPrice  — number (INR per unit)
        data.data.quantity     — number
        data.data.unit         — 'kg' | 'quintal' | 'ton'
      */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Pricing & Quantity
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mb-1">Asking Price</p>
            <p className="font-serif text-2xl text-stone-800 dark:text-stone-100">
              ₹{listing.askingPrice.toLocaleString('en-IN')}
              <span className="text-base text-stone-500 dark:text-stone-400 font-sans font-normal ml-1">/ {listing.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mb-1">Available Quantity</p>
            <p className="font-serif text-2xl text-stone-800 dark:text-stone-100">
              {listing.quantity}
              <span className="text-base text-stone-500 dark:text-stone-400 font-sans font-normal ml-1">{listing.unit}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION ──────────────────────────────────────────── */}
      {/* data.data.description — optional free-text string */}
      {listing.description && (
        <section className="space-y-2">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Description
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
          Pickup Location
        </h2>
        <p className="font-sans text-stone-800 dark:text-stone-100">
          {listing.farmAddress}
        </p>
        <p className="font-sans text-stone-500 dark:text-stone-400 text-sm">
          {listing.farmDistrict}, {listing.farmState}
        </p>
        {listing.lat && listing.lng && (
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500">
            GPS: {Number(listing.lat).toFixed(5)}, {Number(listing.lng).toFixed(5)}
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
          Seller
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
          Received Offers ({interests.length})
        </h2>

        {interestsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-stone-100 dark:bg-stone-850 rounded-xl" />
            <div className="h-20 bg-stone-100 dark:bg-stone-850 rounded-xl" />
          </div>
        ) : interests.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center text-stone-500 dark:text-stone-400 font-sans text-sm">
            No offers received on this listing yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {interests.map((interest: any) => {
              const totalVal = interest.price * interest.quantity;
              const isPending = interest.status === 'pending';
              const isAccepted = interest.status === 'accepted';
              const isRejected = interest.status === 'rejected';
              const isWithdrawn = interest.status === 'withdrawn';

              return (
                <div
                  key={interest._id}
                  className={`p-5 rounded-2xl border transition-all ${
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
                          <span className="flex items-center gap-0.5 text-amber-500">
                            ★ {interest.buyerId?.averageRating?.toFixed(1) ?? '5.0'}
                          </span>
                          <span>•</span>
                          <span>{interest.buyerId?.phone ?? 'No phone'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge status */}
                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold font-sans border capitalize ${
                          isAccepted
                            ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
                            : isRejected
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                            : isWithdrawn
                            ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {interest.status}
                      </span>
                    </div>
                  </div>

                  {/* Bid price details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-50 dark:bg-stone-950/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800 my-4">
                    <div>
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Offered Price</span>
                      <span className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        ₹{interest.price.toLocaleString('en-IN')}
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-normal ml-0.5">/ {listing.unit}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Requested Qty</span>
                      <span className="font-serif text-lg text-stone-800 dark:text-stone-100">
                        {interest.quantity}
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-normal ml-0.5"> {listing.unit}</span>
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-0.5">Total Deal Value</span>
                      <span className="font-serif text-lg font-bold text-green-800 dark:text-green-500">
                        ₹{totalVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {interest.notes && (
                    <div className="text-sm font-sans text-stone-600 dark:text-stone-400 leading-relaxed bg-stone-50/50 dark:bg-stone-900/30 p-3 rounded-lg border border-stone-100 dark:border-stone-800/50 mb-4">
                      <p className="font-medium text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Buyer Notes</p>
                      {interest.notes}
                    </div>
                  )}

                  {/* Accept / Reject actions */}
                  {isPending && listing.status !== 'sale_confirmed' && (
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        disabled={isAccepting || isRejecting}
                        onClick={async () => {
                          if (confirm(`Are you sure you want to accept this offer from ${interest.buyerId?.name || 'this buyer'}? This will confirm the sale and reject all other pending offers.`)) {
                            try {
                              await acceptInterest({ listingId: listing._id, interestId: interest._id }).unwrap();
                            } catch (err: any) {
                              alert(err?.data?.message || 'Failed to accept offer');
                            }
                          }
                        }}
                        className="flex-1 h-11 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isAccepting ? 'Accepting...' : 'Accept Offer'}
                      </button>
                      <button
                        type="button"
                        disabled={isAccepting || isRejecting}
                        onClick={async () => {
                          if (confirm('Are you sure you want to reject this offer?')) {
                            try {
                              await rejectInterest({ listingId: listing._id, interestId: interest._id }).unwrap();
                            } catch (err: any) {
                              alert(err?.data?.message || 'Failed to reject offer');
                            }
                          }
                        }}
                        className="h-11 px-6 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-sans text-sm font-medium border border-red-200 dark:border-red-800/40 transition-colors disabled:opacity-50"
                      >
                        {isRejecting ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="mt-3 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 text-sm font-sans px-4 py-2.5 rounded-xl border border-green-200/50 dark:border-green-800/30 flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>You have accepted this offer. Deal closed.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
