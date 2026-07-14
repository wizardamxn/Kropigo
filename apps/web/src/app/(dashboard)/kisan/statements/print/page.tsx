'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGetMyStatementsQuery, StatementEntry, DailyStatement } from '@/store/endpoints/statementsApi';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

const fmt = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN');
const fmtNum = (n: number) => (n ?? 0).toLocaleString('en-IN');
const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const fmtShort = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// One row of sellings → table cells. `showDate`/`showCrop` drop the column that's
// already fixed by the statement scope (e.g. a per-crop statement doesn't repeat the crop).
function EntryTable({ entries, showDate, showCrop }: { entries: StatementEntry[]; showDate: boolean; showCrop: boolean }) {
  const totalAmount = entries.reduce((s, e) => s + (e.totalAmount ?? 0), 0);
  return (
    <table className="w-full text-sm font-sans border-collapse">
      <thead>
        <tr className="border-b border-stone-200">
          {showDate && <th className="text-left pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">Date</th>}
          {showCrop && <th className="text-left pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">Crop</th>}
          <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">Quantity</th>
          <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">Rate</th>
          <th className="text-left pb-2 pl-4 text-stone-500 font-semibold text-xs uppercase tracking-wider">Buyer</th>
          <th className="text-right pb-2 text-stone-500 font-semibold text-xs uppercase tracking-wider">Amount</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.orderId} className="border-b border-stone-100">
            {showDate && <td className="py-2 text-stone-700">{fmtShort(e.soldAt)}</td>}
            {showCrop && (
              <td className="py-2 text-stone-800 font-medium capitalize">
                {e.cropName}{e.grade ? ` · Grade ${e.grade}` : ''}
              </td>
            )}
            <td className="py-2 text-right text-stone-700">{fmtNum(e.quantity)} {e.unit}</td>
            <td className="py-2 text-right text-stone-700">{fmt(e.agreedPrice)}/{e.unit}</td>
            <td className="py-2 pl-4 text-stone-700">{e.buyerName ?? '—'}</td>
            <td className="py-2 text-right font-semibold text-stone-900">{fmt(e.totalAmount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={(showDate ? 1 : 0) + (showCrop ? 1 : 0) + 3} className="pt-3 text-right font-semibold text-stone-700 text-sm">
            Total · {entries.length} {entries.length === 1 ? 'selling' : 'sellings'}
          </td>
          <td className="pt-3 text-right font-serif text-lg font-bold text-green-800">{fmt(totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function StatementPrint() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const scope = params.get('scope') ?? 'all'; // 'all' | 'day' | 'crop'
  const dateKey = params.get('date') ?? '';
  const cropParam = params.get('crop') ?? '';
  const gradeParam = params.get('grade') ?? '';

  const { data, isLoading, isError } = useGetMyStatementsQuery({ page: 1, limit: 1000 });
  const statements: DailyStatement[] = data?.data ?? [];

  const dayStmt = statements.find((s) => s.dateKey === dateKey);

  let title = 'All Statements';
  let subtitle = '';
  let body: React.ReactNode = null;

  if (isError) {
    body = <p className="text-center text-stone-500 font-sans py-10">Failed to load statement.</p>;
  } else if (isLoading) {
    body = <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-800" /></div>;
  } else if (scope === 'crop') {
    const entries = (dayStmt?.entries ?? []).filter(
      (e) => e.cropName === cropParam && (gradeParam ? (e.grade ?? '') === gradeParam : true),
    );
    title = cropParam ? cropParam.charAt(0).toUpperCase() + cropParam.slice(1) : 'Crop';
    if (gradeParam) title += ` · Grade ${gradeParam}`;
    subtitle = fmtDay(dayStmt?.date);
    body = entries.length
      ? <EntryTable entries={entries} showDate={false} showCrop={false} />
      : <p className="text-center text-stone-500 font-sans py-10">No sellings for this crop on this day.</p>;
  } else if (scope === 'day') {
    title = fmtDay(dayStmt?.date);
    subtitle = 'Full day statement';
    body = dayStmt && dayStmt.entries.length
      ? <EntryTable entries={dayStmt.entries} showDate={false} showCrop={true} />
      : <p className="text-center text-stone-500 font-sans py-10">No sellings on this day.</p>;
  } else {
    // scope === 'all' — every day, grouped, with a grand total.
    const grandTotal = statements.reduce((s, st) => s + (st.totalAmount ?? 0), 0);
    const grandSales = statements.reduce((s, st) => s + (st.totalSales ?? 0), 0);
    subtitle = 'Combined statement — all days';
    body = statements.length ? (
      <div className="space-y-8">
        {statements.map((st) => (
          <section key={st._id} className="break-inside-avoid">
            <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-300 pb-2 mb-3">{fmtShort(st.date)}</h3>
            <EntryTable entries={st.entries} showDate={false} showCrop={true} />
          </section>
        ))}
        <div className="border-t-2 border-stone-300 pt-4 flex items-center justify-between">
          <p className="font-sans font-semibold text-stone-700">
            Grand Total · {grandSales} {grandSales === 1 ? 'selling' : 'sellings'}
          </p>
          <p className="font-serif text-2xl font-bold text-green-800">{fmt(grandTotal)}</p>
        </div>
      </div>
    ) : (
      <p className="text-center text-stone-500 font-sans py-10">No sellings recorded yet.</p>
    );
  }

  return (
    <div className="statement-root bg-white dark:bg-white text-stone-900 max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden flex justify-between gap-3 mb-6">
        <button
          onClick={() => router.push('/kisan/statements')}
          className="flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-300 text-stone-700 font-sans text-sm font-medium hover:bg-stone-50 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          disabled={isLoading}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-green-800 hover:bg-green-700 text-white font-sans text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-stone-200 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/KROPIGO_cropped.png" alt="KropiGo" width={48} height={48} className="rounded-xl object-cover" />
          <div>
            <p className="font-serif text-2xl font-bold text-stone-900 leading-none">KropiGo</p>
            <p className="text-xs font-sans text-stone-500 mt-0.5 uppercase tracking-wider">Agricultural Marketplace</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl md:text-3xl font-bold text-stone-900 capitalize">{title}</p>
          {subtitle && <p className="text-xs font-sans text-stone-500 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Farmer identity */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 mb-8">
        <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400 mb-2">Farmer</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-sans text-sm">
          <div className="flex gap-2">
            <dt className="text-stone-400 w-20 shrink-0">Name</dt>
            <dd className="font-medium text-stone-800">{user?.name ?? '—'}</dd>
          </div>
          {user?.username && (
            <div className="flex gap-2">
              <dt className="text-stone-400 w-20 shrink-0">Farmer ID</dt>
              <dd className="font-mono font-semibold text-stone-800">{user.username}</dd>
            </div>
          )}
          {user?.phone && (
            <div className="flex gap-2">
              <dt className="text-stone-400 w-20 shrink-0">Phone</dt>
              <dd className="text-stone-800">{user.phone}</dd>
            </div>
          )}
          {user?.location && (
            <div className="flex gap-2">
              <dt className="text-stone-400 w-20 shrink-0">Location</dt>
              <dd className="text-stone-800">{user.location}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Body */}
      {body}

      {/* Footer */}
      <div className="border-t border-stone-200 pt-4 mt-8 text-center">
        <p className="text-[10px] text-stone-400 font-sans">
          Generated by KropiGo on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. This is a system-generated statement.
        </p>
      </div>
    </div>
  );
}
