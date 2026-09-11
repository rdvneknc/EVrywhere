import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import {
  subscribeSavedTopics,
  type SavedTopicPreview,
} from '../api/savedTopics';
import { CATEGORY_BADGE } from '../data/forum';

export function SavedTopicsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedTopicPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/kaydedilenler', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeSavedTopics(
      user.uid,
      (list) => {
        setItems(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-svh bg-ev-bg">
        <Header />
        <p className="p-10 text-center text-sm text-ev-muted">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
              Kaydedilenler
            </h1>
            <p className="mt-1 text-sm text-ev-muted">
              Kaydettiğin forum konuları
            </p>
          </div>
          <Link
            to="/profil"
            className="text-sm font-semibold text-ev-primary"
          >
            ← Profil
          </Link>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ev-border bg-ev-surface px-4 py-10 text-center text-sm text-ev-muted">
            Henüz kaydedilmiş konu yok.{' '}
            <Link to="/forum" className="font-bold text-ev-primary">
              Foruma git
            </Link>
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-ev-divider overflow-hidden rounded-3xl border border-ev-border bg-ev-surface">
            {items.map((t) => {
              const badge =
                CATEGORY_BADGE[t.categoryId] ?? CATEGORY_BADGE.general;
              return (
                <li key={t.topicId}>
                  <Link
                    to={`/forum/${t.topicId}`}
                    className="block px-4 py-3.5 transition hover:bg-ev-bg"
                  >
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <div className="mt-1.5 text-sm font-bold text-ev-text">
                      {t.title}
                    </div>
                    {t.excerpt ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-ev-muted">
                        {t.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-1 text-[11px] text-ev-hint">
                      {t.authorName} · 💬 {t.replies}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
