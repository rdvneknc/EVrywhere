import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { subscribeListings } from '../api/listings';
import { useAuth } from '../auth/AuthContext';
import {
  DEFAULT_FILTER,
  EV_BRANDS,
  TURKEY_PROVINCES,
  filterListings,
  formatPriceFull,
  normalizeTr,
  type EvListing,
  type ListingFilter,
} from '../data/marketplace';

type DraftFilter = {
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  kmMin: string;
  kmMax: string;
};

function toDraft(f: ListingFilter): DraftFilter {
  return {
    priceMin: f.priceMin ? String(f.priceMin) : '',
    priceMax: f.priceMax === DEFAULT_FILTER.priceMax ? '' : String(f.priceMax),
    yearMin: String(f.yearMin),
    yearMax: String(f.yearMax),
    kmMin: f.kmMin ? String(f.kmMin) : '',
    kmMax: f.kmMax === DEFAULT_FILTER.kmMax ? '' : String(f.kmMax),
  };
}

export function MarketplacePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const textQuery = searchParams.get('q')?.trim() ?? '';
  const [listings, setListings] = useState<EvListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState('all');
  const [model, setModel] = useState('all');
  const [city, setCity] = useState('all');
  const [brandQuery, setBrandQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [filter, setFilter] = useState<ListingFilter>({
    ...DEFAULT_FILTER,
    dateSort: 'newest',
  });
  const [draft, setDraft] = useState<DraftFilter>(() =>
    toDraft({ ...DEFAULT_FILTER, dateSort: 'newest' }),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    return subscribeListings(
      (items) => {
        setListings(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || 'İlanlar yüklenemedi');
        setLoading(false);
      },
    );
  }, []);

  const brand = EV_BRANDS.find((b) => b.id === brandId);
  const models = brand?.models ?? [];

  const brandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of listings) {
      map.set(l.brandId, (map.get(l.brandId) ?? 0) + 1);
    }
    return map;
  }, [listings]);

  const filtered = useMemo(() => {
    let list = listings;
    if (brandId !== 'all') list = list.filter((l) => l.brandId === brandId);
    if (model !== 'all') list = list.filter((l) => l.model === model);
    if (city !== 'all') list = list.filter((l) => l.location === city);
    if (textQuery) {
      const q = normalizeTr(textQuery);
      list = list.filter((l) => {
        const brandName =
          EV_BRANDS.find((b) => b.id === l.brandId)?.name ?? '';
        const hay = normalizeTr(
          `${brandName} ${l.model} ${l.location} ${l.year}`,
        );
        return hay.includes(q);
      });
    }
    return filterListings(list, filter);
  }, [listings, brandId, model, city, filter, textQuery]);

  const applyNumericFilters = () => {
    setFilter((f) => ({
      ...f,
      priceMin: Number(draft.priceMin.replace(/\D/g, '')) || 0,
      priceMax:
        Number(draft.priceMax.replace(/\D/g, '')) || DEFAULT_FILTER.priceMax,
      yearMin: Number(draft.yearMin) || DEFAULT_FILTER.yearMin,
      yearMax: Number(draft.yearMax) || DEFAULT_FILTER.yearMax,
      kmMin: Number(draft.kmMin.replace(/\D/g, '')) || 0,
      kmMax: Number(draft.kmMax.replace(/\D/g, '')) || DEFAULT_FILTER.kmMax,
    }));
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const next = { ...DEFAULT_FILTER, dateSort: 'newest' as const };
    setFilter(next);
    setDraft(toDraft(next));
    setBrandId('all');
    setModel('all');
    setCity('all');
    setBrandQuery('');
    setCityQuery('');
  };

  const filteredBrands = useMemo(() => {
    const q = normalizeTr(brandQuery);
    if (!q) return EV_BRANDS;
    return EV_BRANDS.filter((b) => normalizeTr(b.name).includes(q));
  }, [brandQuery]);

  const filteredCities = useMemo(() => {
    const q = normalizeTr(cityQuery);
    if (!q) return [...TURKEY_PROVINCES];
    return TURKEY_PROVINCES.filter((c) => normalizeTr(c).includes(q));
  }, [cityQuery]);

  const breadcrumb = [
    { label: 'Vasıta', onClick: clearFilters },
    {
      label: 'Elektrikli Araç',
      onClick: () => {
        setBrandId('all');
        setModel('all');
      },
    },
  ];
  if (brand) {
    breadcrumb.push({
      label: brand.name,
      onClick: () => setModel('all'),
    });
  }
  if (model !== 'all') {
    breadcrumb.push({ label: model, onClick: () => undefined });
  }

  const sortValue =
    filter.priceSort === 'lowest'
      ? 'price-asc'
      : filter.priceSort === 'highest'
        ? 'price-desc'
        : filter.dateSort === 'oldest'
          ? 'date-asc'
          : 'date-desc';

  const onSortChange = (value: string) => {
    setFilter((f) => {
      if (value === 'price-asc')
        return { ...f, priceSort: 'lowest', dateSort: 'none' };
      if (value === 'price-desc')
        return { ...f, priceSort: 'highest', dateSort: 'none' };
      if (value === 'date-asc')
        return { ...f, dateSort: 'oldest', priceSort: 'none' };
      return { ...f, dateSort: 'newest', priceSort: 'none' };
    });
  };

  const filterPanel = (
    <aside className="border border-ev-border bg-ev-surface text-sm">
      <div className="flex items-center justify-between border-b border-ev-divider px-3 py-2.5">
        <span className="font-extrabold text-ev-text">Detaylı Arama</span>
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs font-semibold text-ev-primary hover:underline"
        >
          Temizle
        </button>
      </div>

      <FilterBlock title="Kategori">
        <div className="px-3 pb-2">
          <input
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="Marka ara…"
            className="filter-input"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setBrandId('all');
            setModel('all');
          }}
          className={`block w-full px-3 py-1.5 text-left ${
            brandId === 'all'
              ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
              : 'text-ev-muted hover:bg-ev-bg'
          }`}
        >
          Tüm elektrikli araçlar
          <span className="float-right text-ev-hint">{listings.length}</span>
        </button>
        <ul className="max-h-56 overflow-y-auto border-t border-ev-divider">
          {filteredBrands.length === 0 ? (
            <li className="px-3 py-2 text-xs text-ev-hint">Marka bulunamadı</li>
          ) : (
            filteredBrands.map((b) => {
              const count = brandCounts.get(b.id) ?? 0;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandId(b.id);
                      setModel('all');
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left ${
                      brandId === b.id
                        ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
                        : 'text-ev-muted hover:bg-ev-bg'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-xs text-ev-hint">{count}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </FilterBlock>

      {brandId !== 'all' && models.length > 0 ? (
        <FilterBlock title="Model">
          <button
            type="button"
            onClick={() => setModel('all')}
            className={`block w-full px-3 py-1.5 text-left ${
              model === 'all'
                ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
                : 'text-ev-muted hover:bg-ev-bg'
            }`}
          >
            Tüm modeller
          </button>
          <ul className="border-t border-ev-divider">
            {models.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => setModel(m)}
                  className={`block w-full px-3 py-1.5 text-left ${
                    model === m
                      ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
                      : 'text-ev-muted hover:bg-ev-bg'
                  }`}
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>
        </FilterBlock>
      ) : null}

      <FilterBlock title="Fiyat (TL)">
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          <input
            value={draft.priceMin}
            onChange={(e) =>
              setDraft((d) => ({ ...d, priceMin: e.target.value }))
            }
            placeholder="min"
            inputMode="numeric"
            className="filter-input"
          />
          <input
            value={draft.priceMax}
            onChange={(e) =>
              setDraft((d) => ({ ...d, priceMax: e.target.value }))
            }
            placeholder="max"
            inputMode="numeric"
            className="filter-input"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Yıl">
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          <input
            value={draft.yearMin}
            onChange={(e) =>
              setDraft((d) => ({ ...d, yearMin: e.target.value }))
            }
            placeholder="min"
            inputMode="numeric"
            className="filter-input"
          />
          <input
            value={draft.yearMax}
            onChange={(e) =>
              setDraft((d) => ({ ...d, yearMax: e.target.value }))
            }
            placeholder="max"
            inputMode="numeric"
            className="filter-input"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Kilometre">
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          <input
            value={draft.kmMin}
            onChange={(e) =>
              setDraft((d) => ({ ...d, kmMin: e.target.value }))
            }
            placeholder="min"
            inputMode="numeric"
            className="filter-input"
          />
          <input
            value={draft.kmMax}
            onChange={(e) =>
              setDraft((d) => ({ ...d, kmMax: e.target.value }))
            }
            placeholder="max"
            inputMode="numeric"
            className="filter-input"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="İl">
        <div className="px-3 pb-2">
          <input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="İl ara…"
            className="filter-input"
          />
        </div>
        <button
          type="button"
          onClick={() => setCity('all')}
          className={`block w-full px-3 py-1.5 text-left ${
            city === 'all'
              ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
              : 'text-ev-muted hover:bg-ev-bg'
          }`}
        >
          Tüm Türkiye
        </button>
        <ul className="max-h-48 overflow-y-auto border-t border-ev-divider">
          {filteredCities.length === 0 ? (
            <li className="px-3 py-2 text-xs text-ev-hint">İl bulunamadı</li>
          ) : (
            filteredCities.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCity(c)}
                  className={`block w-full px-3 py-1.5 text-left ${
                    city === c
                      ? 'bg-ev-primary-light font-bold text-ev-primary-dark'
                      : 'text-ev-muted hover:bg-ev-bg'
                  }`}
                >
                  {c}
                </button>
              </li>
            ))
          )}
        </ul>
      </FilterBlock>

      <FilterBlock title="Kimden">
        <div className="space-y-1 px-3 pb-2">
          {['Tümü', 'Sahibinden', 'Galeriden'].map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-ev-muted"
            >
              <input
                type="radio"
                name="sellerType"
                checked={filter.sellerType === opt}
                onChange={() => setFilter((f) => ({ ...f, sellerType: opt }))}
              />
              {opt === 'Tümü' ? 'Hepsi' : opt}
            </label>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Hasar kaydı">
        <div className="space-y-1 px-3 pb-2">
          {['Tümü', 'Kazasız', 'Kazalı'].map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-ev-muted"
            >
              <input
                type="radio"
                name="damageStatus"
                checked={filter.damageStatus === opt}
                onChange={() =>
                  setFilter((f) => ({ ...f, damageStatus: opt }))
                }
              />
              {opt === 'Tümü' ? 'Fark etmez' : opt}
            </label>
          ))}
        </div>
      </FilterBlock>

      <div className="border-t border-ev-divider p-3">
        <button
          type="button"
          onClick={applyNumericFilters}
          className="w-full bg-ev-primary py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark"
        >
          Ara
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-1 text-xs text-ev-muted">
            {breadcrumb.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <span className="text-ev-hint">›</span> : null}
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className={
                    i === breadcrumb.length - 1
                      ? 'font-bold text-ev-text'
                      : 'hover:text-ev-primary hover:underline'
                  }
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </nav>
          <Link
            to={user ? '/ilanlar/yeni' : '/giris?next=/ilanlar/yeni'}
            className="bg-ev-primary px-4 py-2 text-xs font-extrabold text-white hover:bg-ev-primary-dark"
          >
            + İlan Ver
          </Link>
        </div>

        <div className="mb-3 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full border border-ev-border bg-ev-surface px-3 py-2.5 text-left text-sm font-bold text-ev-text"
          >
            {filtersOpen ? 'Filtreleri gizle' : 'Detaylı arama / filtreler'}
          </button>
          {filtersOpen ? <div className="mt-2">{filterPanel}</div> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="hidden lg:block">{filterPanel}</div>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border border-ev-border bg-ev-surface px-3 py-2">
              <p className="text-sm text-ev-muted">
                <span className="font-extrabold text-ev-text">
                  {filtered.length}
                </span>{' '}
                ilan listeleniyor
              </p>
              <label className="flex items-center gap-2 text-xs text-ev-muted">
                Sırala
                <select
                  value={sortValue}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="border border-ev-border bg-ev-bg px-2 py-1 text-xs font-semibold text-ev-text"
                >
                  <option value="date-desc">En yeni ilan</option>
                  <option value="date-asc">En eski ilan</option>
                  <option value="price-asc">Fiyat: artan</option>
                  <option value="price-desc">Fiyat: azalan</option>
                </select>
              </label>
            </div>

            <div className="border border-ev-border bg-ev-surface">
              {loading ? (
                <p className="p-10 text-center text-sm text-ev-muted">
                  Yükleniyor…
                </p>
              ) : error ? (
                <p className="p-10 text-center text-sm text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="p-10 text-center text-sm text-ev-muted">
                  Bu kriterlere uygun ilan bulunamadı.
                </p>
              ) : (
                <ul className="divide-y divide-ev-divider">
                  {filtered.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-ev-divider">
      <div className="bg-ev-primary-light px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-ev-text">
        {title}
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

function ListingRow({ listing }: { listing: EvListing }) {
  const cover = listing.photos[0];
  return (
    <li>
      <Link
        to={`/ilanlar/${listing.id}`}
        className="flex gap-3 p-3 transition hover:bg-ev-bg/80 sm:gap-4 sm:p-4"
      >
        <div
          className="h-[88px] w-[120px] shrink-0 overflow-hidden bg-ev-bg sm:h-[108px] sm:w-[148px]"
          style={{
            background: cover
              ? undefined
              : `linear-gradient(135deg, ${listing.gradient[0]}, ${listing.gradient[1]})`,
          }}
        >
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-2xl">
              {listing.emoji}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-sm font-bold text-ev-text sm:text-[15px]">
            {listing.year} {listing.model}
          </h2>
          <p className="mt-1 text-xs text-ev-muted sm:text-sm">
            {listing.km.toLocaleString('tr-TR')} km
            <span className="mx-1.5 text-ev-hint">·</span>
            {listing.color}
            <span className="mx-1.5 text-ev-hint">·</span>
            {listing.damageStatus}
            <span className="mx-1.5 text-ev-hint">·</span>
            {listing.sellerType}
          </p>
          <p className="mt-2 text-xs text-ev-hint">
            {listing.location}
            <span className="mx-1.5">·</span>
            {listing.postedAgo}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-extrabold text-ev-primary sm:text-base">
            {formatPriceFull(listing.price)}
          </div>
        </div>
      </Link>
    </li>
  );
}
