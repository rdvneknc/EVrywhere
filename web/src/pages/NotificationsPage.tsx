import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import {
  markAllNotificationsRead,
  markNotificationRead,
  removeNotificationDoc,
  subscribeUserNotifications,
  timeAgo,
  type AppNotification,
} from '../api/notifications';

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/bildirimler', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeUserNotifications(
      user.uid,
      (list) => {
        setItems(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [user]);

  const onOpen = async (n: AppNotification) => {
    if (!n.isRead) {
      await markNotificationRead(n.id).catch(() => undefined);
    }
    if (n.conversationId) {
      navigate(`/mesajlar/${n.conversationId}`);
    } else if (n.topicId) {
      navigate(`/forum/${n.topicId}`);
    }
  };

  const onMarkAll = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await markAllNotificationsRead(user.uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await removeNotificationDoc(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
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

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
              Bildirimler
            </h1>
            <p className="mt-1 text-sm text-ev-muted">
              {unreadCount > 0
                ? `${unreadCount} okunmamış`
                : 'Tümü okundu'}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onMarkAll()}
              className="rounded-full border border-ev-border px-4 py-2 text-xs font-bold text-ev-muted hover:border-ev-primary hover:text-ev-primary disabled:opacity-60"
            >
              Tümünü okundu işaretle
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ev-border bg-ev-surface px-4 py-10 text-center text-sm text-ev-muted">
            Bildirim yok.{' '}
            <Link to="/forum" className="font-bold text-ev-primary">
              Foruma git
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border px-4 py-3 ${
                  n.isRead
                    ? 'border-ev-border bg-ev-surface'
                    : 'border-ev-primary/30 bg-ev-primary-light'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void onOpen(n)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="text-sm font-bold text-ev-text">
                      {n.title}
                    </div>
                    <p className="mt-0.5 text-xs text-ev-muted">{n.body}</p>
                    <div className="mt-1 text-[11px] text-ev-hint">
                      {timeAgo(n.time)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(n.id)}
                    className="shrink-0 text-xs font-bold text-ev-hint hover:text-red-600"
                    title="Sil"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
