import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FORUM_CATEGORIES } from '../data/forum';
import { createForumTopic } from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';

export function NewTopicPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/forum/yeni', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const id = await createForumTopic(user, {
        title,
        excerpt,
        categoryId,
      });
      navigate(`/forum/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

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
      <main className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
        <Link to="/forum" className="text-sm font-semibold text-ev-primary">
          ← Foruma dön
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-ev-text">Yeni konu</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-ev-muted">Kategori</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORUM_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    categoryId === c.id
                      ? 'bg-ev-primary text-white'
                      : 'border border-ev-border bg-ev-surface text-ev-muted'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-ev-muted">Başlık</label>
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm outline-none focus:border-ev-primary"
              placeholder="Konunu kısaca yaz"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ev-muted">İçerik</label>
            <textarea
              required
              maxLength={2000}
              rows={8}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm outline-none focus:border-ev-primary"
              placeholder="Detayları paylaş…"
            />
          </div>
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ev-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
          >
            {saving ? 'Yayınlanıyor…' : 'Konuyu yayınla'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
