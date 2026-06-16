'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Leaf, Sprout, ArrowRight } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function GoLivePage() {
  const [isLaunched, setIsLaunched] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/launch-status`);
      const json = await res.json();
      setIsLaunched(json?.data?.isLaunched ?? false);
    } catch {
      setIsLaunched(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/launch`, { method: 'POST' });
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/launch`, { method: 'DELETE' });
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden bg-stone-950"
      style={{ minHeight: '100dvh' }}
    >
      {/* Farmer hero photo + green wash */}
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
          <Leaf className="w-4 h-4" /> Launch Control
        </span>

        <h1 className="text-white mb-6 drop-shadow-lg">
          <span className="block font-serif text-5xl md:text-7xl font-bold tracking-tight">
            KropiGo<span className="text-amber-400">.</span>
          </span>
        </h1>

        <p className="font-sans text-lg text-stone-200 max-w-md mx-auto leading-relaxed drop-shadow mb-12">
          {isLaunched
            ? 'The marketplace is live to the world.'
            : 'When you press this, KropiGo opens to everyone.'}
        </p>

        {/* Action area */}
        {isLaunched === null && (
          <p className="text-stone-300 text-sm animate-pulse">Checking status…</p>
        )}

        {isLaunched === false && (
          <button
            onClick={handleLaunch}
            disabled={loading}
            className="group h-16 px-10 inline-flex items-center justify-center gap-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold text-xl transition-all shadow-lg shadow-green-900/40 hover:shadow-green-800/50 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Going live…</span>
              </>
            ) : (
              <>
                <Sprout className="w-6 h-6" />
                <span>Go Live</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        )}

        {isLaunched === true && (
          <div className="flex flex-col items-center gap-7">
            <span className="font-script text-5xl md:text-6xl text-green-300 leading-none drop-shadow">
              we&apos;re live!
            </span>
            <button
              onClick={handleReset}
              disabled={loading}
              className="h-10 px-5 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-medium text-sm backdrop-blur-md border border-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting…' : 'Reset (testing only)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
