import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChargingMapView } from '../components/ChargingMapView';
import {
  geocodeCity,
  getChargingStations,
} from '../api/chargingStations';
import {
  connectorColor,
  type ChargingStation,
} from '../data/charging';
import {
  searchTurkeyPlaces,
  type TurkeyPlace,
} from '../data/turkeyPlaces';
import {
  averageRating,
  deleteStationReview,
  subscribeStationReviews,
  upsertStationReview,
  type StationReview,
} from '../api/chargingReviews';
import { useAuth } from '../auth/AuthContext';

const FILTERS = ['All', 'AC', 'DC', 'HPC'] as const;
const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 100];

export function ChargingPage() {
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState<TurkeyPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refLat, setRefLat] = useState<number | null>(null);
  const [refLng, setRefLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState('…');
  const [distanceKm, setDistanceKm] = useState(25);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selected, setSelected] = useState<ChargingStation | null>(null);
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const distanceRef = useRef(distanceKm);
  distanceRef.current = distanceKm;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSuggestions) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = searchWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showSuggestions]);

  const loadStations = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getChargingStations({
        lat,
        lng,
        distanceKm: distanceRef.current,
        maxResults: 80,
      });
      list.sort((a, b) => a.distanceKm - b.distanceKm);
      setStations(list);
      setSelected(null);
    } catch (e) {
      setStations([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const bootstrapLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setLoading(false);
      setLocationLabel('Şehir ara');
      setError('Tarayıcı konum desteklemiyor. Şehir yazarak ara.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setRefLat(lat);
        setRefLng(lng);
        setLocationLabel('Konumun');
        await loadStations(lat, lng);
      },
      () => {
        setLoading(false);
        setLocationLabel('Şehir ara');
        setError('Konum izni yok. Aşağıdan şehir yazarak arayabilirsin.');
      },
      { enableHighAccuracy: false, timeout: 12000 },
    );
  }, [loadStations]);

  useEffect(() => {
    void bootstrapLocation();
  }, [bootstrapLocation]);

  const scheduleReload = (km: number) => {
    distanceRef.current = km;
    setDistanceKm(km);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (refLat != null && refLng != null) {
        void loadStations(refLat, refLng);
      }
    }, 400);
  };

  const onCityChange = (text: string) => {
    setCity(text);
    const next = searchTurkeyPlaces(text, 10);
    setSuggestions(next);
    setShowSuggestions(text.trim().length >= 1 && next.length > 0);
  };

  const selectPlace = async (place: TurkeyPlace) => {
    setCity(place.label);
    setShowSuggestions(false);
    setSuggestions([]);
    setRefLat(place.lat);
    setRefLng(place.lng);
    setLocationLabel(place.label);
    await loadStations(place.lat, place.lng);
  };

  const onCitySearch = async () => {
    const q = city.trim();
    if (q.length < 2) {
      setError('En az 2 harf gir.');
      return;
    }
    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    try {
      const local = searchTurkeyPlaces(q, 1)[0];
      if (local) {
        await selectPlace(local);
        return;
      }
      const g = await geocodeCity(q);
      setRefLat(g.lat);
      setRefLng(g.lng);
      setLocationLabel(g.displayName);
      await loadStations(g.lat, g.lng);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Adres bulunamadı');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return stations;
    return stations.filter((s) =>
      s.connectorLabels.some((c) => c.toUpperCase() === filter),
    );
  }, [stations, filter]);

  useEffect(() => {
    if (!selected) {
      setReviewError(null);
      setReviewRating(5);
      setReviewText('');
      return;
    }
  }, [selected?.ocmId]);

  useEffect(() => {
    if (!selected || !user) return;
    const mine = reviews.find((r) => r.authorId === user.uid);
    if (mine) {
      setReviewRating(mine.rating || 5);
      setReviewText(mine.text);
    }
  }, [selected?.ocmId, user?.uid, reviews]);

  useEffect(() => {
    if (!selected) {
      setReviews([]);
      return;
    }
    return subscribeStationReviews(
      selected.ocmId,
      setReviews,
      () => setReviews([]),
    );
  }, [selected?.ocmId]);

  const avg = averageRating(reviews);
  const myReview = user
    ? reviews.find((r) => r.authorId === user.uid)
    : undefined;

  const onSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await upsertStationReview(user, {
        stationOcmId: selected.ocmId,
        stationName: selected.name,
        rating: reviewRating,
        text: reviewText,
      });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setReviewSaving(false);
    }
  };

  const onDeleteReview = async () => {
    if (!myReview) return;
    if (!window.confirm('Yorumunu silmek istiyor musun?')) return;
    try {
      await deleteStationReview(myReview.id);
      setReviewText('');
      setReviewRating(5);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Silinemedi');
    }
  };

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
              Şarj istasyonları
            </h1>
            <p className="mt-1 text-sm text-ev-muted">
              {locationLabel}
              {refLat != null ? ` · ${distanceKm} km yarıçap` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void bootstrapLocation()}
            className="rounded-full border border-ev-border bg-ev-surface px-4 py-2 text-xs font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary"
          >
            Konumumu kullan
          </button>
        </div>

        <div ref={searchWrapRef} className="relative z-30 mb-3">
          <div className="flex gap-2">
            <input
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0 && city.trim().length >= 1) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowSuggestions(false);
                  void onCitySearch();
                }
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              placeholder="Şehir veya ilçe ara (ör. Kadıköy, İstanbul)"
              className="min-w-0 flex-1 rounded-xl border border-ev-border bg-ev-surface px-3 py-2.5 text-sm outline-none focus:border-ev-primary"
            />
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                void onCitySearch();
              }}
              className="rounded-xl bg-ev-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
            >
              Ara
            </button>
          </div>
          {showSuggestions ? (
            <ul className="absolute left-0 right-0 z-[1000] mt-1 max-h-56 overflow-y-auto rounded-xl border border-ev-border bg-ev-surface shadow-lg">
              {suggestions.map((p) => (
                <li key={`${p.label}-${p.lat}`}>
                  <button
                    type="button"
                    onClick={() => void selectPlace(p)}
                    className="block w-full px-3 py-2 text-left text-sm text-ev-muted hover:bg-ev-bg hover:text-ev-text"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                filter === f
                  ? 'bg-ev-primary text-white'
                  : 'border border-ev-border bg-ev-surface text-ev-muted'
              }`}
            >
              {f === 'All' ? 'Tümü' : f}
            </button>
          ))}
          <span className="mx-1 hidden text-ev-hint sm:inline">|</span>
          {RADIUS_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => scheduleReload(km)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                distanceKm === km
                  ? 'bg-ev-primary-light text-ev-primary-dark'
                  : 'text-ev-muted hover:bg-ev-surface'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          <div
            id="charging-map"
            className="relative z-0 h-[min(65vh,640px)] min-h-[440px] w-full scroll-mt-4"
          >
            <ChargingMapView
              stations={filtered}
              centerLat={refLat}
              centerLng={refLng}
              selectedId={selected?.ocmId ?? null}
              onStationTap={setSelected}
            />
          </div>

          <div
            className={`grid gap-4 ${
              selected ? 'xl:grid-cols-[minmax(0,1fr)_360px]' : ''
            }`}
          >
            <div className="flex max-h-[420px] flex-col overflow-hidden rounded-2xl border border-ev-border bg-ev-surface">
              <div className="border-b border-ev-divider px-4 py-3 text-sm font-bold text-ev-text">
                {loading ? 'Yükleniyor…' : `${filtered.length} istasyon`}
              </div>
              <ul className="grid flex-1 grid-cols-1 divide-y divide-ev-divider overflow-y-auto sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                {!loading && filtered.length === 0 ? (
                  <li className="col-span-full p-6 text-center text-sm text-ev-muted">
                    Bu alanda istasyon bulunamadı.
                  </li>
                ) : (
                  filtered.map((s) => (
                    <li
                      key={s.ocmId}
                      className="border-ev-divider sm:border-b sm:border-r"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(s);
                          document
                            .getElementById('charging-map')
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }}
                        className={`h-full w-full px-4 py-3 text-left transition hover:bg-ev-bg ${
                          selected?.ocmId === s.ocmId
                            ? 'bg-ev-primary-light'
                            : ''
                        }`}
                      >
                        <div className="text-sm font-bold text-ev-text">
                          {s.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-ev-muted">
                          {s.address || 'Adres yok'}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-ev-primary">
                            {s.distanceKm.toFixed(1)} km
                          </span>
                          <span className="text-ev-hint">·</span>
                          <span className="text-ev-muted">
                            {s.maxPowerKw} kW
                          </span>
                          {s.connectorLabels.map((c) => (
                            <span
                              key={c}
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: connectorColor(c) }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {selected ? (
              <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-ev-border bg-ev-bg px-4 py-3 xl:sticky xl:top-4">
                <div className="text-sm font-extrabold text-ev-text">
                  {selected.name}
                </div>
                <p className="mt-1 text-xs text-ev-muted">{selected.address}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {avg != null ? (
                    <span className="font-bold text-amber-600">
                      ★ {avg} ({reviews.length})
                    </span>
                  ) : (
                    <span className="text-ev-hint">Henüz puan yok</span>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-bold text-ev-primary hover:underline"
                >
                  Yol tarifi →
                </a>

                <div className="mt-4 border-t border-ev-divider pt-3">
                  <h3 className="text-xs font-extrabold text-ev-text">
                    Yorumlar
                  </h3>
                  {reviews.length === 0 ? (
                    <p className="mt-2 text-xs text-ev-hint">
                      Henüz yorum yok.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {reviews.slice(0, 8).map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl border border-ev-border bg-ev-surface px-2.5 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ev-text">
                              {r.authorName}
                            </span>
                            <span className="text-[10px] text-amber-600">
                              {'★'.repeat(r.rating)}
                              <span className="text-ev-hint">
                                {' '}
                                · {r.timeAgo}
                              </span>
                            </span>
                          </div>
                          {r.text ? (
                            <p className="mt-1 text-xs text-ev-muted">
                              {r.text}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  {user ? (
                    <form onSubmit={onSubmitReview} className="mt-3 space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className={`text-sm ${
                              n <= reviewRating
                                ? 'text-amber-500'
                                : 'text-ev-hint'
                            }`}
                            aria-label={`${n} yıldız`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="Deneyimini yaz…"
                        className="w-full rounded-xl border border-ev-border bg-ev-surface px-2.5 py-2 text-xs outline-none focus:border-ev-primary"
                      />
                      {reviewError ? (
                        <p className="text-xs text-red-600">{reviewError}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={reviewSaving}
                          className="rounded-full bg-ev-primary px-3 py-1.5 text-[11px] font-extrabold text-white disabled:opacity-60"
                        >
                          {reviewSaving
                            ? 'Kaydediliyor…'
                            : myReview
                              ? 'Güncelle'
                              : 'Yorum ekle'}
                        </button>
                        {myReview ? (
                          <button
                            type="button"
                            onClick={() => void onDeleteReview()}
                            className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-600 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Sil
                          </button>
                        ) : null}
                      </div>
                    </form>
                  ) : (
                    <p className="mt-3 text-xs text-ev-muted">
                      Yorum için{' '}
                      <Link
                        to="/giris?next=/sarj"
                        className="font-bold text-ev-primary"
                      >
                        giriş yap
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
