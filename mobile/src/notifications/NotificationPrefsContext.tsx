import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotificationPrefsValue = {
  /** Uygulama içi bildirim listesi + rozet */
  inAppEnabled: boolean;
  setInAppEnabled: (enabled: boolean) => void;
  ready: boolean;
};

const STORAGE_KEY = 'ev-mobile-inapp-notifs-v1';

const NotificationPrefsContext =
  createContext<NotificationPrefsValue | null>(null);

export function NotificationPrefsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [inAppEnabled, setInAppEnabledState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === '0' || stored === 'off' || stored === 'false') {
          setInAppEnabledState(false);
        } else {
          setInAppEnabledState(true);
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      STORAGE_KEY,
      inAppEnabled ? '1' : '0',
    ).catch(() => undefined);
  }, [inAppEnabled, ready]);

  const setInAppEnabled = useCallback((enabled: boolean) => {
    setInAppEnabledState(enabled);
  }, []);

  const value = useMemo(
    () => ({
      inAppEnabled,
      setInAppEnabled,
      ready,
    }),
    [inAppEnabled, setInAppEnabled, ready],
  );

  return (
    <NotificationPrefsContext.Provider value={value}>
      {children}
    </NotificationPrefsContext.Provider>
  );
}

export function useNotificationPrefs() {
  const ctx = useContext(NotificationPrefsContext);
  if (!ctx) {
    throw new Error(
      'useNotificationPrefs NotificationPrefsProvider içinde kullanılmalı',
    );
  }
  return ctx;
}
