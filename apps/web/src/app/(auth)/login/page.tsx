'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/store/endpoints/authApi';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { darkMode: isDark, toggleTheme: toggleDarkMode } = useTheme();

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login({ email, password }).unwrap();

      dispatch(setUser(response.data.user));
      // RoleGuard on '/' will detect the state change and redirect to the
      // correct destination: /profile-setup (no name) or /{role}/dashboard
      router.push('/kisan/dashboard');
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col transition-colors duration-300">
      
      {/* Top Header */}
      <header className="w-full p-4 flex justify-between items-center absolute top-0 z-50">
        <div className="font-serif text-2xl font-bold text-green-600 dark:text-green-600 pl-4 md:pl-8 drop-shadow-sm">
          Kropigo
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 mr-4 md:mr-8 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-stone-800 transition-all text-stone-800 dark:text-stone-100 shadow-sm backdrop-blur-sm"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </header>

      {/* Main Split Layout */}
      <main className="flex-grow flex w-full">
        
        {/* Left Side: Agricultural Hero Image (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div className="absolute inset-0 bg-stone-900/40 dark:bg-stone-950/60 z-10"></div>
          <img
            alt="Warm farmer's market with fresh produce"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK_Bvj9Fe1UF15IZG7FYg93hoEFFXofVh54H91rutY0g-nmAw7oAs3XZsCgeNlTVCrCR2tAiuFEVT2FmBhAAnE4Lkmop8kMJzSsmeXHnZgyPWR1k64qBcAW4dbzPKyITfnOTFIvJ5Ddt_MQXysPHAncldDzvbUqY2m94CBurjWIXFJyaX4u5cfCmFJ23KGbwvY9yprec_02Sc95MnJB_8FH7OusrTG04IM0gntHiOBr-Rl1vOhT0SxrvP9jB2V63XA0ZConH4aY3n1"
          />
          <div className="absolute bottom-30 left-12 z-20 max-w-lg text-stone-50">
            <h2 className="font-serif text-5xl mb-4 font-medium drop-shadow-md">Welcome Back</h2>
            <p className="font-sans text-lg text-stone-200 drop-shadow-md leading-relaxed">
              Continue your journey with our local food ecosystem. Good to see you again.
            </p>
          </div>
        </div>

        {/* Right Side: Centered Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 pt-24 md:pt-12">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-stone-800 p-8 flex flex-col gap-6">
            
            <div className="text-center flex flex-col gap-2">
              <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-100">
                Sign In
              </h1>
              <p className="font-sans text-stone-600 dark:text-stone-300">
                Access your Kropigo account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm text-stone-800 dark:text-stone-300 ml-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                  placeholder="jane@example.com"
                  className="h-12 w-full rounded-xl bg-transparent border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-sm text-stone-800 dark:text-stone-300 ml-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                  placeholder="Your password"
                  className="h-12 w-full rounded-xl bg-transparent border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 px-4 font-sans focus:outline-none focus:ring-2 focus:ring-green-800 dark:focus:ring-green-700 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="mt-2 h-12 w-full rounded-xl bg-green-800 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-sans font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-2">
              <p className="font-sans text-sm text-stone-600 dark:text-stone-400">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-green-800 dark:text-green-500 font-medium hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}