import { Link } from 'react-router-dom';

const HERO_STATS = [
  { label: 'Üye', value: '12K+', icon: '👥' },
  { label: 'Konu', value: '28K+', icon: '💬' },
  { label: 'İlan', value: '5.7K+', icon: '🚗' },
  { label: 'Şarj noktası', value: '892+', icon: '⚡' },
] as const;

export function Hero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden lg:min-h-[600px]">
      <div className="absolute inset-0">
        <img
          src="/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-4 py-16 lg:min-h-[600px] lg:px-6 lg:py-20">
        <div className="max-w-xl text-left">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-ev-primary">
            EVrywhere
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Elektrikli geleceği birlikte şekillendirelim
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
            Türkiye’deki EV sürücüleri için forum, 2. el ilanlar, şarj haritası ve
            topluluk — hepsi bir arada.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/giris"
              className="rounded-xl bg-ev-primary px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-ev-primary/35 transition hover:bg-ev-primary-dark"
            >
              Hemen Katıl
            </Link>
            <Link
              to="/forum"
              className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
            >
              Topluluğu Keşfet
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/35 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-6">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 px-4 py-4 sm:justify-center sm:px-6"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ev-primary/20 text-lg">
                {s.icon}
              </span>
              <div className="text-left">
                <div className="text-lg font-extrabold text-white">{s.value}</div>
                <div className="text-xs font-medium text-white/70">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
