import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { NEWS_ARTICLES } from '../data/news';

export function NewsPage() {
  const [featured, ...rest] = NEWS_ARTICLES;

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
            Haberler
          </h1>
          <p className="mt-1 text-sm text-ev-muted">
            Türkiye ve dünya elektrikli araç gündemi — kaynaklı özetler
          </p>
        </div>

        {featured ? (
          <Link
            to={`/haberler/${featured.id}`}
            className="group mb-8 grid overflow-hidden rounded-3xl border border-ev-border bg-ev-surface transition hover:border-ev-primary/40 lg:grid-cols-[1.2fr_1fr]"
          >
            <div
              className="relative min-h-[200px] lg:min-h-[280px]"
              style={{
                background: `linear-gradient(135deg, ${featured.imageGradient[0]}, ${featured.imageGradient[1]})`,
              }}
            >
              <div className="absolute inset-0 grid place-items-center text-6xl opacity-90">
                {featured.imageEmoji}
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 text-left sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ev-hint">
                <span className="rounded-full bg-ev-primary-light px-2.5 py-0.5 font-bold text-ev-primary-dark">
                  {featured.category}
                </span>
                <span>{featured.publishedLabel}</span>
                <span>·</span>
                <span>{featured.sourceName}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-ev-text group-hover:text-ev-primary-dark sm:text-2xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ev-muted">
                {featured.summary}
              </p>
              <span className="mt-4 text-sm font-bold text-ev-primary">
                Haberi oku →
              </span>
            </div>
          </Link>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <Link
              key={article.id}
              to={`/haberler/${article.id}`}
              className="group overflow-hidden rounded-2xl border border-ev-border bg-ev-surface transition hover:-translate-y-0.5 hover:border-ev-primary/40 hover:shadow-md"
            >
              <div
                className="relative aspect-[16/9]"
                style={{
                  background: `linear-gradient(135deg, ${article.imageGradient[0]}, ${article.imageGradient[1]})`,
                }}
              >
                <div className="absolute inset-0 grid place-items-center text-4xl">
                  {article.imageEmoji}
                </div>
              </div>
              <div className="p-4 text-left">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ev-hint">
                  <span className="rounded-full bg-ev-bg px-2 py-0.5 text-ev-muted">
                    {article.category}
                  </span>
                  <span>{article.publishedLabel}</span>
                </div>
                <h2 className="mt-2 text-sm font-bold leading-snug text-ev-text group-hover:text-ev-primary-dark">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ev-muted">
                  {article.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
