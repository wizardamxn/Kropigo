'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useRegisterMutation } from '@/store/endpoints/authApi';
import { useTheme } from '@/components/providers/ThemeProvider';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField } from '@/components/shared/FormField';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { AuthCard } from '@/components/shared/AuthCard';
import { Loader2, Sun, Moon } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["kisan", "buyer", "driver", "admin"]),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const { darkMode: isDark, toggleTheme: toggleDarkMode } = useTheme();

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [registerApi, { isLoading: isRegistering }] = useRegisterMutation();
  const tAuth = useTranslations('auth');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'kisan',
    },
    mode: 'onTouched',
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    setError('');
    try {
      const response = await registerApi(data).unwrap();
      dispatch(setUser(response.data.user));

      const userRole = response.data.user?.role;
      if (userRole === 'buyer') {
        router.push('/buyer/profile?registered=true');
      } else if (userRole === 'kisan') {
        router.push('/kisan/profile?registered=true');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.data?.message || tAuth('failedToRegister'));
    }
  };

  const roles = [
    { value: 'kisan', label: tAuth('farmer') },
    { value: 'buyer', label: tAuth('buyer') },
  ];

  return (
    <AuthCard
      heroImage="/LANDINGFARMER.jpeg"
      heroTitle={tAuth('rootedInCommunity')}
      heroSubtitle={tAuth('rootedInCommunitySubtitle')}
      title={tAuth('joinMarketplace')}
      subtitle={tAuth('joinMarketplaceSubtitle')}
      headerRight={
        <>
          <LanguageSwitcher />
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-stone-800 transition-all text-stone-800 dark:text-stone-100 shadow-sm backdrop-blur-sm"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </>
      }
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Role toggle — fixed focus-visible ring */}
        <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
          {roles.map((r) => (
            <label key={r.value} className="flex-1 cursor-pointer">
              <input
                type="radio"
                value={r.value}
                {...register('role')}
                className="peer sr-only"
                disabled={isRegistering}
              />
              <div className={`text-center py-2.5 rounded-lg font-sans text-sm font-medium transition-all
                              peer-checked:bg-white dark:peer-checked:bg-stone-800 peer-checked:text-green-800 dark:peer-checked:text-green-500 peer-checked:shadow-sm
                              peer-focus-visible:ring-2 peer-focus-visible:ring-green-800 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-green-500
                              text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200`}>
                {r.label}
              </div>
            </label>
          ))}
        </div>

        <FormField
          id="fullName"
          label={tAuth('fullName')}
          error={errors.name?.message}
          required
        >
          <Input
            id="fullName"
            type="text"
            {...register('name')}
            disabled={isRegistering}
            placeholder="Jane Doe"
            className="h-12 rounded-xl"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "fullName-error" : undefined}
          />
        </FormField>

        <FormField
          id="email"
          label={tAuth('email')}
          error={errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={isRegistering}
            placeholder="jane@example.com"
            className="h-12 rounded-xl"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </FormField>

        <FormField
          id="phone"
          label={tAuth('phone')}
          error={errors.phone?.message}
          required
        >
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            disabled={isRegistering}
            placeholder={tAuth('phonePlaceholder')}
            className="h-12 rounded-xl"
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
        </FormField>

        <FormField
          id="password"
          label={tAuth('password')}
          error={errors.password?.message}
          required
        >
          <PasswordInput
            id="password"
            {...register('password')}
            disabled={isRegistering}
            placeholder={tAuth('passwordPlaceholder')}
            className="h-12 rounded-xl"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isRegistering}
          aria-busy={isRegistering}
          className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {tAuth('creatingAccount')}
            </>
          ) : (
            tAuth('createAccount')
          )}
        </Button>
      </form>

      <div className="text-center mt-2">
        <p className="font-sans text-sm text-stone-600 dark:text-stone-400">
          {tAuth('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-green-800 dark:text-green-500 font-medium hover:underline">
            {tAuth('signIn')}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
