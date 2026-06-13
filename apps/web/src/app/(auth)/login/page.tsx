'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/endpoints/authApi';
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

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const { darkMode: isDark, toggleTheme: toggleDarkMode } = useTheme();

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const tAuth = useTranslations('auth');

  const redirectParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect')
    : null;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginInput) => {
    setError('');
    try {
      const response = await login(data).unwrap();
      dispatch(setUser(response.data.user));

      const userRole = response.data.user?.role;

      if (redirectParam) {
        router.push(redirectParam);
        return;
      }

      if (userRole === 'buyer') {
        router.push('/buyer/marketplace');
      } else {
        router.push('/kisan/dashboard');
      }
    } catch (err: any) {
      setError(err?.data?.message || tAuth('invalidCredentials'));
    }
  };

  return (
    <AuthCard
      heroImage="/LANDINGFARMER.jpeg"
      heroTitle={tAuth('welcomeBack')}
      heroSubtitle={tAuth('welcomeBackSubtitle')}
      title={tAuth('signIn')}
      subtitle={tAuth('signInSubtitle')}
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
            disabled={isLoggingIn}
            placeholder="jane@example.com"
            className="h-12 rounded-xl"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
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
            disabled={isLoggingIn}
            placeholder="Your password"
            className="h-12 rounded-xl"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </FormField>

        <Button
          type="submit"
          disabled={isLoggingIn}
          aria-busy={isLoggingIn}
          className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {tAuth('signingIn')}
            </>
          ) : (
            tAuth('signIn')
          )}
        </Button>
      </form>

      <div className="text-center mt-2">
        <p className="font-sans text-sm text-stone-600 dark:text-stone-400">
          {tAuth('noAccount')}{' '}
          <Link href="/register" className="text-green-800 dark:text-green-500 font-medium hover:underline">
            {tAuth('createAccount')}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
