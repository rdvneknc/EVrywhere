import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import {
  fetchUserPublicProfile,
  formatJoinDate,
  type UserPublicProfile,
} from '../api/users';
import { openOrCreateConversation } from '../api/messaging';
import {
  blockUser,
  createReport,
  messageForBlockRelation,
  promptReportReason,
  unblockUser,
} from '../api/moderation';
import { useBlockLists } from '../hooks/useBlockLists';

export function UserProfilePage() {
  const { userId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { relationWith } = useBlockLists();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const isSelf = !!user && user.uid === userId;

  const relation = isSelf ? 'none' : relationWith(userId);
  const blockMessage = messageForBlockRelation(relation);
  const iBlocked = relation === 'blocked' || relation === 'mutual';
  const contentHidden = relation !== 'none';

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    void fetchUserPublicProfile(userId)
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Profil yüklenemedi');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const startChat = async () => {
    if (!user) {
      navigate(`/giris?next=/u/${userId}`);
      return;
    }
    if (isSelf || contentHidden || messaging) return;
    setMessaging(true);
    setError(null);
    try {
      const id = await openOrCreateConversation(user, {
        userId,
        name: profile?.displayName ?? 'Üye',
        initials: profile?.initials ?? 'Ü',
        color: profile?.color ?? '#2DC653',
      });
      navigate(`/mesajlar/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mesaj açılamadı');
      setMessaging(false);
    }
  };

  const onReport = async () => {
    if (!user) {
      navigate(`/giris?next=/u/${userId}`);
      return;
    }
    const reason = promptReportReason();
    if (!reason) return;
    try {
      await createReport({
        reporterId: user.uid,
        targetType: 'user',
        targetId: userId,
        reason,
        targetLabel: profile?.displayName,
      });
      window.alert('Şikayet alındı.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şikayet gönderilemedi');
    }
  };

  const onToggleBlock = async () => {
    if (!user || isSelf) return;
    try {
      if (iBlocked) {
        await unblockUser(user.uid, userId);
      } else {
        if (!window.confirm('Bu kullanıcıyı engellemek istiyor musun?')) return;
        await blockUser(user.uid, userId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
    }
  };

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <Link to="/" className="text-sm font-semibold text-ev-primary">
          ← Ana sayfa
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : error && !profile ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : !profile ? (
          <p className="mt-8 text-sm text-ev-muted">Kullanıcı bulunamadı.</p>
        ) : contentHidden ? (
          <section className="mt-6 rounded-3xl border border-ev-border bg-ev-surface p-6 text-center">
            <h1 className="text-xl font-extrabold text-ev-text">
              {profile.displayName}
            </h1>
            <p className="mt-4 text-sm font-semibold text-amber-800 dark:text-amber-200">
              {blockMessage}
            </p>
            <p className="mt-2 text-sm text-ev-muted">
              Bu üyenin profili, ilanları ve içerikleri gizlendi.
            </p>
            {user && iBlocked ? (
              <button
                type="button"
                onClick={() => void onToggleBlock()}
                className="mt-5 rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-primary hover:border-ev-primary"
              >
                Engeli kaldır
              </button>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-ev-border bg-ev-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full text-lg font-extrabold"
                  style={{
                    backgroundColor: `${profile.color}22`,
                    color: profile.color,
                  }}
                >
                  {profile.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-extrabold text-ev-text">
                    {profile.displayName}
                  </h1>
                  <p className="mt-1 text-xs text-ev-hint">
                    Katılım: {formatJoinDate(profile.createdAt)}
                  </p>
                  {profile.bio ? (
                    <p className="mt-3 text-sm leading-relaxed text-ev-muted">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-ev-hint">
                      Bio yok.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Stat label="Konu" value={profile.topicCount} />
                <Stat label="Yanıt" value={profile.replyCount} />
                <Stat label="İlan" value={profile.listingCount} />
              </div>

              {isSelf ? (
                <Link
                  to="/profil"
                  className="mt-5 inline-flex rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary"
                >
                  Kendi profilini düzenle
                </Link>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={messaging}
                    onClick={() => void startChat()}
                    className="rounded-full bg-ev-primary px-4 py-2 text-xs font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
                  >
                    {messaging ? 'Açılıyor…' : 'Mesaj gönder'}
                  </button>
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void onToggleBlock()}
                        className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:border-red-300 hover:text-red-600"
                      >
                        Engelle
                      </button>
                      <button
                        type="button"
                        onClick={() => void onReport()}
                        className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:text-ev-text"
                      >
                        Şikayet et
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/giris?next=/u/${userId}`}
                      className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted"
                    >
                      Giriş yap
                    </Link>
                  )}
                </div>
              )}

              {error ? (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              ) : null}
            </section>

            <section className="mt-4 rounded-3xl border border-ev-border bg-ev-surface p-5">
              <h2 className="text-sm font-extrabold text-ev-text">Garaj</h2>
              {profile.garage ? (
                <div className="mt-3">
                  <div className="text-3xl">{profile.garage.emoji || '⚡'}</div>
                  <div className="mt-2 text-lg font-extrabold text-ev-text">
                    {profile.garage.brand} {profile.garage.model}
                  </div>
                  {profile.garage.year ? (
                    <div className="mt-1 text-sm text-ev-muted">
                      {profile.garage.year}
                    </div>
                  ) : null}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-ev-bg px-2 py-2">
                      <div className="font-bold text-ev-text">
                        {profile.garage.km || '—'}
                      </div>
                      <div className="text-ev-hint">km</div>
                    </div>
                    <div className="rounded-xl bg-ev-bg px-2 py-2">
                      <div className="font-bold text-ev-text">
                        {profile.garage.batteryHealth || '—'}
                      </div>
                      <div className="text-ev-hint">batarya</div>
                    </div>
                    <div className="rounded-xl bg-ev-bg px-2 py-2">
                      <div className="font-bold text-ev-text">
                        {profile.garage.rangeKm || '—'}
                      </div>
                      <div className="text-ev-hint">menzil</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 py-4 text-center text-sm text-ev-muted">
                  Garajda araç yok.
                </p>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
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
