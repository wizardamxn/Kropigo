import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'kropigo.theme-preference';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // nativewind's useColorScheme() returns a new setColorScheme reference on
  // every render, so it can't be an effect dependency without looping forever
  // (effect fires -> setColorScheme -> re-render -> new reference -> effect fires...).
  // This must only run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const value = stored === 'light' || stored === 'dark' ? stored : 'system';
      setPreferenceState(value);
      setColorScheme(value);
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    setPreference: (next) => {
      setPreferenceState(next);
      setColorScheme(next);
      void AsyncStorage.setItem(STORAGE_KEY, next);
    },
  }), [preference, setColorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemeProvider');
  return ctx;
}
