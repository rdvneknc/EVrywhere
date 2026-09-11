import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  deleteListing,
  fetchListing,
  fetchListingPhotos,
  updateListing,
} from '../api/listings';
import { useAuth } from '../auth/AuthContext';
import { formatPriceFull, type EvListing } from '../data/marketplace';
import { openOrCreateConversation } from '../api/messaging';
import { createReport, promptReportReason } from '../api/moderation';

export function ListingDetailPage() {
  const { listingId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<EvListing | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editPrice, setEditPrice] = useState('');
  const [editKm, setEditKm] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSellerType, setEditSellerType] = useState('Sahibinden');
  const [editDamageStatus, setEditDamageStatus] = useState('Kazasız');

  useEffect(() => {
    if (!listingId) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const item = await fetchListing(listingId);
        if (!alive) return;
        setListing(item);
        if (item) {
          const gallery = await fetchListingPhotos(listingId);
          if (!alive) return;
          setPhotos(gallery.length > 0 ? gallery : item.photos);
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : 'İlan yüklenemedi');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [listingId]);

  const isOwner =
    !!user && !!listing?.sellerUserId && user.uid === listing.sellerUserId;

  useEffect(() => {
    if (!listing || !editing) return;
    setEditPrice(String(listing.price));
    setEditKm(String(listing.km));
    setEditLocation(listing.location);
    setEditDescription(listing.description ?? '');
    setEditSellerType(listing.sellerType);
    setEditDamageStatus(listing.damageStatus);
  }, [listing, editing]);

  const onDelete = async () => {
    if (!listing || !isOwner) return;
    if (!window.confirm('İlanı silmek istediğine emin misin?')) return;
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      navigate('/ilanlar');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
      setDeleting(false);
    }
  };

  const onMessage = async () => {
    if (!user || !listing?.sellerUserId || isOwner) return;
    setMessaging(true);
    setError(null);
    try {
      const id = await openOrCreateConversation(
        user,
        {
          userId: listing.sellerUserId,
          name: listing.sellerName,
          initials: listing.sellerInitials,
          color: listing.sellerColor,
        },
        {
          type: 'listing',
          id: listing.id,
          title: `${listing.year} ${listing.model}`,
          subtitle: [
            listing.location,
            listing.price
              ? `${listing.price.toLocaleString('tr-TR')} ₺`
              : null,
          ]
            .filter(Boolean)
            .join(' · '),
          imageUrl: listing.photos[0],
          href: `/ilanlar/${listing.id}`,
        },
      );
      navigate(`/mesajlar/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mesaj açılamadı');
      setMessaging(false);
    }
  };

  const onReport = async () => {
    if (!user || !listing) {
      navigate(`/giris?next=/ilanlar/${listingId}`);
      return;
    }
    const reason = promptReportReason();
    if (!reason) return;
    try {
      await createReport({
        reporterId: user.uid,
        targetType: 'listing',
        targetId: listing.id,
        reason,
        targetLabel: `${listing.year} ${listing.model}`,
      });
      window.alert('Şikayet alındı.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şikayet gönderilemedi');
    }
  };

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!listing || !isOwner) return;
    setSaving(true);
    setError(null);
    try {
      const price = Number(editPrice.replace(/\D/g, ''));
      const km = Number(editKm.replace(/\D/g, ''));
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('Geçerli bir fiyat gir.');
      }
      if (!Number.isFinite(km) || km < 0) {
        throw new Error('Geçerli bir km gir.');
      }
      await updateListing(listing.id, {
        price,
        km,
        location: editLocation,
        description: editDescription,
        sellerType: editSellerType,
        damageStatus: editDamageStatus,
      });
      const refreshed = await fetchListing(listing.id);
      if (refreshed) setListing(refreshed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const activePhoto = photos[photoIdx] ?? photos[0];

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <Link to="/ilanlar" className="text-sm font-semibold text-ev-primary">
          ← İlanlar
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : error && !listing ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : !listing ? (
          <p className="mt-8 text-sm text-ev-muted">İlan bulunamadı.</p>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <div
                className="aspect-[16/10] overflow-hidden rounded-3xl border border-ev-border bg-ev-surface"
                style={{
                  background: activePhoto
                    ? undefined
                    : `linear-gradient(135deg, ${listing.gradient[0]}, ${listing.gradient[1]})`,
                }}
              >
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-6xl">
                    {listing.emoji}
                  </div>
                )}
              </div>
              {photos.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoIdx(i)}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                        i === photoIdx
                          ? 'border-ev-primary'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={p}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ev-text">
                {listing.year} {listing.emoji} {listing.model}
              </h1>
              <p className="mt-2 text-2xl font-extrabold text-ev-primary">
                {formatPriceFull(listing.price)}
              </p>
              <p className="mt-2 text-sm text-ev-muted">
                {listing.location} · {listing.km.toLocaleString('tr-TR')} km ·{' '}
                {listing.postedAgo}
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ev-border bg-ev-surface p-3">
                {listing.sellerUserId ? (
                  <Link
                    to={`/u/${listing.sellerUserId}`}
                    className="grid h-11 w-11 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${listing.sellerColor}22`,
                      color: listing.sellerColor,
                    }}
                  >
                    {listing.sellerInitials}
                  </Link>
                ) : (
                  <div
                    className="grid h-11 w-11 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${listing.sellerColor}22`,
                      color: listing.sellerColor,
                    }}
                  >
                    {listing.sellerInitials}
                  </div>
                )}
                <div>
                  {listing.sellerUserId ? (
                    <Link
                      to={`/u/${listing.sellerUserId}`}
                      className="text-sm font-bold text-ev-text hover:text-ev-primary"
                    >
                      {listing.sellerName}
                    </Link>
                  ) : (
                    <div className="text-sm font-bold text-ev-text">
                      {listing.sellerName}
                    </div>
                  )}
                  <div className="text-xs text-ev-hint">
                    {listing.sellerType} · {listing.damageStatus}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing((v) => !v)}
                      className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary"
                    >
                      {editing ? 'Vazgeç' : 'Düzenle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete()}
                      disabled={deleting}
                      className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      {deleting ? 'Siliniyor…' : 'İlanı sil'}
                    </button>
                  </>
                ) : user && listing.sellerUserId ? (
                  <button
                    type="button"
                    disabled={messaging}
                    onClick={() => void onMessage()}
                    className="rounded-full bg-ev-primary px-4 py-2 text-xs font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
                  >
                    {messaging ? 'Açılıyor…' : 'Mesaj gönder'}
                  </button>
                ) : !user ? (
                  <Link
                    to={`/giris?next=/ilanlar/${listingId}`}
                    className="rounded-full bg-ev-primary px-4 py-2 text-xs font-extrabold text-white"
                  >
                    Mesaj için giriş yap
                  </Link>
                ) : null}

                {user && !isOwner ? (
                  <button
                    type="button"
                    onClick={() => void onReport()}
                    className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:text-ev-text"
                  >
                    Şikayet et
                  </button>
                ) : null}
              </div>

              {editing && isOwner ? (
                <form
                  onSubmit={onSaveEdit}
                  className="mt-4 space-y-3 rounded-2xl border border-ev-border bg-ev-surface p-4"
                >
                  <h3 className="text-sm font-extrabold text-ev-text">
                    İlanı düzenle
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs">
                      <span className="font-bold text-ev-muted">Fiyat</span>
                      <input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                        required
                      />
                    </label>
                    <label className="block text-xs">
                      <span className="font-bold text-ev-muted">Km</span>
                      <input
                        value={editKm}
                        onChange={(e) => setEditKm(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                        required
                      />
                    </label>
                  </div>
                  <label className="block text-xs">
                    <span className="font-bold text-ev-muted">Konum</span>
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                      required
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs">
                      <span className="font-bold text-ev-muted">Satıcı</span>
                      <select
                        value={editSellerType}
                        onChange={(e) => setEditSellerType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                      >
                        <option value="Sahibinden">Sahibinden</option>
                        <option value="Galeriden">Galeriden</option>
                      </select>
                    </label>
                    <label className="block text-xs">
                      <span className="font-bold text-ev-muted">Hasar</span>
                      <select
                        value={editDamageStatus}
                        onChange={(e) => setEditDamageStatus(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                      >
                        <option value="Kazasız">Kazasız</option>
                        <option value="Kazalı">Kazalı</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-xs">
                    <span className="font-bold text-ev-muted">Açıklama</span>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-full bg-ev-primary py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
                  >
                    {saving ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                </form>
              ) : null}

              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}

              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <Spec label="Batarya sağlığı" value={`%${listing.batteryHealth}`} />
                <Spec label="Menzil" value={`${listing.range} km`} />
                <Spec label="Batarya" value={`${listing.batteryCapacity} kWh`} />
                <Spec label="Şarj" value={listing.chargeType} />
                <Spec label="AC" value={`${listing.acChargePower} kW`} />
                <Spec label="DC" value={`${listing.dcChargePower} kW`} />
                <Spec label="Motor" value={`${listing.motorPower} bg`} />
                <Spec label="Çekiş" value={listing.drivetrain} />
                <Spec label="Renk" value={listing.color} />
                <Spec label="Garanti" value={listing.warranty} />
              </dl>

              {listing.description ? (
                <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ev-muted">
                  {listing.description}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ev-border bg-ev-surface px-3 py-2">
      <dt className="text-[11px] font-semibold text-ev-hint">{label}</dt>
      <dd className="mt-0.5 font-bold text-ev-text">{value}</dd>
    </div>
  );
}
