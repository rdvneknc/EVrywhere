import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { auth } from '../lib/firebase';
import { ensureUserProfile } from '../api/users';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı.';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Biraz sonra tekrar dene.';
    case 'auth/network-request-failed':
      return 'Ağ hatası. İnternet bağlantını kontrol et.';
    case 'auth/missing-email':
      return 'Önce e-posta adresini yaz.';
    default:
      return 'İşlem başarısız. Tekrar dene.';
  }
}

function throwMapped(e: unknown): never {
  const code =
    e && typeof e === 'object' && 'code' in e
      ? String((e as { code: string }).code)
      : '';
  throw new Error(mapAuthError(code));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
      if (next) {
        void ensureUserProfile(next).catch(() => undefined);
      }
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      emailVerified: Boolean(user?.emailVerified),
      async signIn(email, password) {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (e) {
          throwMapped(e);
        }
      },
      async signUp(email, password, displayName) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password,
          );
          if (displayName?.trim()) {
            await updateProfile(cred.user, {
              displayName: displayName.trim(),
            });
          }
          try {
            await sendEmailVerification(cred.user);
          } catch {
            // Doğrulama maili opsiyonel; kayıt devam eder
          }
        } catch (e) {
          throwMapped(e);
        }
      },
      async logOut() {
        await signOut(auth);
      },
      async resetPassword(email) {
        const trimmed = email.trim();
        if (!trimmed.includes('@')) {
          throw new Error('Geçerli bir e-posta yaz.');
        }
        try {
          await sendPasswordResetEmail(auth, trimmed);
        } catch (e) {
          throwMapped(e);
        }
      },
      async sendVerificationEmail() {
        const current = auth.currentUser;
        if (!current) throw new Error('Giriş gerekli.');
        if (current.emailVerified) {
          throw new Error('E-posta zaten doğrulanmış.');
        }
        try {
          await sendEmailVerification(current);
        } catch (e) {
          throwMapped(e);
        }
      },
      async refreshUser() {
        const current = auth.currentUser;
        if (!current) return false;
        await reload(current);
        setUser(auth.currentUser);
        return Boolean(auth.currentUser?.emailVerified);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
