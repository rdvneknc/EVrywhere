import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ConversationContextCard } from '../components/ConversationContextCard';
import { useAuth } from '../auth/AuthContext';
import {
  chatTimeAgo,
  markConversationRead,
  sendChatMessage,
  subscribeConversationMessages,
  subscribeConversationMeta,
  type ChatMessageDoc,
  type ConversationContext,
  type PeerProfile,
} from '../api/messaging';
import {
  messageForBlockRelation,
  type BlockRelation,
} from '../api/moderation';
import { useBlockLists } from '../hooks/useBlockLists';

export function ChatPage() {
  const { conversationId = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { relationWith } = useBlockLists();
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [peer, setPeer] = useState<PeerProfile | null>(null);
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const blockRelation: BlockRelation = relationWith(peer?.userId);
  const blockMessage = messageForBlockRelation(blockRelation);
  const messagingLocked = blockRelation !== 'none';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/giris?next=/mesajlar/${conversationId}`, { replace: true });
    }
  }, [authLoading, user, navigate, conversationId]);

  useEffect(() => {
    if (!user || !conversationId) return;
    setLoading(true);
    const unsubMeta = subscribeConversationMeta(
      conversationId,
      user.uid,
      (meta) => {
        if (!meta) {
          setError('Konuşma bulunamadı');
          setPeer(null);
          setContext(null);
          setLoading(false);
          return;
        }
        setPeer(meta.peer);
        setContext(meta.context);
        setLoading(false);
        void markConversationRead(conversationId, user.uid).catch(
          () => undefined,
        );
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    const unsubMsg = subscribeConversationMessages(
      conversationId,
      user.uid,
      setMessages,
      (err) => setError(err.message),
    );
    return () => {
      unsubMeta();
      unsubMsg();
    };
  }, [user, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !conversationId || !text.trim() || messagingLocked) return;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage(conversationId, user, text);
      setText('');
      await markConversationRead(conversationId, user.uid).catch(
        () => undefined,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi');
    } finally {
      setSending(false);
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

  const placeholder =
    context?.type === 'listing'
      ? 'İlan hakkında sor…'
      : context?.type === 'topic'
        ? 'Konu hakkında yaz…'
        : 'Mesaj yaz…';

  return (
    <div className="flex min-h-svh flex-col bg-ev-bg">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            to="/mesajlar"
            className="text-sm font-semibold text-ev-primary"
          >
            ← Mesajlar
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-ev-muted">Yükleniyor…</p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-ev-border bg-ev-surface px-4 py-3">
              {peer ? (
                <>
                  <Link
                    to={`/u/${peer.userId}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${peer.color}22`,
                      color: peer.color,
                    }}
                  >
                    {peer.initials}
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={`/u/${peer.userId}`}
                      className="block truncate text-sm font-extrabold text-ev-text hover:text-ev-primary"
                    >
                      {peer.name}
                    </Link>
                    <div className="truncate text-xs text-ev-hint">
                      Direkt mesaj
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-sm text-ev-muted">Konuşma</span>
              )}
            </div>

            {blockMessage ? (
              <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                {blockMessage}
              </div>
            ) : null}

            {context && context.type !== 'dm' ? (
              <div className="mb-3">
                <ConversationContextCard context={context} />
              </div>
            ) : null}

            <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-ev-border bg-ev-surface p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-ev-hint">
                  {messagingLocked
                    ? 'Mesaj gönderilemez.'
                    : context?.type === 'listing'
                      ? 'Bu ilan hakkında ilk mesajı sen yaz.'
                      : context?.type === 'topic'
                        ? 'Bu konu hakkında ilk mesajı sen yaz.'
                        : 'Henüz mesaj yok. İlk mesajı sen yaz.'}
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.fromMe
                          ? 'bg-ev-primary text-white'
                          : 'bg-ev-bg text-ev-text'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          m.fromMe ? 'text-white/70' : 'text-ev-hint'
                        }`}
                      >
                        {chatTimeAgo(m.time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {error ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            {messagingLocked ? (
              <p className="mt-3 rounded-xl border border-ev-border bg-ev-surface px-4 py-3 text-center text-sm text-ev-muted">
                {blockMessage}
              </p>
            ) : (
              <form onSubmit={onSend} className="mt-3 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                  placeholder={placeholder}
                  className="min-w-0 flex-1 rounded-xl border border-ev-border bg-ev-surface px-3 py-2.5 text-sm outline-none focus:border-ev-primary"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="rounded-xl bg-ev-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
                >
                  {sending ? '…' : 'Gönder'}
                </button>
              </form>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
