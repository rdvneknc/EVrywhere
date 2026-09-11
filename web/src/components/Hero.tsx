import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const HERO_STATS = [
  { label: 'Üye', value: '12K+', icon: '👥' },
  { label: 'Konu', value: '28K+', icon: '💬' },
  { label: 'İlan', value: '5.7K+', icon: '🚗' },
  { label: 'Şarj noktası', value: '892+', icon: '⚡' },
] as const;

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-[#0b0f14]">
      <div className="absolute inset-0">
        <img
          src="/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover object-[center_40%]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
      </div>

      <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col lg:min-h-[640px]">
        <div className="flex flex-1 flex-col justify-center px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-6 lg:pb-10 lg:pt-20">
          <div className="max-w-xl text-left">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-ev-primary">
              EVrywhere
            </p>
            <h1 className="text-[1.85rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Elektrikli geleceği birlikte şekillendirelim
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-lg">
              Türkiye’deki EV sürücüleri için forum, 2. el ilanlar, şarj haritası
              ve topluluk — hepsi bir arada.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={user ? '/forum/yeni' : '/giris?next=/forum'}
                className="rounded-xl bg-ev-primary px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-ev-primary/35 transition hover:bg-ev-primary-dark sm:px-6 sm:py-3.5"
              >
                {user ? 'Konu aç' : 'Hemen Katıl'}
              </Link>
              <Link
                to="/forum"
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20 sm:px-6 sm:py-3.5"
              >
                Topluluğu Keşfet
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4 lg:px-6">
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-3 py-3.5 sm:justify-center sm:gap-3 sm:px-6 sm:py-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ev-primary/20 text-base sm:h-10 sm:w-10 sm:text-lg">
                  {s.icon}
                </span>
                <div className="min-w-0 text-left">
                  <div className="text-base font-extrabold text-white sm:text-lg">
                    {s.value}
                  </div>
                  <div className="truncate text-[11px] font-medium text-white/70 sm:text-xs">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
