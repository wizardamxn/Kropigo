'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/store/endpoints/authApi';
import { useGetCloudinarySignatureMutation, useDeleteCloudinaryMediaMutation } from '@/store/endpoints/mediaApi';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { useLogout } from '@/hooks/useLogout';
import { uploadMediaFile } from '@/lib/cloudinaryUpload';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const ImageCrudField = ({
  label,
  value,
  onUpload,
  isUploading,
  onRemove,
  onView
}: {
  label: string;
  value: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  onRemove: () => void;
  onView: () => void;
}) => {
  const t = useTranslations('kisanProfile');
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/40 rounded-2xl border border-stone-200 dark:border-stone-800 gap-4 transition-all w-full">
      {/* Left side: Preview thumbnail & status info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-14 h-14 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-950 flex items-center justify-center shadow-sm">
          {value ? (
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-cover" 
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/100?text=Invalid'; }} 
            />
          ) : (
            <svg className="w-6 h-6 text-stone-400 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-sans font-semibold text-stone-800 dark:text-stone-200 text-sm tracking-tight">{label}</h4>
          <div className="font-sans text-xs mt-0.5">
            {isUploading ? (
              <span className="text-stone-500 animate-pulse flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-stone-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('uploadingStorage')}
              </span>
            ) : value ? (
              <span className="text-green-700 dark:text-green-500 font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                {t('docAttached')}
              </span>
            ) : (
              <span className="text-stone-450 dark:text-stone-500">{t('noFile')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Explicit Accessible CRUD options */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {value ? (
          <>
            {/* View Option */}
            <button
              type="button"
              onClick={onView}
              className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('viewFile')}
            </button>

            {/* Change File Option */}
            <label className="relative h-10 px-4 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18.2" />
              </svg>
              {t('replace')}
              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="absolute inset-0 opacity-0 pointer-events-none w-full"
                disabled={isUploading}
              />
            </label>

            {/* Delete Option */}
            <button
              type="button"
              onClick={onRemove}
              className="h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('remove')}
            </button>
          </>
        ) : (
          /* Initial Upload Button Setup Trigger */
          <label className="relative h-12 px-5 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('uploadDoc')}
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="absolute inset-0 opacity-0 pointer-events-none w-full"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default function KisanProfile() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const t = useTranslations('kisanProfile');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [marka, setMarka] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [farmerIdPhoto, setFarmerIdPhoto] = useState('');
  const [aadharCardPhoto, setAadharCardPhoto] = useState('');
  const [bankPassbookPhoto, setBankPassbookPhoto] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [urlsToDelete, setUrlsToDelete] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLabel, setPreviewLabel] = useState('');

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [getCloudinarySignature] = useGetCloudinarySignatureMutation();
  const [deleteCloudinaryMedia] = useDeleteCloudinaryMediaMutation();
  const [handleLogout, isLoggingOut] = useLogout();

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setLocation(user.location ?? '');
    setFathersName(user.fathersName ?? '');
    setMarka(user.marka ?? '');
    setProfilePhoto(user.profilePhoto ?? '');
    setFarmerIdPhoto(user.farmerIdPhoto ?? '');
    setAadharCardPhoto(user.aadharCardPhoto ?? '');
    setBankPassbookPhoto(user.bankPassbookPhoto ?? '');
    setAccountNumber(user.bankDetails?.accountNumber ?? '');
    setIfscCode(user.bankDetails?.ifscCode ?? '');
    setBankName(user.bankDetails?.bankName ?? '');
  }, [user]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    currentUrl: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      const url = await uploadMediaFile(file, () => getCloudinarySignature().unwrap());
      setter(url);
      if (currentUrl) {
        setUrlsToDelete((prev) => [...prev, currentUrl]);
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (val: string, setter: (val: string) => void) => {
    if (val) {
      setUrlsToDelete((prev) => [...prev, val]);
    }
    setter('');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateProfile({ 
        name, 
        role: user!.role, 
        location, 
        fathersName: fathersName || undefined,
        marka: marka || undefined,
        profilePhoto,
        farmerIdPhoto,
        aadharCardPhoto,
        bankPassbookPhoto,
        bankDetails: { accountNumber, ifscCode, bankName }
      }).unwrap();
      
      dispatch(updateUser({ 
        name, 
        location, 
        fathersName,
        marka,
        profilePhoto,
        farmerIdPhoto,
        aadharCardPhoto,
        bankPassbookPhoto,
        bankDetails: { accountNumber, ifscCode, bankName }
      }));
      setMessage('Profile updated successfully.');
      toast.success('Profile updated successfully.');

      if (urlsToDelete.length > 0) {
        try {
          await deleteCloudinaryMedia({ mediaUrls: urlsToDelete }).unwrap();
          setUrlsToDelete([]);
        } catch (cleanupErr) {
          console.error('Failed to delete old images from Cloudinary:', cleanupErr);
        }
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to update profile.');
    }
  };


  const inputBaseClass = "h-12 w-full rounded-xl bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all shadow-sm";
  const labelBaseClass = "block font-sans text-sm font-medium text-stone-800 dark:text-stone-300 mb-1.5 ml-1";

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 w-full overflow-hidden">
      
      {/* Title Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-800 dark:text-stone-100 font-medium tracking-tight">
          {t('title')}
        </h1>
        <p className="font-sans text-stone-600 dark:text-stone-400 mt-2 text-base md:text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Dynamic Alerts */}
      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
          <svg className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-sans text-sm font-medium text-green-800 dark:text-green-300">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
          <svg className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-sans text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Main Grid Content Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Left Side: Summary Panel Metadata Overview */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center text-center">
            
            {/* Avatar Box Component */}
            <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-950 border-4 border-white dark:border-stone-900 shadow-sm overflow-hidden mb-4 flex items-center justify-center text-green-800 dark:text-green-500 font-serif font-bold text-4xl">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Producer Profile" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                (name || 'K')[0].toUpperCase()
              )}
            </div>
            
            <h2 className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100 truncate w-full px-2">{name || 'Farmer User'}</h2>
            <p className="font-sans text-xs font-semibold tracking-wider text-stone-400 dark:text-stone-500 uppercase mt-0.5 mb-4">{t('account', { role: user?.role || 'Kisan' })}</p>
            
            {user?.isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 font-sans text-xs font-semibold border border-green-200/60 dark:border-green-800/40 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                {t('verifiedProducer')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-sans text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('pendingVerification')}
              </span>
            )}

            <div className="w-full mt-6 space-y-4 text-left border-t border-stone-100 dark:border-stone-800 pt-6 font-sans text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('registeredEmail')}</span>
                <span className="block font-medium text-stone-800 dark:text-stone-200 break-all">{user?.email}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('mobilePhone')}</span>
                <span className="block font-medium text-stone-800 dark:text-stone-200">{user?.phone}</span>
              </div>
              {user?.fathersName && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('fathersName')}</span>
                  <span className="block font-medium text-stone-800 dark:text-stone-200">{user.fathersName}</span>
                </div>
              )}
              {user?.marka && (
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('marka')}</span>
                  <span className="block font-medium text-stone-800 dark:text-stone-200 uppercase tracking-wider font-semibold">{user.marka}</span>
                </div>
              )}
            </div>
          </section>

          {/* Session Token Control Box Section */}
          <section className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
            <h3 className="font-sans font-semibold text-stone-850 dark:text-stone-200 text-sm uppercase tracking-wider">{t('sessionManagement')}</h3>
            <button 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="h-12 w-full rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-sans font-semibold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {isLoggingOut ? t('terminatingSync') : t('signOutSecurely')}
            </button>
          </section>
        </div>

        {/* Right Side: Interactive Form Ledger Profile Configurator */}
        <div className="lg:col-span-2">
          <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-850 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800/60 pb-4 mb-6">
              {t('editAccountConfig')}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className={labelBaseClass} htmlFor="name-input">{t('fullName')}</label>
                <input 
                  id="name-input" 
                  type="text" 
                  minLength={2} 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder={t('fullNamePlaceholder')}
                  className={inputBaseClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelBaseClass} htmlFor="fathers-name-input">{t('fathersNameLabel')}</label>
                  <input 
                    id="fathers-name-input" 
                    type="text" 
                    value={fathersName} 
                    onChange={(e) => setFathersName(e.target.value)} 
                    placeholder={t('fathersNamePlaceholder')}
                    className={inputBaseClass}
                  />
                </div>
                <div>
                  <label className={labelBaseClass} htmlFor="marka-input">{t('markaLabel')}</label>
                  <input 
                    id="marka-input" 
                    type="text" 
                    maxLength={5} 
                    value={marka} 
                    onChange={(e) => setMarka(e.target.value.toUpperCase())} 
                    placeholder={t('markaPlaceholder')}
                    className={`${inputBaseClass} uppercase font-semibold`}
                  />
                  <div className="text-right mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans">
                    {t('markaLength', { length: marka.length })}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelBaseClass} htmlFor="location-input">{t('locationLabel')}</label>
                <input 
                  id="location-input" 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder={t('locationPlaceholder')}
                  className={inputBaseClass}
                />
                <p className="text-xs text-stone-500 mt-1.5 ml-1">{t('locationHelp')}</p>
              </div>

              <ImageCrudField
                label={t('profileAvatar')}
                value={profilePhoto}
                onUpload={(e) => handleFileUpload(e, setProfilePhoto, profilePhoto)}
                isUploading={isUploading}
                onRemove={() => handleRemovePhoto(profilePhoto, setProfilePhoto)}
                onView={() => { setPreviewUrl(profilePhoto); setPreviewLabel(t('profileAvatar')); }}
              />

              {/* Identity Verification Sub-Forms Surfaces */}
              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                <h3 className="font-serif text-xl text-stone-850 dark:text-stone-100 mb-2">{t('legalVerification')}</h3>
                <p className="font-sans text-xs text-stone-500 mb-4 pl-1">{t('legalVerificationHelp')}</p>
                
                <div className="space-y-4">
                  <ImageCrudField
                    label={t('farmerIdImage')}
                    value={farmerIdPhoto}
                    onUpload={(e) => handleFileUpload(e, setFarmerIdPhoto, farmerIdPhoto)}
                    isUploading={isUploading}
                    onRemove={() => handleRemovePhoto(farmerIdPhoto, setFarmerIdPhoto)}
                    onView={() => { setPreviewUrl(farmerIdPhoto); setPreviewLabel(t('farmerIdImage')); }}
                  />

                  <ImageCrudField
                    label={t('aadharImage')}
                    value={aadharCardPhoto}
                    onUpload={(e) => handleFileUpload(e, setAadharCardPhoto, aadharCardPhoto)}
                    isUploading={isUploading}
                    onRemove={() => handleRemovePhoto(aadharCardPhoto, setAadharCardPhoto)}
                    onView={() => { setPreviewUrl(aadharCardPhoto); setPreviewLabel(t('aadharImage')); }}
                  />

                  <ImageCrudField
                    label={t('bankPassbookImage')}
                    value={bankPassbookPhoto}
                    onUpload={(e) => handleFileUpload(e, setBankPassbookPhoto, bankPassbookPhoto)}
                    isUploading={isUploading}
                    onRemove={() => handleRemovePhoto(bankPassbookPhoto, setBankPassbookPhoto)}
                    onView={() => { setPreviewUrl(bankPassbookPhoto); setPreviewLabel(t('bankPassbookImage')); }}
                  />
                </div>
              </div>

              {/* Settlement Banking Credentials Parameters Configuration */}
              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                <h3 className="font-serif text-xl text-stone-850 dark:text-stone-100 mb-4">{t('financialLedger')}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelBaseClass} htmlFor="bank-name-input">{t('bankName')}</label>
                    <input id="bank-name-input" type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t('bankNamePlaceholder')} className={inputBaseClass} />
                  </div>
                  <div>
                    <label className={labelBaseClass} htmlFor="account-num-input">{t('accountNumber')}</label>
                    <input id="account-num-input" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={t('accountNumberPlaceholder')} className={inputBaseClass} />
                  </div>
                  <div>
                    <label className={labelBaseClass} htmlFor="ifsc-input">{t('ifscCode')}</label>
                    <input id="ifsc-input" type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder={t('ifscPlaceholder')} className={inputBaseClass} />
                  </div>
                </div>
              </div>

              {/* Submit Execution Actions Panel */}
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800/60 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving || isUploading}
                  className="h-12 px-8 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-semibold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('updatingProfile')}
                    </>
                  ) : (
                    t('saveChanges')
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

      </div>

      {/* Lightbox Structural Modal Asset Image Overlay Panel Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800/60 flex justify-between items-center bg-stone-50 dark:bg-stone-950/20">
              <h3 className="font-serif text-lg font-medium text-stone-800 dark:text-stone-100">{previewLabel}</h3>
              <button 
                type="button" 
                onClick={() => { setPreviewUrl(''); setPreviewLabel(''); }}
                className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 bg-stone-950 flex items-center justify-center p-6 overflow-hidden min-h-[320px]">
              <img src={previewUrl} alt={previewLabel} className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}