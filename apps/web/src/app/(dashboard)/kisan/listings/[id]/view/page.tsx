'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useGetListingByIdQuery } from '@/store/endpoints/listingsApi';

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
  const listing = data?.data;

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

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {/* This button area is for buyer actions — currently a placeholder */}
      {listing.status === 'open' && (
        <div className="pt-2">
          <button
            type="button"
            disabled
            className="w-full h-14 rounded-xl bg-green-800 text-white font-sans text-lg font-medium opacity-50 cursor-not-allowed"
          >
            Express Interest — Coming Soon
          </button>
          <p className="text-center text-xs text-stone-400 dark:text-stone-500 font-sans mt-2">
            Buyer interest flow not yet implemented
          </p>
        </div>
      )}

    </div>
  );
}
