'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle dark mode initialization
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
    
    // Add scroll listener for navbar blur effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans selection:bg-green-800/20 dark:selection:bg-green-500/30 transition-colors duration-300">
      
      {/* ─── NAVBAR ────────────────────────────────────────────────────────── */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-stone-200 dark:border-stone-800 py-3 shadow-sm' 
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-green-800 dark:text-green-500">
            Kropigo<span className="text-stone-400 dark:text-stone-600">.</span>
          </Link>

          <nav className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all ${
                isScrolled 
                  ? 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
              }`}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {isAuthenticated ? (
              <Link 
                href={`/${role}/dashboard`}
                className="h-10 px-5 flex items-center justify-center rounded-xl bg-green-800 hover:bg-green-700 text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login"
                  className={`font-medium transition-colors hidden sm:block ${
                    isScrolled 
                      ? 'text-stone-600 hover:text-green-800 dark:text-stone-300 dark:hover:text-green-400' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="h-10 px-5 flex items-center justify-center rounded-xl bg-green-800 hover:bg-green-700 text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2940&auto=format&fit=crop" 
              alt="Beautiful sunlit agricultural field" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-stone-900/60 dark:bg-stone-950/80 mix-blend-multiply"></div>
            {/* Gradient fade to match background at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-50 dark:from-stone-950 to-transparent"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-block py-1 px-3 rounded-full bg-green-500/20 text-green-300 font-medium text-sm tracking-wider uppercase mb-6 backdrop-blur-sm border border-green-500/30">
              Kisan se Seedha Vyapar — Bina Rukawat, Bina Bicholiya.
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-medium tracking-tight mb-6 drop-shadow-lg leading-tight">
              Rooted in trust. <br/> <span className="text-green-400 italic">Growing together.</span>
            </h1>
            <p className="font-sans text-lg md:text-xl text-stone-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
              Kropigo is the premier digital marketplace connecting dedicated farmers directly with mindful buyers. Transparent pricing, verified networks, and zero middlemen.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link 
                  href={`/${role}/dashboard`}
                  className="h-14 px-8 w-full sm:w-auto flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-lg transition-all shadow-xl hover:shadow-green-900/20 transform hover:-translate-y-1"
                >
                  Enter Application
                </Link>
              ) : (
                <>
                  <Link 
                    href="/register"
                    className="h-14 px-8 w-full sm:w-auto flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-lg transition-all shadow-xl hover:shadow-green-900/20 transform hover:-translate-y-1"
                  >
                    Join the Marketplace
                  </Link>
                  <Link 
                    href="#how-it-works"
                    className="h-14 px-8 w-full sm:w-auto flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-lg backdrop-blur-md border border-white/20 transition-all"
                  >
                    See How It Works
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ─── PLATFORM FEATURES ─────────────────────────────────────────────── */}
        <section className="py-24 max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">Empowering Local Trade</h2>
            <p className="font-sans text-lg text-stone-600 dark:text-stone-400">Everything you need to buy and sell produce confidently, built specifically for the modern agricultural economy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="font-serif text-2xl text-stone-800 dark:text-stone-100 mb-3">Direct Market Access</h3>
              <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed">
                List crops directly on the platform and bypass traditional middlemen. Keep more of your profits while offering buyers fresher produce.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="font-serif text-2xl text-stone-800 dark:text-stone-100 mb-3">Live Mandi Rates</h3>
              <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed">
                Make informed decisions with real-time pricing insights from local Mandis. Never guess the true value of your harvest again.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="font-serif text-2xl text-stone-800 dark:text-stone-100 mb-3">Verified Network</h3>
              <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed">
                Trade with confidence. Every Kisan and Buyer undergoes identity verification to ensure a secure, trustworthy ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-stone-100 dark:bg-stone-900/50 border-y border-stone-200 dark:border-stone-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              
              {/* Image Side */}
              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/LANDINGFARMER.jpeg" 
                    alt="Farmer holding fresh harvest" 
                    className="w-full h-full object-cover"
                    width={500}
                    height={500}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <p className="font-serif text-2xl font-medium mb-2">"Kropigo changed how I sell."</p>
                    <p className="font-sans text-stone-300 text-sm opacity-90">— A verified Kropigo Farmer</p>
                  </div>
                </div>
              </div>

              {/* Steps Side */}
              <div className="w-full lg:w-1/2 space-y-12">
                <div>
                  <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">How It Works</h2>
                  <p className="font-sans text-lg text-stone-600 dark:text-stone-400">Three simple steps to revolutionize your agricultural trade.</p>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-300 dark:before:via-stone-700 before:to-transparent">
                  
                  {/* Step 1 */}
                  <div className="relative flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-green-800 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md z-10">1</div>
                    <div className="flex-1 bg-white dark:bg-stone-950 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <h4 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-2">Create an Account</h4>
                      <p className="font-sans text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Register as either a Kisan (Farmer) or a Buyer. Setup takes less than two minutes with basic contact details.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-green-800 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md z-10">2</div>
                    <div className="flex-1 bg-white dark:bg-stone-950 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <h4 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-2">Verify Your Profile</h4>
                      <p className="font-sans text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Complete a quick verification process to unlock full platform features and build trust within the community.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-green-800 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md z-10">3</div>
                    <div className="flex-1 bg-white dark:bg-stone-950 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                      <h4 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-2">Trade Directly</h4>
                      <p className="font-sans text-stone-600 dark:text-stone-400 text-sm leading-relaxed">Start listing your harvest with photos and pricing, or browse available crops to purchase directly from the source.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 dark:bg-black text-stone-400 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              Kropigo<span className="text-green-500">.</span>
            </span>
          </div>
          
          <div className="flex gap-6 font-sans text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>

          <div className="font-sans text-sm">
            &copy; {new Date().getFullYear()} Kropigo. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}