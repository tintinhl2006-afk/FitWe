import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, ThemeColors, ThemeMode } from '../constants/theme';

type ThemePreference = ThemeMode | 'system';

interface ThemeContextType {
  /** Resolved theme actually being rendered ('light' | 'dark'), after applying 'system'. */
  theme: ThemeMode;
  /** Raw user preference, including 'system'. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colors: ThemeColors;
}

const THEME_PREFERENCE_KEY = 'fitwe_theme_preference';

// The web app defaults to dark mode (see src/app/layout.tsx defaultTheme="dark").
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_PREFERENCE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    SecureStore.setItemAsync(THEME_PREFERENCE_KEY, next).catch(() => {});
  }

  const theme: ThemeMode = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      preference,
      setPreference,
      colors: Colors[theme],
    }),
    [theme, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
