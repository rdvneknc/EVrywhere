import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import {
  fetchUserPublicProfile,
  formatJoinDate,
  updateMyProfile,
  type UserGarage,
  type UserPublicProfile,
} from '../api/users';
import { fetchTopicsByAuthor } from '../api/forumTopics';
import { fetchListingsBySeller } from '../api/listings';
import { EV_BRANDS, formatPrice, type EvListing } from '../data/marketplace';
import type { ForumTopic } from '../data/forum';
type TabKey = 'garage' | 'forum' | 'listings';

const YEARS = Array.from({ length: 16 }, (_, i) => String(2026 - i));

export function ProfilePage() {
  const {
    user,
    loading: authLoading,
    logOut,
    refreshUser,
    sendVerificationEmail,
    changeEmail,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<TabKey>(
    tabParam === 'forum' || tabParam === 'listings' || tabParam === 'garage'
      ? tabParam
      : 'garage',
  );
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [listings, setListings] = useState<EvListing[]>([]);
  const [editing, setEditing] = useState(false);
  const [editingGarage, setEditingGarage] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingVerify, setSendingVerify] = useState(false);

  useEffect(() => {
    if (
      tabParam === 'forum' ||
      tabParam === 'listings' ||
      tabParam === 'garage'
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/profil', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const reloadProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchUserPublicProfile(user.uid, {
        name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
        initials: (user.displayName || 'EV')
          .split(/\s+/)
          .map((x) => x[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: '#2DC653',
      });
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void reloadProfile();
  }, [user?.uid]);

  useEffect(() => {
    if (!user || user.emailVerified) return;
    const onFocus = () => {
      void refreshUser();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.uid, user?.emailVerified, refreshUser]);

  useEffect(() => {
    if (!user || tab !== 'forum') return;
    void fetchTopicsByAuthor(user.uid).then(setTopics).catch(() => setTopics([]));
  }, [user?.uid, tab]);

  useEffect(() => {
    if (!user || tab !== 'listings') return;
    void fetchListingsBySeller(user.uid)
      .then(setListings)
      .catch(() => setListings([]));
  }, [user?.uid, tab]);

  const onVerify = async () => {
    setSendingVerify(true);
    setMessage(null);
    setError(null);
    try {
      await sendVerificationEmail();
      setMessage(
        'Doğrulama e-postası gönderildi. Gelen kutunu kontrol et; ardından bu sayfaya geri dön.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setSendingVerify(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-svh bg-ev-bg">
        <Header />
        <p className="p-10 text-center text-sm text-ev-muted">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
          Profil
        </h1>

        {loading && !profile ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-ev-border bg-ev-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full text-lg font-extrabold"
                  style={{
                    backgroundColor: `${profile?.color ?? '#2DC653'}22`,
                    color: profile?.color ?? '#2DC653',
                  }}
                >
                  {profile?.initials ?? 'EV'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-extrabold text-ev-text">
                    {profile?.displayName ?? 'Kullanıcı'}
                  </h2>
                  <p className="mt-1 text-sm text-ev-muted">{user.email}</p>
                  <p className="mt-1 text-xs text-ev-hint">
                    Katılım: {formatJoinDate(profile?.createdAt ?? null)}
                  </p>
                  {profile?.bio ? (
                    <p className="mt-3 text-sm leading-relaxed text-ev-muted">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-ev-hint">
                      Henüz bio eklenmedi.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary"
                >
                  Düzenle
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat label="Konu" value={profile?.topicCount ?? 0} />
                <Stat label="Yanıt" value={profile?.replyCount ?? 0} />
                <Stat label="İlan" value={profile?.listingCount ?? 0} />
              </div>

              <div
                className={`mt-5 rounded-2xl border px-4 py-3 ${
                  user.emailVerified
                    ? 'border-ev-primary/30 bg-ev-primary-light'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      user.emailVerified
                        ? 'text-ev-primary-dark'
                        : 'text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {user.emailVerified
                      ? 'E-posta doğrulandı'
                      : 'E-posta henüz doğrulanmadı'}
                  </p>
                  <div className="flex gap-2">
                    {!user.emailVerified ? (
                      <button
                        type="button"
                        disabled={sendingVerify}
                        onClick={() => void onVerify()}
                        className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {sendingVerify ? 'Gönderiliyor…' : 'Doğrula'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditingEmail(true)}
                      className="rounded-full border border-ev-border bg-ev-surface px-3 py-1.5 text-xs font-bold text-ev-muted"
                    >
                      Mail adresini değiştir
                    </button>
                  </div>
                </div>
              </div>

              {message ? (
                <p className="mt-3 text-sm text-ev-primary-dark">{message}</p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
            </section>

            <div className="mt-6 flex gap-2">
              {(
                [
                  ['garage', 'Garaj'],
                  ['forum', 'Konularım'],
                  ['listings', 'İlanlarım'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    navigate(`/profil?tab=${key}`, { replace: true });
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    tab === key
                      ? 'bg-ev-primary text-white'
                      : 'border border-ev-border bg-ev-surface text-ev-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className="mt-4 rounded-3xl border border-ev-border bg-ev-surface p-5">
              {tab === 'garage' ? (
                <GaragePanel
                  garage={profile?.garage ?? null}
                  onEdit={() => setEditingGarage(true)}
                />
              ) : null}

              {tab === 'forum' ? (
                topics.length === 0 ? (
                  <Empty
                    text="Henüz konu açmadın."
                    action={
                      <Link to="/forum/yeni" className="font-bold text-ev-primary">
                        Yeni konu
                      </Link>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-ev-divider">
                    {topics.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/forum/${t.id}`}
                          className="block py-3 text-sm font-bold text-ev-text hover:text-ev-primary"
                        >
                          {t.title}
                          <span className="mt-1 block text-xs font-medium text-ev-hint">
                            {t.timeAgo} · 💬 {t.replies}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}

              {tab === 'listings' ? (
                listings.length === 0 ? (
                  <Empty
                    text="Henüz ilan yok."
                    action={
                      <Link
                        to="/ilanlar/yeni"
                        className="font-bold text-ev-primary"
                      >
                        İlan ver
                      </Link>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-ev-divider">
                    {listings.map((l) => (
                      <li key={l.id}>
                        <Link
                          to={`/ilanlar/${l.id}`}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="h-14 w-20 overflow-hidden rounded-lg bg-ev-bg">
                            {l.photos[0] ? (
                              <img
                                src={l.photos[0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xl">
                                {l.emoji}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-ev-text">
                              {l.year} {l.model}
                            </div>
                            <div className="text-xs text-ev-muted">
                              {formatPrice(l.price)} · {l.location}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>

            <Link
              to="/kaydedilenler"
              className="mt-6 block w-full rounded-full border border-ev-border py-3 text-center text-sm font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary"
            >
              Kaydedilen konular
            </Link>

            <button
              type="button"
              onClick={() => void logOut().then(() => navigate('/'))}
              className="mt-3 w-full rounded-full border border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Çıkış yap
            </button>
          </>
        )}
      </main>
      <Footer />

      {editing && profile ? (
        <EditProfileModal
          name={profile.displayName}
          bio={profile.bio}
          onClose={() => setEditing(false)}
          onSave={async (name, bio) => {
            await updateMyProfile(user, { displayName: name, bio });
            await refreshUser();
            await reloadProfile();
            setEditing(false);
            setMessage('Profil güncellendi.');
          }}
        />
      ) : null}

      {editingEmail ? (
        <ChangeEmailModal
          currentEmail={user.email ?? ''}
          onClose={() => setEditingEmail(false)}
          onSave={async (nextEmail, password) => {
            await changeEmail(nextEmail, password);
            setEditingEmail(false);
            setMessage(
              'Yeni adrese onay maili gönderildi. Bağlantıya tıklayınca e-posta güncellenir.',
            );
          }}
        />
      ) : null}

      {editingGarage && profile ? (
        <EditGarageModal
          garage={profile.garage}
          onClose={() => setEditingGarage(false)}
          onSave={async (garage) => {
            await updateMyProfile(user, {
              displayName: profile.displayName,
              garage,
            });
            await reloadProfile();
            setEditingGarage(false);
            setMessage('Garaj güncellendi.');
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ev-border bg-ev-bg px-3 py-3 text-center">
      <div className="text-lg font-extrabold text-ev-primary">{value}</div>
      <div className="text-[11px] font-semibold text-ev-muted">{label}</div>
    </div>
  );
}

function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-ev-muted">
      {text} {action}
    </p>
  );
}

function GaragePanel({
  garage,
  onEdit,
}: {
  garage: UserGarage | null;
  onEdit: () => void;
}) {
  if (!garage) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-ev-muted">Garajında henüz araç yok.</p>
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 rounded-full bg-ev-primary px-4 py-2 text-xs font-extrabold text-white"
        >
          Araç ekle
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl">{garage.emoji || '⚡'}</div>
          <div className="mt-2 text-lg font-extrabold text-ev-text">
            {garage.brand} {garage.model}
          </div>
          {garage.year ? (
            <div className="mt-1 text-sm text-ev-muted">{garage.year}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-ev-border px-3 py-1.5 text-xs font-bold text-ev-muted"
        >
          Düzenle
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-ev-bg px-2 py-2">
          <div className="font-bold text-ev-text">{garage.km || '—'}</div>
          <div className="text-ev-hint">km</div>
        </div>
        <div className="rounded-xl bg-ev-bg px-2 py-2">
          <div className="font-bold text-ev-text">
            {garage.batteryHealth || '—'}
          </div>
          <div className="text-ev-hint">batarya</div>
        </div>
        <div className="rounded-xl bg-ev-bg px-2 py-2">
          <div className="font-bold text-ev-text">{garage.rangeKm || '—'}</div>
          <div className="text-ev-hint">menzil</div>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({
  name,
  bio,
  onClose,
  onSave,
}: {
  name: string;
  bio: string;
  onClose: () => void;
  onSave: (name: string, bio: string) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [nextBio, setNextBio] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await onSave(displayName, nextBio);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Kaydedilemedi');
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Profili düzenle" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Görünen ad</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Bio</span>
          <textarea
            value={nextBio}
            onChange={(e) => setNextBio(e.target.value)}
            maxLength={500}
            rows={4}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
            placeholder="Kendinden kısaca bahset…"
          />
        </label>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-ev-primary py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </ModalShell>
  );
}

function ChangeEmailModal({
  currentEmail,
  onClose,
  onSave,
}: {
  currentEmail: string;
  onClose: () => void;
  onSave: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await onSave(email, password);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Güncellenemedi');
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Mail adresini değiştir" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ev-muted">
          Mevcut adres: <span className="font-semibold text-ev-text">{currentEmail}</span>
        </p>
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Yeni e-posta</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Şifren</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
            required
            autoComplete="current-password"
          />
        </label>
        <p className="text-xs text-ev-hint">
          Onay için yeni adrese bir mail gider. Bağlantıya tıklayınca adres
          güncellenir.
        </p>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-ev-primary py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {saving ? 'Gönderiliyor…' : 'Onay maili gönder'}
        </button>
      </form>
    </ModalShell>
  );
}

function EditGarageModal({
  garage,
  onClose,
  onSave,
}: {
  garage: UserGarage | null;
  onClose: () => void;
  onSave: (garage: UserGarage | null) => Promise<void>;
}) {
  const [brandId, setBrandId] = useState(() => {
    const match = EV_BRANDS.find(
      (b) => b.name.toLowerCase() === (garage?.brand ?? '').toLowerCase(),
    );
    return match?.id ?? EV_BRANDS[0].id;
  });
  const brand = EV_BRANDS.find((b) => b.id === brandId) ?? EV_BRANDS[0];
  const [model, setModel] = useState(garage?.model || brand.models[0] || '');
  const [year, setYear] = useState(garage?.year || YEARS[2]);
  const [km, setKm] = useState(garage?.km || '');
  const [batteryHealth, setBatteryHealth] = useState(
    garage?.batteryHealth || '',
  );
  const [rangeKm, setRangeKm] = useState(garage?.rangeKm || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!brand.models.includes(model)) {
      setModel(brand.models[0] ?? '');
    }
  }, [brandId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        brand: brand.name,
        model,
        year,
        km,
        batteryHealth,
        rangeKm,
        emoji: brand.emoji,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Kaydedilemedi');
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Garaj" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Marka</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
          >
            {EV_BRANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
          >
            {brand.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-bold text-ev-muted">Yıl</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm">
            <span className="font-bold text-ev-muted">Km</span>
            <input
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-ev-muted">Batarya %</span>
            <input
              value={batteryHealth}
              onChange={(e) => setBatteryHealth(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-ev-muted">Menzil</span>
            <input
              value={rangeKm}
              onChange={(e) => setRangeKm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ev-border bg-ev-bg px-2 py-2"
            />
          </label>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2 pt-1">
          {garage ? (
            <button
              type="button"
              onClick={() => void onSave(null)}
              className="flex-1 rounded-full border border-red-200 py-2.5 text-sm font-bold text-red-600"
            >
              Kaldır
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-ev-primary py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-ev-border bg-ev-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-ev-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ev-hint hover:text-ev-text"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
