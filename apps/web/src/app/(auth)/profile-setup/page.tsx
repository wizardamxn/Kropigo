'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/store/endpoints/authApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

export default function ProfileSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, hasCompletedProfile, role } = useAuth();
  const t = useTranslations('profileSetup');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (hasCompletedProfile && role) {
      const dest = role === 'buyer' ? '/buyer/marketplace' : `/${role}/dashboard`;
      router.replace(dest);
    }
  }, [isAuthenticated, hasCompletedProfile, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile({ name, role: role!, location }).unwrap();
      dispatch(updateUser({ name, location }));
      const dest = role === 'buyer' ? '/buyer/marketplace' : `/${role}/dashboard`;
      router.push(dest);
    } catch (err: any) {
      setError(err?.data?.message || t('failed'));
    }
  };

  if (!isAuthenticated || hasCompletedProfile) return null;

  const isKisan = role === 'kisan';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col transition-colors duration-300">
      <main className="flex-grow flex w-full">

        {/* Left: hero image */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div className="absolute inset-0 bg-stone-900/50 dark:bg-stone-950/70 z-10" />
          <Image
            src="/LANDINGFARMER.jpeg"
            alt="Fresh agricultural produce"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-16 left-12 z-20 max-w-lg text-stone-50">
            <h2 className="font-serif text-5xl mb-4 font-medium drop-shadow-md">
              {t('heroTitle')}
            </h2>
            <p className="font-sans text-lg text-stone-200 drop-shadow-md leading-relaxed">
              {isKisan ? t('heroSubtitleKisan') : t('heroSubtitleBuyer')}
            </p>
          </div>
        </div>

        {/* Right: form card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-stone-800 p-8 flex flex-col gap-6">

            <div className="text-center flex flex-col gap-2">
              <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-100">
                {t('title')}
              </h1>
              <p className="font-sans text-stone-600 dark:text-stone-300">
                {t('subtitle')}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="ml-1 text-stone-800 dark:text-stone-300">
                  {t('nameLabel')} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t('namePlaceholder')}
                  disabled={isLoading}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location" className="ml-1 text-stone-800 dark:text-stone-300">
                  {t('locationLabel')}
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('locationPlaceholder')}
                  disabled={isLoading}
                  className="h-12 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors"
              >
                {isLoading ? t('saving') : t('submit')}
              </Button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
