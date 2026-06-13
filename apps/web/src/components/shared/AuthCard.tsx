'use client';

import React from 'react';
import Image from 'next/image';

interface AuthCardProps {
  children: React.ReactNode;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

export function AuthCard({
  children,
  heroImage,
  heroTitle,
  heroSubtitle,
  title,
  subtitle,
  headerRight,
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans flex flex-col transition-colors duration-300">
      {/* Top Header */}
      <header className="w-full p-4 flex justify-between items-center absolute top-0 z-50">
        <div className="font-serif text-2xl font-bold text-green-600 dark:text-green-600 pl-4 md:pl-8 drop-shadow-sm select-none">
          Kropigo
        </div>
        {headerRight && (
          <div className="flex items-center gap-3 mr-4 md:mr-8 select-none">
            {headerRight}
          </div>
        )}
      </header>

      {/* Main Split Layout */}
      <main className="flex-grow flex w-full">
        {/* Left: hero image */}
        <div className="hidden md:flex md:w-1/2 relative select-none">
          <div className="absolute inset-0 bg-stone-900/50 dark:bg-stone-950/70 z-10" />
          <Image
            src={heroImage}
            alt="Hero Visual"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-16 md:bottom-24 left-12 z-20 max-w-lg text-stone-50">
            <h2 className="font-serif text-5xl mb-4 font-medium drop-shadow-md">
              {heroTitle}
            </h2>
            <p className="font-sans text-lg text-stone-200 drop-shadow-md leading-relaxed">
              {heroSubtitle}
            </p>
          </div>
        </div>

        {/* Right: form card */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 pt-24 md:pt-12 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-lg dark:shadow-none dark:border dark:border-stone-800 p-8 flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <h1 className="font-serif text-3xl text-stone-800 dark:text-stone-100">
                {title}
              </h1>
              {subtitle && (
                <p className="font-sans text-stone-600 dark:text-stone-300">
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthCard;
