import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_BADGE, type ForumTopic } from '../data/forum';
import { subscribeForumTopics } from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';
import { useBlockLists } from '../hooks/useBlockLists';

export function ForumSection() {
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const visible = useMemo(
    () =>
      topics
        .filter((t) => !t.authorId || !hiddenIds.has(t.authorId))
        .slice(0, 6),
    [topics, hiddenIds],
  );

  return (
    <section id="forum" className="bg-ev-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ev-text">
              Son forum konuları
            </h2>
            <p className="mt-1 text-sm text-ev-muted">
              Topluluktan güncel tartışmalar
            </p>
          </div>
          <Link
            to={user ? '/forum/yeni' : '/giris?next=/forum/yeni'}
            className="rounded-xl bg-ev-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
          >
            + Yeni konu
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-2xl border border-ev-border bg-ev-bg shadow-sm">
            {loading ? (
              <p className="py-10 text-center text-sm text-ev-muted">
                Yükleniyor…
              </p>
            ) : error ? (
              <p className="py-10 text-center text-sm text-red-600">{error}</p>
            ) : topics.length === 0 ? (
              <p className="py-10 text-center text-sm text-ev-muted">
                Henüz konu yok.{' '}
                <Link
                  to={user ? '/forum/yeni' : '/giris?next=/forum/yeni'}
                  className="font-bold text-ev-primary"
                >
                  İlk konuyu aç
                </Link>
              </p>
            ) : visible.length === 0 ? (
              <p className="py-10 text-center text-sm text-ev-muted">
                Gösterilecek konu yok.
              </p>
            ) : (
              <ul className="divide-y divide-ev-divider">
                {visible.map((topic) => {
                  const badge =
                    CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
                  return (
                    <li key={topic.id}>
                      <Link
                        to={`/forum/${topic.id}`}
                        className="flex gap-3 px-4 py-4 transition hover:bg-ev-bg/70 sm:px-5"
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
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-xs text-ev-hint">
                              {topic.authorName} · {topic.timeAgo}
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-sm font-bold leading-snug text-ev-text">
                            {topic.title}
                          </h3>
                          <div className="mt-2 flex gap-4 text-xs text-ev-hint">
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
            <div className="border-t border-ev-divider px-4 py-3 text-center">
              <Link
                to="/forum"
                className="text-sm font-bold text-ev-primary hover:text-ev-primary-dark"
              >
                Tüm konuları gör →
              </Link>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-ev-border shadow-sm">
            <img
              src="/sidebar-banner.jpg"
              alt="Sürdürülebilir yolculuk"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
            <div className="relative flex min-h-[360px] flex-col justify-end p-5 text-left lg:min-h-full">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ev-primary">
                Yolculuk
              </p>
              <h3 className="mt-2 text-xl font-extrabold leading-snug text-white">
                Sürdürülebilir yolculuklara başla
              </h3>
              <p className="mt-2 text-sm text-white/80">
                Rota notları, şarj durakları ve uzun yol deneyimleri.
              </p>
              <Link
                to="/forum"
                className="mt-5 inline-flex w-fit rounded-xl bg-ev-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
              >
                Keşfet
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
