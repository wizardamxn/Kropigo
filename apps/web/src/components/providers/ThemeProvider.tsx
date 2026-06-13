'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { setTheme, resolvedTheme } = useNextTheme();

  const darkMode = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const setDarkMode = (val: boolean) => {
    setTheme(val ? 'dark' : 'light');
  };

  return {
    darkMode,
    toggleTheme,
    setDarkMode,
  };
}
