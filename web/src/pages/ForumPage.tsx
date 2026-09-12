import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  CATEGORY_BADGE,
  FORUM_BRANDS,
  FORUM_CATEGORIES,
  POPULAR_BRAND_IDS,
  findBrand,
  findCategory,
  formatCount,
  topicMatchesBrand,
  type ForumTopic,
} from '../data/forum';
import { subscribeForumTopics } from '../api/forumTopics';
import { useAuth } from '../auth/AuthContext';
import { useBlockLists } from '../hooks/useBlockLists';

type SortMode = 'newest' | 'popular' | 'unanswered';

export function ForumPage() {
  const { user } = useAuth();
  const { hiddenIds } = useBlockLists();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

  const visibleTopics = useMemo(
    () =>
      topics.filter((t) => !t.authorId || !hiddenIds.has(t.authorId)),
    [topics, hiddenIds],
  );

  const filtered = useMemo(() => {
    let list = visibleTopics;
    if (categoryId !== 'all') {
      list = list.filter((t) => t.categoryId === categoryId);
    }
    if (brandId !== 'all') {
      list = list.filter((t) => topicMatchesBrand(t, brandId));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const hay = `${t.title} ${t.excerpt} ${t.authorName}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    if (sort === 'popular') {
      sorted.sort(
        (a, b) => b.replies * 3 + b.views - (a.replies * 3 + a.views),
      );
    } else if (sort === 'unanswered') {
      sorted.sort((a, b) => {
        if (a.replies === 0 && b.replies !== 0) return -1;
        if (b.replies === 0 && a.replies !== 0) return 1;
        return b.createdAtMs - a.createdAtMs;
      });
    } else {
      sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
    }
    return sorted;
  }, [visibleTopics, categoryId, brandId, searchQuery, sort]);

  const popularTopics = useMemo(() => {
    return [...visibleTopics]
      .sort((a, b) => b.replies * 3 + b.views - (a.replies * 3 + a.views))
      .slice(0, 5);
  }, [visibleTopics]);

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const authors = new Set(
      visibleTopics.map((t) => t.authorId || t.authorName).filter(Boolean),
    );
    const newToday = visibleTopics.filter((t) => t.createdAtMs >= dayAgo)
      .length;
    const totalReplies = visibleTopics.reduce((sum, t) => sum + t.replies, 0);
    return {
      activeUsers: authors.size,
      newTopics: newToday,
      totalReplies,
      online: Math.max(authors.size, Math.min(authors.size + 3, visibleTopics.length)),
    };
  }, [visibleTopics]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (categoryId !== 'all') {
      const cat = findCategory(categoryId);
      chips.push({
        key: `cat-${categoryId}`,
        label: cat.label,
        clear: () => setCategoryId('all'),
      });
    }
    if (brandId !== 'all') {
      const brand = findBrand(brandId);
      chips.push({
        key: `brand-${brandId}`,
        label: brand?.name ?? brandId,
        clear: () => setBrandId('all'),
      });
    }
    if (searchQuery.trim()) {
      chips.push({
        key: 'search',
        label: `“${searchQuery.trim()}”`,
        clear: () => {
          setSearchInput('');
          setSearchQuery('');
        },
      });
    }
    return chips;
  }, [categoryId, brandId, searchQuery]);

  const clearAllFilters = () => {
    setCategoryId('all');
    setBrandId('all');
    setSearchInput('');
    setSearchQuery('');
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const newTopicHref = user ? '/forum/yeni' : '/giris?next=/forum/yeni';

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* Sol sütun */}
          <div className="min-w-0 space-y-5">
            <form onSubmit={onSearch} className="flex gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ev-hint">
                  🔍
                </span>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Forum'da konu ara..."
                  className="w-full rounded-2xl border border-ev-border bg-ev-surface py-3 pl-10 pr-4 text-sm text-ev-text outline-none placeholder:text-ev-hint focus:border-ev-primary"
                />
              </label>
              <button
                type="submit"
                className="shrink-0 rounded-2xl bg-ev-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
              >
                Ara
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <CategoryChip
                active={categoryId === 'all'}
                onClick={() => setCategoryId('all')}
                emoji="🌐"
                label="Tümü"
              />
              {FORUM_CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  emoji={c.emoji}
                  label={c.label}
                />
              ))}
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ev-muted">
                  Aktif filtreler
                </span>
                {activeFilters.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ev-divider px-3 py-1 text-xs font-bold text-ev-text hover:bg-ev-border"
                  >
                    {chip.label}
                    <span aria-hidden className="text-ev-muted">
                      ×
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-ev-muted hover:text-ev-primary"
                >
                  🗑️ Filtreleri Temizle
                </button>
              </div>
            ) : null}

            <section className="overflow-hidden rounded-3xl border border-ev-border bg-ev-surface shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ev-divider px-4 py-3.5 sm:px-5">
                <div>
                  <h1 className="flex items-center gap-2 text-base font-extrabold text-ev-text">
                    <span aria-hidden>💬</span> Forum Konuları
                  </h1>
                  <p className="mt-0.5 text-xs text-ev-muted">
                    {loading
                      ? 'Yükleniyor…'
                      : `${filtered.length} konu listeleniyor`}
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="p-8 text-center text-sm text-ev-muted">
                  Yükleniyor…
                </p>
              ) : error ? (
                <p className="p-8 text-center text-sm text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-ev-muted">
                  Bu filtrelere uyan konu yok.
                </p>
              ) : (
                <ul className="divide-y divide-ev-divider">
                  {filtered.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Sağ sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            <Link
              to={newTopicHref}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ev-primary px-4 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-ev-primary-dark"
            >
              + Yeni konu
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`rounded-2xl border px-3 py-2.5 text-xs font-bold ${
                  showFilters || brandId !== 'all'
                    ? 'border-ev-primary bg-ev-primary-light text-ev-primary'
                    : 'border-ev-border bg-ev-surface text-ev-text'
                }`}
              >
                ⚙️ Filtreler
              </button>
              <label className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="w-full appearance-none rounded-2xl border border-ev-border bg-ev-surface px-3 py-2.5 pr-8 text-xs font-bold text-ev-text outline-none focus:border-ev-primary"
                >
                  <option value="newest">En Yeni</option>
                  <option value="popular">Popüler</option>
                  <option value="unanswered">Yanıtsız</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ev-hint">
                  ▾
                </span>
              </label>
            </div>

            {showFilters ? (
              <div className="rounded-2xl border border-ev-border bg-ev-surface p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold text-ev-muted">Marka</p>
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setBrandId('all')}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      brandId === 'all'
                        ? 'bg-ev-primary text-white'
                        : 'bg-ev-bg text-ev-muted'
                    }`}
                  >
                    Tümü
                  </button>
                  {FORUM_BRANDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBrandId(b.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        brandId === b.id
                          ? 'bg-ev-primary text-white'
                          : 'bg-ev-bg text-ev-muted'
                      }`}
                    >
                      {b.emoji} {b.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-ev-border bg-ev-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ev-text">
                  <span aria-hidden>🔥</span> Popüler Konular
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSort('popular');
                    setCategoryId('all');
                    setBrandId('all');
                    setSearchQuery('');
                    setSearchInput('');
                  }}
                  className="text-[11px] font-bold text-ev-primary hover:underline"
                >
                  Tümünü gör →
                </button>
              </div>
              {popularTopics.length === 0 ? (
                <p className="text-xs text-ev-muted">Henüz konu yok.</p>
              ) : (
                <ol className="space-y-3">
                  {popularTopics.map((t, i) => (
                    <li key={t.id} className="flex gap-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ev-primary text-[11px] font-extrabold text-white">
                        {i + 1}
                      </span>
                      <Link to={`/forum/${t.id}`} className="min-w-0 group">
                        <p className="line-clamp-2 text-xs font-bold text-ev-text group-hover:text-ev-primary">
                          {t.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ev-hint">
                          {formatCount(t.replies)} yanıt ·{' '}
                          {formatCount(t.views)} görüntüleme
                        </p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-2xl border border-ev-border bg-ev-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ev-text">
                  <span aria-hidden>📊</span> Popüler Markalar
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="text-[11px] font-bold text-ev-primary hover:underline"
                >
                  Tümünü gör →
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {POPULAR_BRAND_IDS.map((id) => {
                  const b = findBrand(id);
                  if (!b) return null;
                  const active = brandId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      title={b.name}
                      onClick={() =>
                        setBrandId((prev) => (prev === b.id ? 'all' : b.id))
                      }
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-lg transition ${
                        active
                          ? 'border-ev-primary bg-ev-primary-light'
                          : 'border-ev-border bg-ev-bg hover:border-ev-primary/40'
                      }`}
                    >
                      <span aria-hidden>{b.emoji}</span>
                      <span className="mt-0.5 max-w-full truncate px-0.5 text-[9px] font-bold text-ev-muted">
                        {b.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-ev-border bg-ev-surface p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-ev-text">
                <span aria-hidden>👥</span> Bugün Forumda
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatCell value={stats.activeUsers} label="Aktif kullanıcı" />
                <StatCell value={stats.newTopics} label="Yeni konu" />
                <StatCell value={stats.totalReplies} label="Toplam yanıt" />
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-ev-muted">
                <span className="h-2 w-2 rounded-full bg-ev-primary" />
                Şu an {stats.online} kişi çevrimiçi
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
        active
          ? 'bg-ev-primary text-white shadow-sm'
          : 'border border-ev-border bg-ev-surface text-ev-muted hover:border-ev-primary/40 hover:text-ev-text'
      }`}
    >
      <span aria-hidden>{emoji}</span>
      {label}
    </button>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-ev-bg px-1 py-2.5">
      <p className="text-lg font-extrabold tabular-nums text-ev-text">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium leading-tight text-ev-muted">
        {label}
      </p>
    </div>
  );
}

function TopicRow({ topic }: { topic: ForumTopic }) {
  const badge = CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general;
  return (
    <li>
      <Link
        to={`/forum/${topic.id}`}
        className="flex gap-3 px-4 py-4 transition hover:bg-ev-bg/70 sm:gap-4 sm:px-5"
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
        <div className="min-w-0 flex-1">
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
        </div>
        <div className="hidden shrink-0 flex-col items-end justify-center gap-1.5 text-[11px] font-semibold text-ev-hint sm:flex">
          <span className="inline-flex items-center gap-1">
            💬 {formatCount(topic.replies)} yanıt
          </span>
          <span className="inline-flex items-center gap-1">
            👁 {formatCount(topic.views)} görüntüleme
          </span>
        </div>
      </Link>
    </li>
  );
}
