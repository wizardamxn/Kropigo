'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { Loader2 } from 'lucide-react';

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
        router.push('/buyer/marketplace');
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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col transition-colors duration-300">

      {/* Top Header */}
      <header className="w-full p-4 flex justify-between items-center absolute top-0 z-50">
        <div className="font-serif text-2xl font-bold text-green-600 dark:text-green-600 pl-4 md:pl-8 drop-shadow-lg">
          Kropigo
        </div>
        <div className="flex items-center gap-3 mr-4 md:mr-8">
          <LanguageSwitcher />
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-stone-800 transition-all text-stone-800 dark:text-stone-100 shadow-sm backdrop-blur-sm"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-grow flex w-full">

        {/* Left: hero image */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div className="absolute inset-0 bg-stone-900/40 dark:bg-stone-950/60 z-10" />
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK_Bvj9Fe1UF15IZG7FYg93hoEFFXofVh54H91rutY0g-nmAw7oAs3XZsCgeNlTVCrCR2tAiuFEVT2FmBhAAnE4Lkmop8kMJzSsmeXHnZgyPWR1k64qBcAW4dbzPKyITfnOTFIvJ5Ddt_MQXysPHAncldDzvbUqY2m94CBurjWIXFJyaX4u5cfCmFJ23KGbwvY9yprec_02Sc95MnJB_8FH7OusrTG04IM0gntHiOBr-Rl1vOhT0SxrvP9jB2V63XA0ZConH4aY3n1"
            alt="Warm farmer's market with fresh produce"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-30 left-12 z-20 max-w-lg text-stone-50">
            <h2 className="font-serif text-5xl mb-4 font-medium drop-shadow-md">{tAuth('rootedInCommunity')}</h2>
            <p className="font-sans text-lg text-stone-200 drop-shadow-md leading-relaxed">
              {tAuth('rootedInCommunitySubtitle')}
            </p>
          </div>
        </div>

        {/* Right: form card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-stone-800 p-8 flex flex-col gap-6">

            <div className="text-center flex flex-col gap-2">
              <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-100">
                {tAuth('joinMarketplace')}
              </h1>
              <p className="font-sans text-stone-600 dark:text-stone-300">
                {tAuth('joinMarketplaceSubtitle')}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

              {/* Role toggle */}
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
                    <div className="text-center py-2.5 rounded-lg font-sans text-sm font-medium transition-all
                                    peer-checked:bg-white dark:peer-checked:bg-stone-800 peer-checked:text-green-800 dark:peer-checked:text-green-500 peer-checked:shadow-sm
                                    text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
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

          </div>
        </div>
      </main>
    </div>
  );
}
