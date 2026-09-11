import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { getNewsById, NEWS_ARTICLES } from '../data/news';

export function NewsDetailPage() {
  const { newsId = '' } = useParams();
  const article = getNewsById(newsId);
  const related = NEWS_ARTICLES.filter((a) => a.id !== newsId).slice(0, 3);

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <Link to="/haberler" className="text-sm font-semibold text-ev-primary">
          ← Haberler
        </Link>

        {!article ? (
          <p className="mt-8 text-sm text-ev-muted">Haber bulunamadı.</p>
        ) : (
          <article className="mt-6">
            <div
              className="relative mb-6 aspect-[21/9] overflow-hidden rounded-3xl"
              style={{
                background: `linear-gradient(135deg, ${article.imageGradient[0]}, ${article.imageGradient[1]})`,
              }}
            >
              <div className="absolute inset-0 grid place-items-center text-6xl">
                {article.imageEmoji}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ev-hint">
              <span className="rounded-full bg-ev-primary-light px-2.5 py-0.5 font-bold text-ev-primary-dark">
                {article.category}
              </span>
              <span>{article.publishedLabel}</span>
              <span>·</span>
              <span>{article.sourceName}</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ev-text">
              {article.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ev-muted">
              {article.summary}
            </p>

            <div className="mt-8 space-y-4 text-sm leading-relaxed text-ev-text">
              {article.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full border border-ev-border bg-ev-surface px-4 py-2.5 text-sm font-bold text-ev-primary hover:border-ev-primary"
            >
              Kaynağı oku: {article.sourceName} →
            </a>

            {related.length > 0 ? (
              <section className="mt-12 border-t border-ev-divider pt-8">
                <h2 className="text-lg font-extrabold text-ev-text">
                  Diğer haberler
                </h2>
                <ul className="mt-4 space-y-3">
                  {related.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`/haberler/${a.id}`}
                        className="block rounded-2xl border border-ev-border bg-ev-surface px-4 py-3 transition hover:border-ev-primary/40"
                      >
                        <div className="text-xs text-ev-hint">
                          {a.publishedLabel} · {a.sourceName}
                        </div>
                        <div className="mt-1 text-sm font-bold text-ev-text">
                          {a.title}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
