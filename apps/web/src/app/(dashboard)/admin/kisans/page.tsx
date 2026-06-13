'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useGetKisansQuery, useSetKisanVerificationMutation } from '@/store/endpoints/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeletons';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Users, User, CheckCircle2, XCircle } from 'lucide-react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── KYC DIALOG ───────────────────────────────────────────────────────────────

function KycDialog({
  kisan,
  open,
  onOpenChange,
  t,
  tCommon,
}: {
  kisan: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: any;
  tCommon: any;
}) {
  const docs = [
    { label: t('kycFarmerId'), url: kisan.farmerIdPhoto },
    { label: t('kycAadhar'), url: kisan.aadharCardPhoto },
    { label: t('kycBankPassbook'), url: kisan.bankPassbookPhoto },
  ];
  const bank = kisan.bankDetails;
  const hasBankData = bank && (bank.bankName || bank.accountNumber || bank.ifscCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('kycTitle', { name: kisan.name ?? kisan.email })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Photo documents */}
          <div className="grid grid-cols-3 gap-3">
            {docs.map(({ label, url }) => (
              <div key={label} className="space-y-1.5">
                <p className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {label}
                </p>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:opacity-80 transition-opacity">
                      <Image src={url} alt={label} fill className="object-cover" sizes="160px" />
                    </div>
                    <p className="text-[10px] text-center mt-1 text-stone-500 dark:text-stone-400 font-sans hover:underline">{tCommon('view')}</p>
                  </a>
                ) : (
                  <div className="w-full aspect-[3/2] rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 font-sans text-center px-1">{t('kycNoDoc')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bank details */}
          <div className="bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-3 space-y-1.5">
            <p className="text-xs font-sans font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t('kycBankDetails')}
            </p>
            {hasBankData ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-sm">
                {bank.bankName && (
                  <>
                    <dt className="text-stone-400 dark:text-stone-500 text-xs">{t('kycBankName')}</dt>
                    <dd className="text-stone-800 dark:text-stone-200 font-medium">{bank.bankName}</dd>
                  </>
                )}
                {bank.accountNumber && (
                  <>
                    <dt className="text-stone-400 dark:text-stone-500 text-xs">{t('kycAccountNo')}</dt>
                    <dd className="text-stone-800 dark:text-stone-200 font-medium font-mono">{bank.accountNumber}</dd>
                  </>
                )}
                {bank.ifscCode && (
                  <>
                    <dt className="text-stone-400 dark:text-stone-500 text-xs">{t('kycIfsc')}</dt>
                    <dd className="text-stone-800 dark:text-stone-200 font-medium font-mono">{bank.ifscCode}</dd>
                  </>
                )}
              </dl>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500 font-sans">{t('kycNoBankDetails')}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon('cancel')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



// ─── KISAN ROW ────────────────────────────────────────────────────────────────

function KisanRow({ kisan, t, tCommon }: { kisan: any; t: any; tCommon: any }) {
  const [kycOpen, setKycOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetVerified, setTargetVerified] = useState(false);
  const [setVerification, { isLoading }] = useSetKisanVerificationMutation();

  const openConfirm = (verify: boolean) => {
    setTargetVerified(verify);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await setVerification({ id: kisan._id, isVerified: targetVerified }).unwrap();
      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <tr className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        {/* Name + photo */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {kisan.profilePhoto ? (
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                <Image src={kisan.profilePhoto} alt="" fill className="object-cover" sizes="36px" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-400 border border-stone-200 dark:border-stone-700">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-sans font-semibold text-sm text-stone-800 dark:text-stone-100 truncate">
                {kisan.name ?? '—'}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 font-sans">
                {t('verifiedOn', { date: fmtDate(kisan.createdAt) }).replace(
                  t('verifiedOn', { date: fmtDate(kisan.createdAt) }),
                  `Joined ${fmtDate(kisan.createdAt)}`
                )}
              </p>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="px-4 py-3">
          <p className="text-sm text-stone-700 dark:text-stone-300 font-sans">{kisan.email}</p>
          {kisan.phone && (
            <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mt-0.5">{kisan.phone}</p>
          )}
        </td>

        {/* Location */}
        <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400 font-sans">
          {kisan.location ?? '—'}
        </td>

        {/* Verification status */}
        <td className="px-4 py-3">
          {kisan.isVerified ? (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                <CheckCircle2 className="w-3 h-3" />
                {t('verified')}
              </span>
              {kisan.verifiedAt && (
                <p className="text-[10px] text-stone-400 font-sans">{t('verifiedOn', { date: fmtDate(kisan.verifiedAt) })}</p>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 border border-amber-100 dark:border-amber-800/30">
              <XCircle className="w-3 h-3" />
              {t('unverified')}
            </span>
          )}
        </td>

        {/* KYC docs */}
        <td className="px-4 py-3">
          <button
            onClick={() => setKycOpen(true)}
            className="h-8 px-3 text-xs font-medium font-sans rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {t('viewKyc')}
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          {kisan.isVerified ? (
            <Button
              size="sm"
              onClick={() => openConfirm(false)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
            >
              {t('btnRevoke')}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => openConfirm(true)}
              disabled={isLoading}
              className="bg-green-700 hover:bg-green-800 text-white text-xs h-8"
            >
              {t('btnVerify')}
            </Button>
          )}
        </td>
      </tr>

      <KycDialog kisan={kisan} open={kycOpen} onOpenChange={setKycOpen} t={t} tCommon={tCommon} />
      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={targetVerified ? t('confirmVerifyTitle') : t('confirmRevokeTitle')}
        description={targetVerified ? t('confirmVerifyDesc') : t('confirmRevokeDesc')}
        onConfirm={handleConfirm}
        confirmText={targetVerified ? t('confirmVerifyYes') : t('confirmRevokeYes')}
        isLoading={isLoading}
        variant={targetVerified ? 'success' : 'destructive'}
      />
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminKisansPage() {
  const t = useTranslations('adminKisans');
  const tCommon = useTranslations('common');

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetKisansQuery({
    ...(appliedSearch ? { search: appliedSearch } : {}),
    ...(verified !== '' ? { verified } : {}),
    page,
    limit: 20,
  });

  const kisans: any[] = data?.data ?? [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  const filterBtn = (val: string, label: string) => (
    <button
      type="button"
      onClick={() => { setVerified(val); setPage(1); }}
      className={`h-9 px-4 rounded-xl text-xs font-medium font-sans transition-colors border ${
        verified === val
          ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-800 dark:border-stone-100'
          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Toolbar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 rounded-xl text-sm"
          />
          <Button type="submit" size="sm" className="h-9 bg-green-800 hover:bg-green-700 text-white shrink-0">
            {tCommon('search')}
          </Button>
        </form>
        <div className="flex gap-2">
          {filterBtn('', t('filterAll'))}
          {filterBtn('false', t('filterUnverified'))}
          {filterBtn('true', t('filterVerified'))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        {isError ? (
          <div className="py-20 text-center text-stone-500 dark:text-stone-400 font-sans text-sm">
            Failed to load kisans. Please try again.
          </div>
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : kisans.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('noKisans')}
            subtitle={t('noKisansSub')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
                <tr>
                  {[t('colName'), t('colContact'), t('colLocation'), t('colStatus'), t('colKyc'), t('colActions')].map((col) => (
                    <th key={col} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-sans">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kisans.map((k) => (
                  <KisanRow key={k._id} kisan={k} t={t} tCommon={tCommon} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
