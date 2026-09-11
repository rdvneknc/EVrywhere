import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function LoginPage() {
  const { user, loading: authLoading, signIn, signUp, resetPassword } =
    useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/forum';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(next, { replace: true });
    }
  }, [authLoading, user, navigate, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
        setInfo('Hesap oluşturuldu. Doğrulama maili gönderildi.');
      }
      navigate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setError(null);
    setInfo(null);
    if (!email.includes('@')) {
      setError('Şifre sıfırlamak için e-posta yaz.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo('Şifre sıfırlama maili gönderildi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-2xl font-extrabold text-ev-text">
          {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
        </h1>
        <p className="mt-2 text-sm text-ev-muted">
          Forumda konu açmak ve yanıt yazmak için giriş gerekli.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          {mode === 'register' ? (
            <input
              className="w-full rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm outline-none focus:border-ev-primary"
              placeholder="Ad Soyad (isteğe bağlı)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}
          <input
            type="email"
            required
            className="w-full rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm outline-none focus:border-ev-primary"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm outline-none focus:border-ev-primary"
            placeholder="Şifre (min. 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />

          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => void onForgot()}
              className="text-sm font-semibold text-ev-primary"
            >
              Şifremi unuttum
            </button>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-xl bg-ev-primary-light px-3 py-2 text-sm text-ev-primary-dark">
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ev-primary py-3 text-sm font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
          >
            {loading
              ? 'Bekle…'
              : mode === 'login'
                ? 'Giriş Yap'
                : 'Kayıt Ol'}
          </button>
        </form>

        <button
          type="button"
          className="mt-6 text-sm text-ev-muted"
          onClick={() =>
            setMode((m) => (m === 'login' ? 'register' : 'login'))
          }
        >
          {mode === 'login'
            ? 'Hesabın yok mu? Kayıt ol'
            : 'Zaten üye misin? Giriş yap'}
        </button>

        <Link to="/forum" className="mt-4 text-center text-sm text-ev-hint">
          ← Foruma dön
        </Link>
      </main>
      <Footer />
    </div>
  );
}
