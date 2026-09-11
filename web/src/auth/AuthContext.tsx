import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { auth } from '../lib/firebase';
import { ensureUserProfile } from '../api/users';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  changeEmail: (newEmail: string, password: string) => Promise<void>;
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
    case 'auth/unauthorized-domain':
      return 'Bu domain Auth için yetkili değil (Console’da ekle).';
    case 'auth/requires-recent-login':
      return 'Güvenlik için şifreni tekrar gir.';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
      if (next) void ensureUserProfile(next).catch(() => undefined);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        try {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (e) {
          throwMapped(e);
        }
      },
      async signUp(email, password, name) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password,
          );
          if (name?.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
          }
          try {
            await sendEmailVerification(cred.user);
          } catch {
            // optional
          }
          await ensureUserProfile(cred.user);
        } catch (e) {
          throwMapped(e);
        }
      },
      async logOut() {
        await signOut(auth);
      },
      async resetPassword(email) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
        } catch (e) {
          throwMapped(e);
        }
      },
      async refreshUser() {
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        setUser(auth.currentUser);
      },
      async sendVerificationEmail() {
        if (!auth.currentUser) throw new Error('Giriş gerekli.');
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (e) {
          throwMapped(e);
        }
      },
      async changeEmail(newEmail, password) {
        const current = auth.currentUser;
        if (!current?.email) throw new Error('Giriş gerekli.');
        const next = newEmail.trim();
        if (!next) throw new Error('Yeni e-posta gerekli.');
        if (next.toLowerCase() === current.email.toLowerCase()) {
          throw new Error('Yeni e-posta mevcut adresle aynı.');
        }
        try {
          const cred = EmailAuthProvider.credential(current.email, password);
          await reauthenticateWithCredential(current, cred);
          await verifyBeforeUpdateEmail(current, next);
        } catch (e) {
          throwMapped(e);
        }
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
