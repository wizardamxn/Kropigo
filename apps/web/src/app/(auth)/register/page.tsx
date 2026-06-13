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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('kisan');
  const [error, setError] = useState('');
  const { darkMode: isDark, toggleTheme: toggleDarkMode } = useTheme();

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const tAuth = useTranslations('auth');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await register({ name, email, phone, password, role }).unwrap();
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

            <form onSubmit={handleRegister} className="flex flex-col gap-5">

              {/* Role toggle */}
              <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
                {roles.map((r) => (
                  <label key={r.value} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value)}
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName" className="ml-1 text-stone-800 dark:text-stone-300">
                  {tAuth('fullName')}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isRegistering}
                  required
                  placeholder="Jane Doe"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="ml-1 text-stone-800 dark:text-stone-300">
                  {tAuth('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isRegistering}
                  required
                  placeholder="jane@example.com"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone" className="ml-1 text-stone-800 dark:text-stone-300">
                  {tAuth('phone')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isRegistering}
                  required
                  pattern="[6-9][0-9]{9}"
                  placeholder={tAuth('phonePlaceholder')}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="ml-1 text-stone-800 dark:text-stone-300">
                  {tAuth('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isRegistering}
                  required
                  placeholder={tAuth('passwordPlaceholder')}
                  className="h-12 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors"
              >
                {isRegistering ? tAuth('creatingAccount') : tAuth('createAccount')}
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
