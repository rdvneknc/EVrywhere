import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import {
  chatTimeAgo,
  subscribeMyConversations,
  type ConversationSummary,
} from '../api/messaging';
import { useBlockLists } from '../hooks/useBlockLists';

export function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { blockedByIds, blockedIds } = useBlockLists();
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/giris?next=/mesajlar', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeMyConversations(
      user.uid,
      (items) => {
        setConversations(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-svh bg-ev-bg">
        <Header />
        <p className="p-10 text-center text-sm text-ev-muted">Yükleniyor…</p>
      </div>
    );
  }

  // Beni engelleyenleri gizle; benim engellediklerim listede kalsın (engel kaldırmak için)
  const visible = conversations.filter(
    (c) => !blockedByIds.includes(c.peer.userId),
  );

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ev-text">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-ev-muted">Konuşmaların</p>

        {error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ev-border bg-ev-surface px-4 py-10 text-center text-sm text-ev-muted">
            Henüz mesajın yok.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-ev-divider overflow-hidden rounded-3xl border border-ev-border bg-ev-surface">
            {visible.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/mesajlar/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ev-bg"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${c.peer.color}22`,
                      color: c.peer.color,
                    }}
                  >
                    {c.peer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-ev-text">
                        {c.peer.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-ev-hint">
                        {c.lastMessageAt ? chatTimeAgo(c.lastMessageAt) : ''}
                      </span>
                    </div>
                    {blockedIds.includes(c.peer.userId) ? (
                      <div className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Engelledin
                      </div>
                    ) : null}
                    {c.context && c.context.type !== 'dm' ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-ev-primary">
                        <span aria-hidden>
                          {c.context.type === 'listing' ? '🚗' : '💬'}
                        </span>
                        <span className="truncate">{c.context.title}</span>
                      </div>
                    ) : null}
                    <div className="mt-0.5 truncate text-xs text-ev-muted">
                      {c.lastMessage || 'Henüz mesaj yok'}
                    </div>
                  </div>
                  {c.unread > 0 ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ev-primary px-1.5 text-[10px] font-extrabold text-white">
                      {c.unread > 99 ? '99+' : c.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
