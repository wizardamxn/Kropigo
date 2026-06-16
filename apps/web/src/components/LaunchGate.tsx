'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { API_URL } from '@/lib/config';

export function LaunchGate() {
  const pathname = usePathname();
  const [isLaunched, setIsLaunched] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLaunchPage = pathname?.startsWith('/go-live-2025');

  useEffect(() => {
    if (isLaunchPage) return;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/launch-status`);
        const json = await res.json();
        const launched: boolean = json?.data?.isLaunched ?? false;
        setIsLaunched(launched);
        if (launched && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch {
        // keep overlay up on network errors
      }
    };

    check();
    intervalRef.current = setInterval(check, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLaunchPage]);

  if (isLaunchPage || isLaunched === true) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden">
      {/* Farmer hero photo + green wash, matching the landing hero */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/LANDINGFARMER.jpeg"
          alt="Indian farmer in agricultural field"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-stone-950/75 via-stone-900/60 to-stone-950/90" />
        <div className="absolute inset-0 bg-green-950/30 mix-blend-multiply" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-green-500/15 text-green-200 font-medium text-sm tracking-wider uppercase mb-8 backdrop-blur-sm border border-green-400/25">
          <Leaf className="w-4 h-4" /> Launching Soon
        </span>

        <h1 className="text-white mb-6 drop-shadow-lg">
          <span className="block font-serif text-5xl md:text-7xl font-bold tracking-tight">
            KropiGo<span className="text-amber-400">.</span>
          </span>
          <span className="block font-script text-4xl md:text-6xl text-green-300 leading-[1.1] mt-2">
            growing soon
          </span>
        </h1>

        <p className="font-sans text-lg text-stone-200 max-w-md mx-auto leading-relaxed drop-shadow">
          India&apos;s direct farm-to-buyer marketplace is almost ready. Check back shortly.
        </p>

        <div className="mt-10 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-green-400/70"
              style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
