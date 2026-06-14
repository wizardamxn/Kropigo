'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useTheme } from '@/components/providers/ThemeProvider';
import {
  Sun,
  Moon,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Quote,
  ChevronDown,
  ArrowRight,
  Sprout,
  Leaf,
  Check,
  Mail,
  MapPin,
  Send,
} from 'lucide-react';

/* Small reusable eyebrow label (leaf + uppercase amber text) */
function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase mb-4 ${
        light ? 'text-amber-300' : 'text-amber-700 dark:text-amber-500'
      }`}
    >
      <Leaf className="w-4 h-4" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const roleHome = role === 'buyer' ? '/buyer/marketplace' : role ? `/${role}/dashboard` : '/';
  const { darkMode: isDark, toggleTheme: toggleDarkMode } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const t = useTranslations('landing');
  const tAuth = useTranslations('auth');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: t('directMarketAccess'),
      desc: t('directMarketDesc'),
      tile: 'bg-linear-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/10 text-green-800 dark:text-green-400',
    },
    {
      icon: BarChart3,
      title: t('liveMandiRates'),
      desc: t('liveMandiDesc'),
      tile: 'bg-linear-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 text-amber-700 dark:text-amber-400',
    },
    {
      icon: ShieldCheck,
      title: t('verifiedNetwork'),
      desc: t('verifiedNetworkDesc'),
      tile: 'bg-linear-to-br from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-900/10 text-sky-700 dark:text-sky-400',
    },
  ];

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ];

  const steps = [
    { n: '1', title: t('step1Title'), desc: t('step1Desc') },
    { n: '2', title: t('step2Title'), desc: t('step2Desc') },
    { n: '3', title: t('step3Title'), desc: t('step3Desc') },
  ];

  const aboutPoints = [t('aboutPoint1'), t('aboutPoint2'), t('aboutPoint3'), t('aboutPoint4')];

  const categories = [
    { img: '/landing/cat-grains.jpg', label: t('catGrains') },
    { img: '/landing/cat-vegetables.jpg', label: t('catVegetables') },
    { img: '/landing/cat-fruits.jpg', label: t('catFruits') },
    { img: '/landing/cat-spices.jpg', label: t('catSpices') },
  ];

  const whyPoints = [
    { icon: TrendingUp, title: t('whyPoint1Title'), desc: t('whyPoint1Desc') },
    { icon: ShieldCheck, title: t('whyPoint2Title'), desc: t('whyPoint2Desc') },
    { icon: BarChart3, title: t('whyPoint3Title'), desc: t('whyPoint3Desc') },
  ];

  const testimonials = [
    { quote: t('testimonial1Quote'), author: t('testimonial1Author'), role: t('testimonial1Role') },
    { quote: t('testimonial2Quote'), author: t('testimonial2Author'), role: t('testimonial2Role') },
    { quote: t('testimonial3Quote'), author: t('testimonial3Author'), role: t('testimonial3Role') },
  ];

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') },
  ];

  const primaryBtn =
    'group h-13 px-7 inline-flex items-center justify-center gap-2 rounded-full bg-green-700 hover:bg-green-600 text-white font-medium transition-all shadow-lg shadow-green-900/20 hover:shadow-green-800/30 transform hover:-translate-y-0.5';

  return (
    <div className="min-h-screen bg-[#f8f4ec] dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans selection:bg-green-800/20 dark:selection:bg-green-500/30 transition-colors duration-300">

      {/* ─── NAVBAR ────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-[#f8f4ec]/85 dark:bg-stone-950/85 backdrop-blur-md border-stone-200/70 dark:border-stone-800/80 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-green-800 dark:text-green-500">
            KropiGo<span className="text-amber-500">.</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 font-medium text-sm">
            {[
              { href: '#about', label: t('aboutUs') },
              { href: '#how-it-works', label: t('howItWorks') },
              { href: '#why', label: t('whyEyebrow') },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  isScrolled
                    ? 'text-stone-600 hover:text-green-800 dark:text-stone-300 dark:hover:text-green-400'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <LanguageSwitcher />

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all ${
                isScrolled
                  ? 'hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
              }`}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <Link
                href={roleHome}
                className="h-10 px-5 flex items-center justify-center rounded-full bg-green-800 hover:bg-green-700 text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                  {tAuth('signIn')}
                </Link>
                <Link
                  href="/register"
                  className="h-10 px-5 flex items-center justify-center rounded-full bg-green-800 hover:bg-green-700 text-white font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t('getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ─── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-[94vh] flex items-center justify-center pt-24 pb-40 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/LANDINGFARMER.jpeg"
              alt="Indian farmer in agricultural field"
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-linear-to-b from-stone-950/70 via-stone-900/55 to-stone-950/90"></div>
            <div className="absolute inset-0 bg-green-950/25 mix-blend-multiply"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-green-500/15 text-green-200 font-medium text-sm tracking-wider uppercase mb-6 backdrop-blur-sm border border-green-400/25">
              <Leaf className="w-4 h-4" /> {t('tagline')}
            </span>
            <h1 className="text-white mb-6 drop-shadow-lg">
              <span className="block font-serif text-4xl md:text-6xl font-medium tracking-tight leading-tight">
                {t('heroTitle')}
              </span>
              <span className="block font-script text-6xl md:text-8xl lg:text-9xl text-green-300 leading-[1.1]">
                {t('heroTitleAccent')}
              </span>
            </h1>
            <p className="font-sans text-lg md:text-xl text-stone-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
              {t('heroDescription')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href={roleHome} className={`${primaryBtn} text-lg h-14 px-8 w-full sm:w-auto`}>
                  {t('enterApp')}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <>
                  <Link href="/register" className={`${primaryBtn} text-lg h-14 px-8 w-full sm:w-auto`}>
                    {t('joinMarketplace')}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/buyer/marketplace"
                    className="h-14 px-8 w-full sm:w-auto flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-lg backdrop-blur-md border border-white/15 transition-all"
                  >
                    {t('browseCrops')}
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3 text-stone-300">
              <div className="flex -space-x-2">
                {['from-green-400 to-green-600', 'from-amber-400 to-amber-600', 'from-sky-400 to-sky-600', 'from-rose-400 to-rose-600'].map(
                  (g, i) => (
                    <span key={i} className={`w-8 h-8 rounded-full bg-linear-to-br ${g} ring-2 ring-stone-900/40`} />
                  ),
                )}
              </div>
              <span className="text-sm font-medium">{t('heroTrust')}</span>
            </div>
          </div>

          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1 text-white/60">
            <span className="text-xs uppercase tracking-widest">{t('scrollCue')}</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </section>

        {/* ─── FEATURE CARDS (overlap hero) ──────────────────────────────────── */}
        <section className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 -mt-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200/70 dark:border-stone-800/80 shadow-xl shadow-stone-900/5 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.tile}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-2xl text-stone-800 dark:text-stone-100 mb-3">{f.title}</h3>
                  <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed text-[15px]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── ABOUT ─────────────────────────────────────────────────────────── */}
        <section id="about" className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Images */}
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="relative aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <Image src="/landing/about-main.jpg" alt="Farmers shaking hands in a wheat field" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
                <div className="absolute -bottom-8 -right-3 md:-right-8 w-40 h-40 md:w-56 md:h-56 rounded-[2rem] overflow-hidden ring-8 ring-[#f8f4ec] dark:ring-stone-950 shadow-xl">
                  <Image src="/landing/about-detail.jpg" alt="Hands holding fresh soil and a seedling" fill className="object-cover" sizes="220px" />
                </div>
                <div className="absolute -top-5 -left-4 md:-left-6 bg-green-700 text-white rounded-3xl px-6 py-4 shadow-xl shadow-green-900/30">
                  <p className="font-script text-4xl leading-none">0%</p>
                  <p className="font-sans text-xs tracking-wide mt-1 text-green-100">Commission</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="w-full lg:w-1/2">
              <Eyebrow>{t('aboutEyebrow')}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-5 leading-tight">{t('aboutTitle')}</h2>
              <p className="font-serif text-xl text-green-700 dark:text-green-500 italic mb-5">{t('aboutHighlight')}</p>
              <p className="font-sans text-lg text-stone-600 dark:text-stone-400 leading-relaxed mb-8">{t('aboutDesc')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {aboutPoints.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </span>
                    <span className="font-sans font-medium text-stone-700 dark:text-stone-200">{p}</span>
                  </div>
                ))}
              </div>

              <Link href={isAuthenticated ? roleHome : '/register'} className={`${primaryBtn} text-base`}>
                {t('aboutCta')}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-white dark:bg-stone-900/40 border-y border-stone-200/70 dark:border-stone-800/80">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
              <Eyebrow>{t('howItWorks')}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">{t('howItWorks')}</h2>
              <p className="font-sans text-lg text-stone-600 dark:text-stone-400">{t('howItWorksSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="relative bg-[#f8f4ec] dark:bg-stone-950 rounded-3xl p-8 pt-12 border border-stone-200/70 dark:border-stone-800/80 text-center">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-green-700 text-white flex items-center justify-center font-script text-3xl shadow-lg shadow-green-900/30">
                    {s.n}
                  </div>
                  <h4 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-2">{s.title}</h4>
                  <p className="font-sans text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CATEGORIES ────────────────────────────────────────────────────── */}
        <section id="categories" className="py-24 md:py-28 max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center">
            <Eyebrow>{t('categoriesEyebrow')}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">{t('categoriesTitle')}</h2>
            <p className="font-sans text-lg text-stone-600 dark:text-stone-400">{t('categoriesSubtitle')}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {categories.map((c, i) => (
              <Link
                key={i}
                href="/buyer/marketplace"
                className="group relative aspect-4/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
              >
                <Image
                  src={c.img}
                  alt={c.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-stone-950/85 via-stone-950/15 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 p-5 flex items-center justify-between gap-2">
                  <span className="font-serif text-lg md:text-xl text-white leading-tight">{c.label}</span>
                  <span className="w-9 h-9 shrink-0 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center transition-colors group-hover:bg-green-600">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/buyer/marketplace" className={`${primaryBtn} text-base`}>
              {t('categoriesCta')}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* ─── STATS BAND (over photo) ───────────────────────────────────────── */}
        <section className="relative py-28 overflow-hidden">
          <Image src="/landing/stats-bg.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-green-950/85"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 text-center text-white">
            <div className="flex flex-col items-center">
              <Eyebrow light>{t('statsBandEyebrow')}</Eyebrow>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium max-w-3xl mx-auto leading-tight mb-16">
              {t('statsBandTitle')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:divide-x divide-white/15">
              {stats.map((s, i) => (
                <div key={i} className="px-4">
                  <p className="font-script text-5xl md:text-6xl text-amber-300 leading-none">{s.value}</p>
                  <p className="mt-3 font-sans text-sm text-green-100/80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY CHOOSE ────────────────────────────────────────────────────── */}
        <section id="why" className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Image + badge */}
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="relative">
                <div className="relative aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <Image src="/landing/why-choose.jpg" alt="Rows of healthy crops at sunrise" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-linear-to-t from-green-950/40 to-transparent"></div>
                </div>
                <div className="absolute bottom-6 -right-3 md:-right-6 bg-amber-400 text-green-950 rounded-3xl px-6 py-5 shadow-xl max-w-[14rem]">
                  <Sprout className="w-7 h-7 mb-2" />
                  <p className="font-serif text-lg font-semibold leading-tight">{t('whyBadge')}</p>
                </div>
              </div>
            </div>

            {/* Text + points */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <Eyebrow>{t('whyEyebrow')}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-8 leading-tight">{t('whyTitle')}</h2>

              <div className="space-y-6 mb-10">
                {whyPoints.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div key={i} className="flex gap-5">
                      <span className="w-12 h-12 shrink-0 rounded-2xl bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </span>
                      <div>
                        <h3 className="font-serif text-xl text-stone-800 dark:text-stone-100 mb-1">{p.title}</h3>
                        <p className="font-sans text-stone-600 dark:text-stone-400 leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href={isAuthenticated ? roleHome : '/register'} className={`${primaryBtn} text-base`}>
                {t('getStarted')}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <section className="py-24 bg-white dark:bg-stone-900/40 border-y border-stone-200/70 dark:border-stone-800/80">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
              <Eyebrow>{t('testimonialsEyebrow')}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">{t('testimonialsTitle')}</h2>
              <p className="font-sans text-lg text-stone-600 dark:text-stone-400">{t('testimonialsSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((tm, i) => (
                <div
                  key={i}
                  className="relative bg-[#f8f4ec] dark:bg-stone-900 rounded-3xl p-8 border border-stone-200/70 dark:border-stone-800/80 shadow-sm flex flex-col"
                >
                  <Quote className="w-9 h-9 text-amber-500/50 mb-4" />
                  <p className="font-serif text-lg italic text-stone-700 dark:text-stone-200 leading-relaxed flex-1">{tm.quote}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-linear-to-br from-green-600 to-green-800 text-white flex items-center justify-center font-serif text-lg font-bold">
                      {tm.author.charAt(0)}
                    </span>
                    <div>
                      <p className="font-sans font-semibold text-stone-800 dark:text-stone-100">{tm.author}</p>
                      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">{tm.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="py-24 md:py-28 max-w-3xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12 flex flex-col items-center">
            <Eyebrow>{t('faqEyebrow')}</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl text-stone-800 dark:text-stone-100 mb-4">{t('faqTitle')}</h2>
            <p className="font-sans text-lg text-stone-600 dark:text-stone-400">{t('faqSubtitle')}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800/80 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 font-serif text-lg text-stone-800 dark:text-stone-100"
                  >
                    <span>{f.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 text-green-700 dark:text-green-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 -mt-1 font-sans text-stone-600 dark:text-stone-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="pb-24 px-6 md:px-12">
          <div className="relative max-w-5xl mx-auto rounded-4xl bg-linear-to-br from-green-800 to-green-950 dark:from-green-900 dark:to-stone-950 p-12 md:p-16 text-center text-white shadow-2xl shadow-green-950/30 overflow-hidden">
            <Sprout className="absolute -top-6 -right-6 w-40 h-40 text-white/5 rotate-12" />
            <Sprout className="absolute -bottom-10 -left-8 w-44 h-44 text-white/5 -rotate-12" />
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4 tracking-tight">{t('ctaTitle')}</h2>
              <p className="font-sans text-lg text-green-100/90 max-w-2xl mx-auto mb-10">{t('ctaSubtitle')}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <Link
                    href={roleHome}
                    className="group h-14 px-8 w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white text-green-900 hover:bg-green-50 font-semibold text-lg transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    {t('enterApp')}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="group h-14 px-8 w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white text-green-900 hover:bg-green-50 font-semibold text-lg transition-all shadow-lg transform hover:-translate-y-1"
                    >
                      {t('joinMarketplace')}
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href="/buyer/marketplace"
                      className="h-14 px-8 w-full sm:w-auto flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-lg backdrop-blur-md border border-white/20 transition-all"
                    >
                      {t('browseCrops')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 dark:bg-black text-stone-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-stone-800">
            {/* Brand */}
            <div className="lg:col-span-4">
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                KropiGo<span className="text-amber-500">.</span>
              </span>
              <p className="font-sans text-sm leading-relaxed mt-4 max-w-xs">{t('footerTagline')}</p>
              <div className="mt-6 space-y-2 text-sm">
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-green-500" /> {t('footerEmail')}</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-green-500" /> {t('footerLocation')}</p>
              </div>
            </div>

            {/* Explore */}
            <div className="lg:col-span-2">
              <h4 className="font-serif text-white text-lg mb-4">{t('footerExplore')}</h4>
              <ul className="space-y-3 font-sans text-sm">
                <li><Link href="/buyer/marketplace" className="hover:text-white transition-colors">{t('footerMarketplace')}</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('footerHowItWorks')}</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">{t('aboutUs')}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h4 className="font-serif text-white text-lg mb-4">{t('footerLegal')}</h4>
              <ul className="space-y-3 font-sans text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t('termsOfService')}</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-4">
              <h4 className="font-serif text-white text-lg mb-2">{t('newsletterTitle')}</h4>
              <p className="font-sans text-sm mb-4">{t('newsletterDesc')}</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder={t('newsletterPlaceholder')}
                  aria-label={t('newsletterPlaceholder')}
                  className="flex-1 min-w-0 h-11 px-4 rounded-full bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-green-600"
                />
                <button
                  type="submit"
                  aria-label={t('newsletterCta')}
                  className="h-11 px-4 shrink-0 rounded-full bg-green-700 hover:bg-green-600 text-white flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('newsletterCta')}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-3 font-sans text-sm">
            <span>{t('copyright', { year: new Date().getFullYear() })}</span>
            <span className="flex items-center gap-1.5 text-stone-500">
              <Leaf className="w-4 h-4 text-green-600" /> {t('tagline')}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
