'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/store/endpoints/authApi';
import { useGetCloudinarySignatureMutation, useDeleteCloudinaryMediaMutation } from '@/store/endpoints/mediaApi';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { useLogout } from '@/hooks/useLogout';
import { uploadMediaFile } from '@/lib/cloudinaryUpload';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/input';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { 
  FileText, 
  Loader2, 
  Check, 
  Eye, 
  RefreshCw, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  LogOut, 
  X,
  User,
  Lock
} from 'lucide-react';

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
  const t = useTranslations('buyerProfile');
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
            <FileText className="w-6 h-6 text-stone-400 dark:text-stone-600" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-sans font-semibold text-stone-800 dark:text-stone-200 text-sm tracking-tight">{label}</h4>
          <div className="font-sans text-xs mt-0.5">
            {isUploading ? (
              <span className="text-stone-500 animate-pulse flex items-center gap-1.5">
                <Loader2 className="animate-spin h-3.5 w-3.5 text-stone-500" />
                {t('uploadingStorage')}
              </span>
            ) : value ? (
              <span className="text-green-700 dark:text-green-500 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                {t('docAttached')}
              </span>
            ) : (
              <span className="text-stone-450 dark:text-stone-500">{t('noFile')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Accessible CRUD options */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {value ? (
          <>
            {/* View Option */}
            <button
              type="button"
              onClick={onView}
              className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Eye className="w-4 h-4 flex-shrink-0" />
              {t('viewFile')}
            </button>

            {/* Change File Option */}
            <label className="relative h-10 px-4 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer">
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
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
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              {t('remove')}
            </button>
          </>
        ) : (
          /* Initial Upload Button Setup Trigger */
          <label className="relative h-12 px-5 rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <Plus className="w-4 h-4 flex-shrink-0" />
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

const buyerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  fathersName: z.string().max(200, "Father's name cannot exceed 200 characters").optional(),
  marka: z.string().max(5, "Marka cannot exceed 5 characters").optional(),
  location: z.string().optional(),
  profilePhoto: z.string().optional(),
  farmerIdPhoto: z.string().optional(), // Used as GST Certificate Image for Buyer
  aadharCardPhoto: z.string().optional(),
});

type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;

export default function BuyerProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const t = useTranslations('buyerProfile');
  const tAuth = useTranslations('auth');
  const searchParams = useSearchParams();

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

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BuyerProfileInput>({
    resolver: zodResolver(buyerProfileSchema),
    defaultValues: {
      name: '',
      fathersName: '',
      marka: '',
      location: '',
      profilePhoto: '',
      farmerIdPhoto: '',
      aadharCardPhoto: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast.success(tAuth('welcomeCompleteProfile'), { duration: 6000 });
    }
  }, [searchParams, tAuth]);

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name ?? '',
      location: user.location ?? '',
      fathersName: user.fathersName ?? '',
      marka: user.marka ?? '',
      profilePhoto: user.profilePhoto ?? '',
      farmerIdPhoto: user.farmerIdPhoto ?? '',
      aadharCardPhoto: user.aadharCardPhoto ?? '',
    });
  }, [user, reset]);

  const watchedName = watch('name') || '';
  const watchedMarka = watch('marka') || '';
  const watchedProfilePhoto = watch('profilePhoto') || '';
  const watchedFarmerIdPhoto = watch('farmerIdPhoto') || '';
  const watchedAadharCardPhoto = watch('aadharCardPhoto') || '';

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof BuyerProfileInput,
    currentUrl: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      const url = await uploadMediaFile(file, () => getCloudinarySignature().unwrap());
      setValue(field, url, { shouldValidate: true, shouldDirty: true });
      if (currentUrl) {
        setUrlsToDelete((prev) => [...prev, currentUrl]);
      }
    } catch (err: any) {
      setError(err.message || 'File upload failed');
      toast.error(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (field: keyof BuyerProfileInput, val: string) => {
    if (val) {
      setUrlsToDelete((prev) => [...prev, val]);
    }
    setValue(field, '', { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: BuyerProfileInput) => {
    setMessage('');
    setError('');
    try {
      await updateProfile({ 
        name: data.name, 
        role: user!.role, 
        location: data.location, 
        fathersName: data.fathersName || undefined,
        marka: data.marka || undefined,
        profilePhoto: data.profilePhoto,
        farmerIdPhoto: data.farmerIdPhoto,
        aadharCardPhoto: data.aadharCardPhoto,
      }).unwrap();
      
      dispatch(updateUser({ 
        name: data.name, 
        location: data.location, 
        fathersName: data.fathersName,
        marka: data.marka,
        profilePhoto: data.profilePhoto,
        farmerIdPhoto: data.farmerIdPhoto,
        aadharCardPhoto: data.aadharCardPhoto,
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
      toast.error(err?.data?.message ?? 'Failed to update profile.');
    }
  };

  return (
    <RoleGuard allowedRoles={['buyer']}>
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
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" />
            <span className="font-sans text-sm font-medium text-green-800 dark:text-green-300">{message}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex gap-3 shadow-sm animate-in slide-in-from-top-2">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" />
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
                {watchedProfilePhoto ? (
                  <img src={watchedProfilePhoto} alt="Producer Profile" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  (watchedName || 'B')[0].toUpperCase()
                )}
              </div>
              
              <h2 className="font-serif text-2xl font-medium text-stone-800 dark:text-stone-100 truncate w-full px-2">{watchedName || 'Buyer User'}</h2>
              <p className="font-sans text-xs font-semibold tracking-wider text-stone-400 dark:text-stone-500 uppercase mt-0.5 mb-4">{t('accountType', { role: user?.role || 'Buyer' })}</p>
              
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 font-sans text-xs font-semibold border border-green-200/60 dark:border-green-800/40 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {t('verifiedAccount')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-sans text-xs font-semibold border border-amber-200/60 dark:border-amber-800/40 shadow-sm">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {t('pendingVerification')}
                </span>
              )}

              <div className="w-full mt-6 space-y-4 text-left border-t border-stone-100 dark:border-stone-800 pt-6 font-sans text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-stone-400" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{t('accountDetails')}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('emailAddress')}</span>
                  <span className="block font-medium text-stone-800 dark:text-stone-200 break-all">{user?.email}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('phoneNumber')}</span>
                  <span className="block font-medium text-stone-800 dark:text-stone-200">{user?.phone}</span>
                </div>
                {user?.fathersName && (
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('fathersNameLabel').replace(' (Optional)', '')}</span>
                    <span className="block font-medium text-stone-800 dark:text-stone-200">{user.fathersName}</span>
                  </div>
                )}
                {user?.marka && (
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">{t('markaLabel').replace(' (Max 5 Letters)', '')}</span>
                    <span className="block font-medium text-stone-800 dark:text-stone-200 uppercase tracking-wider font-semibold">{user.marka}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Session Token Control Box Section */}
            <section className="bg-stone-50 dark:bg-stone-900/40 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-stone-400" />
                <h3 className="font-sans font-semibold text-stone-850 dark:text-stone-200 text-sm uppercase tracking-wider">{t('sessionManagement')}</h3>
              </div>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-1">
                {t('logoutDesc')}
              </p>
              <button 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="h-12 w-full rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-sans font-semibold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? t('signingOut') : t('signOutSecurely')}
              </button>
            </section>
          </div>

          {/* Right Side: Interactive Form Ledger Profile Configurator */}
          <div className="lg:col-span-2">
            <section className="bg-white dark:bg-stone-900 rounded-2xl p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
              <h2 className="font-serif text-2xl text-stone-850 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800/60 pb-4 mb-6">
                {t('editAccountConfig')}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  id="name"
                  label={t('fullName')}
                  error={errors.name?.message}
                  required
                >
                  <Input 
                    id="name" 
                    type="text" 
                    {...register('name')}
                    placeholder={t('fullNamePlaceholder')}
                    disabled={isSaving || isUploading}
                    className="h-12 rounded-xl"
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    id="fathersName"
                    label={t('fathersNameLabel')}
                    error={errors.fathersName?.message}
                  >
                    <Input 
                      id="fathersName" 
                      type="text" 
                      {...register('fathersName')}
                      placeholder={t('fathersNamePlaceholder')}
                      disabled={isSaving || isUploading}
                      className="h-12 rounded-xl"
                      aria-invalid={errors.fathersName ? "true" : "false"}
                      aria-describedby={errors.fathersName ? "fathersName-error" : undefined}
                    />
                  </FormField>
                  <div>
                    <FormField
                      id="marka"
                      label={t('markaLabel')}
                      error={errors.marka?.message}
                    >
                      <Input 
                        id="marka" 
                        type="text" 
                        maxLength={5} 
                        {...register('marka', {
                          onChange: (e) => setValue('marka', e.target.value.toUpperCase())
                        })}
                        placeholder={t('markaPlaceholder')}
                        disabled={isSaving || isUploading}
                        className="h-12 rounded-xl uppercase font-semibold"
                        aria-invalid={errors.marka ? "true" : "false"}
                        aria-describedby={errors.marka ? "marka-error" : undefined}
                      />
                    </FormField>
                    <div className="text-right mt-1 text-xs text-stone-500 dark:text-stone-400 font-sans">
                      {t('markaLength', { length: watchedMarka.length })}
                    </div>
                  </div>
                </div>

                <FormField
                  id="location"
                  label={t('locationLabel')}
                  error={errors.location?.message}
                >
                  <Input 
                    id="location" 
                    type="text" 
                    {...register('location')}
                    placeholder={t('locationPlaceholder')}
                    disabled={isSaving || isUploading}
                    className="h-12 rounded-xl"
                    aria-invalid={errors.location ? "true" : "false"}
                    aria-describedby={errors.location ? "location-error" : undefined}
                  />
                </FormField>

                <ImageCrudField
                  label={t('profileAvatar')}
                  value={watchedProfilePhoto}
                  onUpload={(e) => handleFileUpload(e, 'profilePhoto', watchedProfilePhoto)}
                  isUploading={isUploading}
                  onRemove={() => handleRemovePhoto('profilePhoto', watchedProfilePhoto)}
                  onView={() => { setPreviewUrl(watchedProfilePhoto); setPreviewLabel(t('profileAvatar')); }}
                />

                {/* Identity Verification Sub-Forms Surfaces */}
                <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                  <h3 className="font-serif text-xl text-stone-850 dark:text-stone-100 mb-2">{t('legalVerification')}</h3>
                  <p className="font-sans text-xs text-stone-500 mb-4 pl-1">{t('legalVerificationHelp')}</p>
                  
                  <div className="space-y-4">
                    <ImageCrudField
                      label={t('gstImage')}
                      value={watchedFarmerIdPhoto}
                      onUpload={(e) => handleFileUpload(e, 'farmerIdPhoto', watchedFarmerIdPhoto)}
                      isUploading={isUploading}
                      onRemove={() => handleRemovePhoto('farmerIdPhoto', watchedFarmerIdPhoto)}
                      onView={() => { setPreviewUrl(watchedFarmerIdPhoto); setPreviewLabel(t('gstImage')); }}
                    />

                    <ImageCrudField
                      label={t('aadharImage')}
                      value={watchedAadharCardPhoto}
                      onUpload={(e) => handleFileUpload(e, 'aadharCardPhoto', watchedAadharCardPhoto)}
                      isUploading={isUploading}
                      onRemove={() => handleRemovePhoto('aadharCardPhoto', watchedAadharCardPhoto)}
                      onView={() => { setPreviewUrl(watchedAadharCardPhoto); setPreviewLabel(t('aadharImage')); }}
                    />
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
                        <Loader2 className="animate-spin h-4 w-4 text-white" />
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
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-stone-950 flex items-center justify-center p-6 overflow-hidden min-h-[320px]">
                <img src={previewUrl} alt={previewLabel} className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md" />
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}