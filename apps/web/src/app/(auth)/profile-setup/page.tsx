'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/store/endpoints/authApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField } from '@/components/shared/FormField';
import { AuthCard } from '@/components/shared/AuthCard';
import { Loader2 } from 'lucide-react';

const profileSetupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
});

type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, hasCompletedProfile, role } = useAuth();
  const t = useTranslations('profileSetup');

  const [error, setError] = useState('');

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: '',
      location: '',
    },
    mode: 'onTouched',
  });

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

  const onSubmit = async (data: ProfileSetupInput) => {
    setError('');
    try {
      await updateProfile({ name: data.name, role: role!, location: data.location }).unwrap();
      dispatch(updateUser({ name: data.name, location: data.location }));
      const dest = role === 'buyer' ? '/buyer/marketplace' : `/${role}/dashboard`;
      router.push(dest);
    } catch (err: any) {
      setError(err?.data?.message || t('failed'));
    }
  };

  if (!isAuthenticated || hasCompletedProfile) return null;

  const isKisan = role === 'kisan';

  return (
    <AuthCard
      heroImage="/LANDINGFARMER.jpeg"
      heroTitle={t('heroTitle')}
      heroSubtitle={isKisan ? t('heroSubtitleKisan') : t('heroSubtitleBuyer')}
      title={t('title')}
      subtitle={t('subtitle')}
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          id="name"
          label={t('nameLabel')}
          error={errors.name?.message}
          required
        >
          <Input
            id="name"
            type="text"
            {...register('name')}
            placeholder={t('namePlaceholder')}
            disabled={isLoading}
            className="h-12 rounded-xl"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </FormField>

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
            disabled={isLoading}
            className="h-12 rounded-xl"
            aria-invalid={errors.location ? "true" : "false"}
            aria-describedby={errors.location ? "location-error" : undefined}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('saving')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
