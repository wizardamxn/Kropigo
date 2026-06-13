'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-all duration-200 active:scale-95 shadow-sm border border-stone-200 dark:border-stone-800/80 flex items-center justify-center min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-800 dark:focus-visible:ring-green-700 focus:outline-none"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 animate-in spin-in duration-300" />
      ) : (
        <Moon className="w-5 h-5 animate-in spin-in duration-300" />
      )}
    </button>
  );
}

export default ThemeToggle;
