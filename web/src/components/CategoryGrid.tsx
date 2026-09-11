import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'forum',
    label: 'Forum',
    emoji: '💬',
    tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300',
    href: '/forum',
    meta: 'Canlı konular',
    cta: 'Foruma git →',
  },
  {
    id: 'charging',
    label: 'Şarj',
    emoji: '⚡',
    tone: 'bg-sky-100 text-sky-800 dark:bg-sky-950/55 dark:text-sky-300',
    href: '/sarj',
    meta: 'Harita & istasyon',
    cta: 'Haritayı aç →',
  },
  {
    id: 'tech',
    label: 'Teknik',
    emoji: '🔧',
    tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-300',
    href: '/forum',
    meta: 'Bakım & yazılım',
    cta: 'Keşfet →',
  },
  {
    id: 'trips',
    label: 'Yolculuk',
    emoji: '🗺️',
    tone: 'bg-violet-100 text-violet-800 dark:bg-violet-950/55 dark:text-violet-300',
    href: '/forum',
    meta: 'Rota notları',
    cta: 'Keşfet →',
  },
  {
    id: 'secondhand',
    label: '2. El',
    emoji: '🚗',
    tone: 'bg-lime-100 text-lime-800 dark:bg-lime-950/55 dark:text-lime-300',
    href: '/ilanlar',
    meta: 'Güncel ilanlar',
    cta: 'İlanlara git →',
  },
  {
    id: 'news',
    label: 'Haberler',
    emoji: '📰',
    tone: 'bg-rose-100 text-rose-800 dark:bg-rose-950/55 dark:text-rose-300',
    href: '/haberler',
    meta: 'Güncel gelişmeler',
    cta: 'Haberlere git →',
  },
  {
    id: 'guide',
    label: 'Rehber',
    emoji: '📖',
    tone: 'bg-teal-100 text-teal-800 dark:bg-teal-950/55 dark:text-teal-300',
    href: '/forum',
    meta: 'İpuçları',
    cta: 'Keşfet →',
  },
] as const;

export function CategoryGrid() {
  return (
    <section className="bg-ev-bg">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={c.href}
              className="group flex flex-col items-center rounded-2xl border border-ev-border bg-ev-surface px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-ev-primary/35 hover:shadow-md"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${c.tone}`}
              >
                {c.emoji}
              </span>
              <span className="mt-3 text-sm font-extrabold text-ev-text">
                {c.label}
              </span>
              <span className="mt-1 text-[11px] font-medium text-ev-hint">
                {c.meta}
              </span>
              <span className="mt-3 text-[11px] font-bold text-ev-primary opacity-70 transition group-hover:opacity-100">
                {c.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
