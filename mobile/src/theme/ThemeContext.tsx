import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkColors,
  LightColors,
  type EVColorPalette,
} from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  /** Kullanıcı tercihi */
  preference: ThemeMode;
  /** Uygulanan gerçek tema */
  resolved: 'light' | 'dark';
  colors: EVColorPalette;
  setPreference: (mode: ThemeMode) => void;
  toggleDark: () => void;
};

const STORAGE_KEY = 'ev-mobile-theme-v1';

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readStoredPreference(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readStoredPreference().then((mode) => {
      setPreferenceState(mode);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => undefined);
  }, [preference, ready]);

  const resolved: 'light' | 'dark' =
    preference === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const colors = useMemo(
    () => (resolved === 'dark' ? { ...DarkColors } : { ...LightColors }),
    [resolved],
  );

  const setPreference = useCallback((mode: ThemeMode) => {
    setPreferenceState(mode);
  }, []);

  const toggleDark = useCallback(() => {
    setPreferenceState((prev) => {
      if (prev === 'dark') return 'light';
      return 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      colors,
      setPreference,
      toggleDark,
    }),
    [preference, resolved, colors, setPreference, toggleDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme ThemeProvider içinde kullanılmalı');
  }
  return ctx;
}
