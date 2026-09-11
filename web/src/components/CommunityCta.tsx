import { Link } from 'react-router-dom';
import { COMMUNITY_STATS } from '../data/forumHome';
import { useAuth } from '../auth/AuthContext';

const AVATARS = [
  { initials: 'AK', color: '#1a8c40' },
  { initials: 'MY', color: '#0ea5e9' },
  { initials: 'ED', color: '#8b5cf6' },
  { initials: 'CB', color: '#f59e0b' },
  { initials: 'ZA', color: '#ef4444' },
  { initials: 'BT', color: '#14b8a6' },
] as const;

export function CommunityCta() {
  const { user } = useAuth();

  return (
    <section className="border-t border-ev-divider bg-ev-primary-light">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-2">
            {COMMUNITY_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-ev-border/80 bg-ev-surface p-5 text-left shadow-sm"
              >
                <div className="text-2xl font-extrabold tracking-tight text-ev-primary sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm font-bold text-ev-text">
                  {s.label}
                </div>
                <div className="mt-1 text-xs text-ev-muted">{s.hint}</div>
              </div>
            ))}
          </div>

          <div className="text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-ev-text">
              Sen de aramıza katıl!
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ev-muted sm:text-base">
              Forumda soru sor, deneyim paylaş, 2. el ilanlara göz at. EVrywhere
              mobil uygulamasıyla aynı topluluğun web yüzü.
            </p>
            <div className="mt-6 flex items-center">
              <div className="flex -space-x-2.5">
                {AVATARS.map((a) => (
                  <div
                    key={a.initials}
                    className="grid h-11 w-11 place-items-center rounded-full border-2 border-white text-[11px] font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.initials}
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm font-bold text-ev-muted">
                +12K üye
              </span>
            </div>
            <Link
              to={user ? '/forum' : '/giris?next=/forum'}
              className="mt-8 inline-flex rounded-xl bg-ev-primary px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-ev-primary/30 transition hover:bg-ev-primary-dark"
            >
              {user ? 'Foruma git' : 'Ücretsiz katıl'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
