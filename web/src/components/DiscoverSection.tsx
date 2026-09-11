import { Link } from 'react-router-dom';
import { HOME_GUIDES, POPULAR_BRANDS } from '../data/forumHome';
import { NEWS_ARTICLES } from '../data/news';

export function DiscoverSection() {
  const news = NEWS_ARTICLES.slice(0, 3);

  return (
    <section id="kesfet" className="border-t border-ev-divider bg-ev-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
          <div>
            <h3 className="text-lg font-extrabold text-ev-text">
              Popüler markalar
            </h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {POPULAR_BRANDS.map((b) => (
                <Link
                  key={b.name}
                  to="/ilanlar"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-ev-border bg-ev-bg px-1 py-4 transition hover:border-ev-primary/40 hover:bg-ev-primary-light/40"
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <span className="text-xs font-bold text-ev-muted">
                    {b.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-end justify-between gap-2">
              <h3 className="text-lg font-extrabold text-ev-text">
                Güncel haberler
              </h3>
              <Link
                to="/haberler"
                className="text-xs font-bold text-ev-primary hover:text-ev-primary-dark"
              >
                Tümü →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {news.map((n) => (
                <li key={n.id}>
                  <Link
                    to={`/haberler/${n.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-ev-border bg-ev-bg p-3 transition hover:border-ev-primary/40"
                  >
                    <div
                      className="grid h-16 w-20 shrink-0 place-items-center rounded-xl text-xl"
                      style={{
                        background: `linear-gradient(135deg, ${n.imageGradient[0]}, ${n.imageGradient[1]})`,
                      }}
                    >
                      {n.imageEmoji}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-ev-text">
                        {n.title}
                      </p>
                      <p className="mt-1.5 text-xs text-ev-hint">
                        {n.publishedLabel}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-ev-text">
              Rehber & ipuçları
            </h3>
            <ul className="mt-4 space-y-3">
              {HOME_GUIDES.map((g) => (
                <li key={g.id}>
                  <Link
                    to="/forum"
                    className="flex items-start gap-3 rounded-2xl border border-ev-border bg-ev-bg p-3 transition hover:border-ev-primary/40"
                  >
                    <div className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-ev-primary-light text-xl">
                      📖
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-ev-text">
                        {g.title}
                      </p>
                      <p className="mt-1.5 text-xs text-ev-hint">{g.date}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
