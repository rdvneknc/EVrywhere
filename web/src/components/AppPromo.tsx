export function AppPromo() {
  return (
    <>
      <section className="border-t border-ev-divider bg-ev-primary-light/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:px-6">
          <div className="text-left">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ev-primary">
              Mobil uygulama
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ev-text">
              EVrywhere cebinde
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ev-muted sm:text-base">
              Forum, 2. el ilanlar, şarj haritası ve mesajlaşma — hepsi tek
              uygulamada. Web’de okuduğun konulara mobilde devam et.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm font-bold text-ev-muted shadow-sm">
                App Store (yakında)
              </div>
              <div className="rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-sm font-bold text-ev-muted shadow-sm">
                Google Play (yakında)
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex h-[280px] w-full max-w-md items-end justify-center gap-4 sm:h-[320px]">
            <div className="relative z-10 mb-4 h-[240px] w-[120px] rounded-[1.6rem] border-[5px] border-ev-text bg-gradient-to-b from-ev-primary-light to-ev-surface p-2 shadow-xl sm:h-[280px] sm:w-[140px]">
              <div className="h-full rounded-[1.1rem] bg-ev-bg p-3">
                <div className="h-2 w-10 rounded-full bg-ev-primary/40" />
                <div className="mt-4 space-y-2">
                  <div className="h-16 rounded-xl bg-ev-primary/25" />
                  <div className="h-8 rounded-lg bg-ev-surface" />
                  <div className="h-8 rounded-lg bg-ev-surface" />
                  <div className="h-8 rounded-lg bg-ev-surface" />
                </div>
              </div>
            </div>
            <div className="absolute right-8 top-0 z-0 h-[220px] w-[110px] rotate-6 rounded-[1.5rem] border-[5px] border-ev-text/80 bg-ev-surface p-2 opacity-90 shadow-lg sm:right-12 sm:h-[260px] sm:w-[130px]">
              <div className="h-full rounded-[1rem] bg-gradient-to-br from-sky-100 to-ev-primary-light p-3 dark:from-sky-950/40">
                <div className="mt-6 h-24 rounded-xl bg-ev-surface/80" />
                <div className="mt-3 h-6 rounded-lg bg-ev-surface/70" />
                <div className="mt-2 h-6 rounded-lg bg-ev-surface/70" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ev-divider bg-ev-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-ev-text">
              Bültene abone ol
            </h3>
            <p className="mt-1 text-sm text-ev-muted">
              Yenilikler ve öne çıkan konular (yakında)
            </p>
          </div>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="E-posta adresin"
              className="min-w-0 flex-1 rounded-xl border border-ev-border bg-ev-bg px-4 py-3 text-sm text-ev-text outline-none placeholder:text-ev-hint focus:border-ev-primary"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-ev-primary px-5 py-3 text-sm font-extrabold text-white transition hover:bg-ev-primary-dark"
            >
              Abone Ol
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
