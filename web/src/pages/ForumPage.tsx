import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  CATEGORY_BADGE,
  FORUM_CATEGORIES,
  type ForumTopic,
} from '../data/forum';
import { subscribeForumTopics } from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';

export function ForumPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');

  useEffect(() => {
    return subscribeForumTopics(
      (items) => {
        setTopics(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || 'Konular yüklenemedi');
        setLoading(false);
      },
    );
  }, []);

  const filtered = useMemo(() => {
    if (categoryId === 'all') return topics;
    return topics.filter((t) => t.categoryId === categoryId);
  }, [topics, categoryId]);

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
              Forum
            </h1>
            <p className="mt-1 text-sm text-ev-muted">
              Türkiye EV topluluğu — soru sor, deneyim paylaş
            </p>
          </div>
          <Link
            to={user ? '/forum/yeni' : '/giris?next=/forum/yeni'}
            className="rounded-full bg-ev-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
          >
            + Yeni konu
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              categoryId === 'all'
                ? 'bg-ev-primary text-white'
                : 'bg-ev-surface text-ev-muted border border-ev-border'
            }`}
          >
            Tümü
          </button>
          {FORUM_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                categoryId === c.id
                  ? 'bg-ev-primary text-white'
                  : 'bg-ev-surface text-ev-muted border border-ev-border'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-ev-border bg-ev-surface">
          {loading ? (
            <p className="p-8 text-center text-sm text-ev-muted">Yükleniyor…</p>
          ) : error ? (
            <p className="p-8 text-center text-sm text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-ev-muted">
              Henüz konu yok. İlk konuyu sen aç.
            </p>
          ) : (
            <ul className="divide-y divide-ev-divider">
              {filtered.map((topic) => {
                const badge =
                  CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
                return (
                  <li key={topic.id}>
                    <Link
                      to={`/forum/${topic.id}`}
                      className="flex gap-3 px-4 py-4 transition hover:bg-ev-bg/80 sm:gap-4 sm:px-5"
                    >
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-extrabold"
                        style={{
                          backgroundColor: `${topic.authorColor}22`,
                          color: topic.authorColor,
                        }}
                      >
                        {topic.authorInitials}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs text-ev-hint">
                            {topic.authorName} · {topic.timeAgo}
                          </span>
                        </div>
                        <h2 className="mt-1 text-sm font-bold text-ev-text sm:text-[15px]">
                          {topic.title}
                        </h2>
                        {topic.excerpt ? (
                          <p className="mt-1 line-clamp-2 text-xs text-ev-muted">
                            {topic.excerpt}
                          </p>
                        ) : null}
                        <div className="mt-2 flex gap-4 text-xs font-medium text-ev-hint">
                          <span>💬 {topic.replies}</span>
                          <span>👁 {topic.views}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
