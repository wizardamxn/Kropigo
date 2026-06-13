'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetOrderByIdQuery } from '@/store/endpoints/ordersApi';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';

export default function KisanOrderViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, isError } = useGetOrderByIdQuery(id);
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse p-4">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-32 mb-6" />
        <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 dark:text-red-400 font-sans">Order not found or access denied.</p>
        <Link href="/kisan/listings" className="text-sm underline text-stone-500">Back to Listings</Link>
      </div>
    );
  }

  const crop = order.listingId?.cropId;
  const buyer = order.buyerId;
  const totalValue = order.agreedPrice * (order.quantity || 1);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4 sm:px-0">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 font-sans text-sm font-medium transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
              Confirmed Deal
            </h1>
            <p className="font-sans text-sm text-stone-500 dark:text-stone-400 mt-1">
              Order ID: <span className="font-mono">{order._id}</span>
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Warning/Info Box */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 flex gap-3 shadow-sm">
        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" />
        <div className="font-sans text-sm text-green-900 dark:text-green-300">
          <strong className="font-medium block mb-0.5">Success!</strong>
          You have accepted the buyer's offer. Our team will contact you shortly to coordinate the pickup and payment. For privacy reasons, direct contact details are kept hidden until confirmed.
        </div>
      </div>

      {/* Order Summary */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800/60 pb-3">
          Deal Summary
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">Crop</p>
            <p className="font-serif text-xl text-stone-800 dark:text-stone-100">
              {crop?.name ?? 'Unknown Crop'}
              {crop?.category && <span className="text-sm font-sans text-stone-500 dark:text-stone-400 ml-2">({crop.category})</span>}
            </p>
          </div>

          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">Agreed Rate</p>
            <p className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
              ₹{order.agreedPrice?.toLocaleString('en-IN')} <span className="text-sm text-stone-500">/ {crop?.unit || 'unit'}</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans mb-1">Quantity</p>
            <p className="font-sans text-lg font-medium text-stone-800 dark:text-stone-100">
              {order.quantity} <span className="text-sm text-stone-500">{crop?.unit || 'unit'}</span>
            </p>
          </div>

          <div className="col-span-2 md:col-span-2 bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
            <p className="text-xs text-green-700 dark:text-green-500 uppercase tracking-wider font-sans mb-1 font-semibold">Total Deal Value</p>
            <p className="font-serif text-2xl font-bold text-green-800 dark:text-green-400">
              ₹{totalValue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="text-sm font-sans text-stone-500 dark:text-stone-400 pt-4 border-t border-stone-100 dark:border-stone-800/60">
          Accepted on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </section>

      {/* Buyer Details */}
      <section className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-5 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
        <h2 className="font-serif text-xl text-stone-800 dark:text-stone-100">
          Buyer Information
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xl text-stone-600 dark:text-stone-300 font-sans font-semibold border border-stone-300 dark:border-stone-700 shadow-sm">
            {buyer?.name ? buyer.name[0].toUpperCase() : 'B'}
          </div>
          <div className="flex-1">
            <h3 className="font-sans text-lg font-semibold text-stone-800 dark:text-stone-100">
              {buyer?.name ?? 'Unknown Buyer'}
            </h3>
            <p className="font-sans text-stone-500 dark:text-stone-400 text-sm mt-1">
              Contact details will be shared by our team.
            </p>
          </div>
        </div>
      </section>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link href={`/kisan/listings/${typeof order.listingId === 'object' ? order.listingId._id : order.listingId}/view`} className="text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-sans transition-colors">
          Back to Listing
        </Link>
        {order.status === 'delivered' && (
          <Link
            href={`/kisan/orders/${order._id}/invoice`}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Download Invoice
          </Link>
        )}
      </div>
    </div>
  );
}
