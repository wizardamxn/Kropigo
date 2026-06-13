'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function InvoiceView({ order }: Readonly<{ order: any }>) {
  const t = useTranslations('invoice');

  const crop = order.listingId?.cropId;
  const seller = order.sellerId;
  const buyer = order.buyerId;
  const deliveredEntry = [...(order.timeline ?? [])]
    .reverse()
    .find((e: any) => e.status === 'delivered');

  const totalAmount = order.agreedPrice * order.quantity;

  return (
    <div className="invoice-root bg-white dark:bg-white text-stone-900 max-w-2xl mx-auto px-8 py-10 print:px-0 print:py-0">

      {/* ── Print button — hidden when printing ── */}
      <div className="print:hidden flex justify-end mb-6">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t('printBtn')}
        </button>
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b-2 border-stone-200 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <Image
            src="/KROPIGO_cropped.png"
            alt="KropiGo"
            width={48}
            height={48}
            className="rounded-xl object-cover"
          />
          <div>
            <p className="font-serif text-2xl font-bold text-stone-900 leading-none">KropiGo</p>
            <p className="text-xs font-sans text-stone-500 mt-0.5 uppercase tracking-wider">Agricultural Marketplace</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-bold text-stone-900">{t('title')}</p>
          <p className="text-xs font-sans text-stone-500 mt-1 font-mono">{order._id}</p>
        </div>
      </div>

      {/* ── Dates ── */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <p className="text-[10px] font-sans uppercase tracking-wider text-stone-400 mb-0.5">{t('orderDate')}</p>
          <p className="font-sans text-sm font-medium text-stone-800">{fmtDate(order.createdAt)}</p>
        </div>
        {deliveredEntry && (
          <div>
            <p className="text-[10px] font-sans uppercase tracking-wider text-stone-400 mb-0.5">{t('deliveredOn')}</p>
            <p className="font-sans text-sm font-medium text-stone-800">{fmtDate(deliveredEntry.timestamp)}</p>
          </div>
        )}
      </div>

      {/* ── Parties ── */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Seller */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400 mb-2">{t('seller')}</p>
          <dl className="space-y-1 font-sans text-sm">
            <div className="flex gap-2">
              <dt className="text-stone-400 w-16 shrink-0">{t('name')}</dt>
              <dd className="font-medium text-stone-800">{seller?.name ?? '—'}</dd>
            </div>
            {seller?.phone && (
              <div className="flex gap-2">
                <dt className="text-stone-400 w-16 shrink-0">{t('phone')}</dt>
                <dd className="text-stone-800">{seller.phone}</dd>
              </div>
            )}
            {seller?.location && (
              <div className="flex gap-2">
                <dt className="text-stone-400 w-16 shrink-0">{t('district')}</dt>
                <dd className="text-stone-800">{seller.location}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Buyer */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400 mb-2">{t('buyer')}</p>
          <dl className="space-y-1 font-sans text-sm">
            <div className="flex gap-2">
              <dt className="text-stone-400 w-16 shrink-0">{t('name')}</dt>
              <dd className="font-medium text-stone-800">{buyer?.name ?? '—'}</dd>
            </div>
            {buyer?.phone && (
              <div className="flex gap-2">
                <dt className="text-stone-400 w-16 shrink-0">{t('phone')}</dt>
                <dd className="text-stone-800">{buyer.phone}</dd>
              </div>
            )}
            {buyer?.location && (
              <div className="flex gap-2">
                <dt className="text-stone-400 w-16 shrink-0">{t('district')}</dt>
                <dd className="text-stone-800">{buyer.location}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* ── Line items table ── */}
      <div className="mb-8">
        <p className="text-xs font-sans font-semibold uppercase tracking-wider text-stone-500 mb-3">{t('lineItemsTitle')}</p>
        <table className="w-full text-sm font-sans border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-200">
              <th className="text-left pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">{t('crop')}</th>
              <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">{t('quantity')}</th>
              <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">{t('agreedRate')}</th>
              <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="py-3">
                <p className="font-medium text-stone-800">{crop?.name ?? '—'}</p>
                {order.listingId?.variety && (
                  <p className="text-xs text-stone-400">{order.listingId.variety}</p>
                )}
              </td>
              <td className="py-3 text-right text-stone-700">
                {order.quantity} {order.unit}
              </td>
              <td className="py-3 text-right text-stone-700">
                {fmt(order.agreedPrice)}/{order.unit}
              </td>
              <td className="py-3 text-right font-semibold text-stone-900">
                {fmt(totalAmount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-semibold text-stone-700 text-sm">{t('total')}</td>
              <td className="pt-4 text-right font-serif text-xl font-bold text-green-800">
                {fmt(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-stone-200 pt-4 text-center">
        <p className="text-[10px] text-stone-400 font-sans">{t('footerNote')}</p>
      </div>

    </div>
  );
}
