import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChargingStations } from '../api/chargingStations';
import { connectorColor, type ChargingStation } from '../data/charging';

const ChargingMapView = lazy(() =>
  import('./ChargingMapView').then((m) => ({ default: m.ChargingMapView })),
);

/** İstanbul — konum yoksa / izin verilmezse varsayılan merkez */
const FALLBACK = { lat: 41.0082, lng: 28.9784, label: 'İstanbul' };

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function ChargingPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('…');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active || loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;

    async function loadAround(lat: number, lng: number, label: string) {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setCenterLat(lat);
      setCenterLng(lng);
      setLocationLabel(label);
      try {
        const list = await getChargingStations({
          lat,
          lng,
          distanceKm: 20,
          maxResults: 30,
        });
        if (cancelled) return;
        list.sort((a, b) => a.distanceKm - b.distanceKm);
        setStations(list);
      } catch (e) {
        if (cancelled) return;
        setStations([]);
        setError(e instanceof Error ? e.message : 'İstasyonlar yüklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function useFallback() {
      void loadAround(FALLBACK.lat, FALLBACK.lng, FALLBACK.label);
    }

    if (!navigator.geolocation) {
      useFallback();
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadAround(
          pos.coords.latitude,
          pos.coords.longitude,
          'Konumun',
        );
      },
      () => useFallback(),
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [active]);

  const nearby = stations.slice(0, 5);

  return (
    <section
      ref={sectionRef}
      id="sarj"
      className="border-t border-ev-divider bg-ev-bg"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ev-text">
              Şarj istasyonları
            </h2>
            <p className="mt-1 text-sm text-ev-muted">
              Harita üzerinde keşfet, yakındaki noktalara bak
            </p>
          </div>
          <Link
            to="/sarj"
            className="text-sm font-bold text-ev-primary hover:text-ev-primary-dark"
          >
            Tüm istasyonları gör →
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <div className="relative min-h-[320px] overflow-hidden rounded-2xl lg:min-h-[420px]">
            {!active || centerLat == null ? (
              <div className="grid h-full min-h-[320px] place-items-center rounded-2xl border border-ev-border bg-ev-surface text-sm text-ev-muted lg:min-h-[420px]">
                Harita yükleniyor…
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="grid h-full min-h-[320px] place-items-center rounded-2xl border border-ev-border bg-ev-surface text-sm text-ev-muted lg:min-h-[420px]">
                    Harita yükleniyor…
                  </div>
                }
              >
                <ChargingMapView
                  stations={stations}
                  centerLat={centerLat}
                  centerLng={centerLng}
                  selectedId={selectedId}
                  scrollWheelZoom={false}
                  className="relative z-0 h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-ev-border isolate lg:min-h-[420px]"
                  onStationTap={(s) => setSelectedId(s.ocmId)}
                />
              </Suspense>
            )}
            {stations.length > 0 ? (
              <span className="absolute right-3 top-3 z-[500] rounded-full bg-ev-surface/95 px-3 py-1.5 text-xs font-extrabold text-ev-text shadow-md ring-1 ring-ev-border">
                {stations.length} nokta
              </span>
            ) : null}
          </div>

          <div className="rounded-2xl border border-ev-border bg-ev-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-ev-text">
                  Size en yakın şarj istasyonları
                </h3>
                <p className="mt-1 text-xs text-ev-hint">{locationLabel}</p>
              </div>
              <Link
                to="/sarj"
                className="shrink-0 text-xs font-bold text-ev-primary hover:text-ev-primary-dark"
              >
                Tümü →
              </Link>
            </div>

            {loading && nearby.length === 0 ? (
              <p className="mt-6 text-center text-sm text-ev-muted">
                İstasyonlar yükleniyor…
              </p>
            ) : error && nearby.length === 0 ? (
              <p className="mt-6 text-center text-sm text-red-600 dark:text-red-400">
                {error}{' '}
                <Link to="/sarj" className="font-bold text-ev-primary">
                  Şarj sayfasına git
                </Link>
              </p>
            ) : nearby.length === 0 ? (
              <p className="mt-6 text-center text-sm text-ev-muted">
                Yakında istasyon bulunamadı.{' '}
                <Link to="/sarj" className="font-bold text-ev-primary">
                  Haritada ara
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-ev-divider">
                {nearby.map((s) => {
                  const activeRow = selectedId === s.ocmId;
                  return (
                    <li key={s.ocmId}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.ocmId)}
                        className={`flex w-full gap-3 py-3.5 text-left transition ${
                          activeRow
                            ? 'bg-ev-primary-light/60'
                            : 'hover:bg-ev-bg/80'
                        }`}
                      >
                        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ev-primary-light text-base text-ev-primary">
                          ⚡
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-ev-text">
                              {s.name}
                            </p>
                            <span className="shrink-0 text-xs font-extrabold text-ev-primary">
                              {formatDistance(s.distanceKm)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-ev-muted">
                            {s.address}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-md bg-ev-bg px-2 py-0.5 text-[10px] font-bold text-ev-muted ring-1 ring-ev-border">
                              {s.maxPowerKw} kW
                            </span>
                            {s.connectorLabels.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                                style={{
                                  backgroundColor: connectorColor(tag),
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
