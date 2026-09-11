import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeListings } from '../api/listings';
import { formatPrice, type EvListing } from '../data/marketplace';

export function FeaturedListings() {
  const [listings, setListings] = useState<EvListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeListings(
      (items) => {
        setListings(items.slice(0, 4));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return (
    <section id="ilanlar" className="border-t border-ev-divider bg-ev-bg">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ev-text">
              Öne çıkan 2. el ilanlar
            </h2>
            <p className="mt-1 text-sm text-ev-muted">
              Topluluktan güvenilir elektrikli araç ilanları
            </p>
          </div>
          <Link
            to="/ilanlar"
            className="text-sm font-bold text-ev-primary hover:text-ev-primary-dark"
          >
            Tüm ilanlar →
          </Link>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-ev-muted">Yükleniyor…</p>
        ) : listings.length === 0 ? (
          <p className="py-8 text-center text-sm text-ev-muted">
            Henüz ilan yok.{' '}
            <Link to="/ilanlar/yeni" className="font-bold text-ev-primary">
              İlk ilanı ver
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => {
              const cover = listing.photos[0];
              return (
                <Link
                  key={listing.id}
                  to={`/ilanlar/${listing.id}`}
                  className="group overflow-hidden rounded-2xl border border-ev-border bg-ev-surface shadow-sm transition hover:-translate-y-0.5 hover:border-ev-primary/35 hover:shadow-md"
                >
                  <div
                    className="relative aspect-[16/10]"
                    style={{
                      background: cover
                        ? undefined
                        : `linear-gradient(135deg, ${listing.gradient[0]}, ${listing.gradient[1]})`,
                    }}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-3xl">
                        {listing.emoji}
                      </div>
                    )}
                    <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ev-surface/90 text-ev-muted shadow-sm">
                      ♡
                    </span>
                  </div>
                  <div className="p-4 text-left">
                    <h3 className="text-sm font-bold text-ev-text group-hover:text-ev-primary-dark">
                      {listing.year} {listing.model}
                    </h3>
                    <p className="mt-1.5 text-base font-extrabold text-ev-primary">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ev-muted">
                      <span>📍 {listing.location}</span>
                      <span>🛣️ {listing.km.toLocaleString('tr-TR')} km</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
