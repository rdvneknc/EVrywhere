import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  CATEGORY_BADGE,
  type ForumComment,
  type ForumTopic,
} from '../data/forum';
import {
  deleteForumTopic,
  fetchForumTopic,
  incrementTopicViews,
} from '../api/forumTopics';
import {
  addForumComment,
  deleteForumComment,
  subscribeForumComments,
} from '../api/forumComments';
import {
  subscribeTopicSaved,
  toggleSaveTopic,
} from '../api/savedTopics';
import { createReport, promptReportReason } from '../api/moderation';
import { useAuth } from '../auth/AuthContext';

export function TopicDetailPage() {
  const { topicId = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [togglingSave, setTogglingSave] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!topicId) return;
    let alive = true;
    setLoading(true);
    void fetchForumTopic(topicId)
      .then((t) => {
        if (!alive) return;
        setTopic(t);
        if (t) void incrementTopicViews(t.id);
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'Konu yüklenemedi');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [topicId]);

  useEffect(() => {
    if (!topicId) return;
    return subscribeForumComments(topicId, setComments, () => undefined);
  }, [topicId]);

  useEffect(() => {
    if (!user || !topicId) {
      setSaved(false);
      return;
    }
    return subscribeTopicSaved(user.uid, topicId, setSaved);
  }, [user, topicId]);

  const isTopicOwner =
    !!user && !!topic?.authorId && user.uid === topic.authorId;

  const onReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;
    setSaving(true);
    setReplyError(null);
    try {
      await addForumComment(topicId, user, reply);
      setReply('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Gönderilemedi');
    } finally {
      setSaving(false);
    }
  };

  const onToggleSave = async () => {
    if (!user || !topic) {
      navigate(`/giris?next=/forum/${topicId}`);
      return;
    }
    if (togglingSave) return;
    setTogglingSave(true);
    try {
      const next = await toggleSaveTopic(user.uid, topic);
      setSaved(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setTogglingSave(false);
    }
  };

  const onDeleteTopic = async () => {
    if (!topic || !isTopicOwner) return;
    if (!window.confirm('Konuyu silmek istediğine emin misin?')) return;
    setDeleting(true);
    try {
      await deleteForumTopic(topic.id);
      navigate('/forum');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
      setDeleting(false);
    }
  };

  const onDeleteComment = async (commentId: string) => {
    if (!topicId) return;
    if (!window.confirm('Yanıtı silmek istediğine emin misin?')) return;
    try {
      await deleteForumComment(topicId, commentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yanıt silinemedi');
    }
  };

  const onReportTopic = async () => {
    if (!user || !topic) {
      navigate(`/giris?next=/forum/${topicId}`);
      return;
    }
    const reason = promptReportReason();
    if (!reason) return;
    try {
      await createReport({
        reporterId: user.uid,
        targetType: 'topic',
        targetId: topic.id,
        reason,
        targetLabel: topic.title,
      });
      window.alert('Şikayet alındı.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şikayet gönderilemedi');
    }
  };

  const onReportComment = async (c: ForumComment) => {
    if (!user) {
      navigate(`/giris?next=/forum/${topicId}`);
      return;
    }
    const reason = promptReportReason();
    if (!reason) return;
    try {
      await createReport({
        reporterId: user.uid,
        targetType: 'comment',
        targetId: c.id,
        reason,
        targetLabel: c.text.slice(0, 80),
      });
      window.alert('Şikayet alındı.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şikayet gönderilemedi');
    }
  };

  const badge = topic
    ? (CATEGORY_BADGE[topic.categoryId] ?? CATEGORY_BADGE.general)
    : null;

  return (
    <div className="min-h-svh bg-ev-bg">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <Link to="/forum" className="text-sm font-semibold text-ev-primary">
          ← Forum
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-ev-muted">Yükleniyor…</p>
        ) : error && !topic ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : !topic ? (
          <p className="mt-8 text-sm text-ev-muted">Konu bulunamadı.</p>
        ) : (
          <>
            <article className="mt-6 rounded-3xl border border-ev-border bg-ev-surface p-5 sm:p-6">
              {badge ? (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>
              ) : null}
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ev-text">
                {topic.title}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                {topic.authorId ? (
                  <Link
                    to={`/u/${topic.authorId}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${topic.authorColor}22`,
                      color: topic.authorColor,
                    }}
                  >
                    {topic.authorInitials}
                  </Link>
                ) : (
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold"
                    style={{
                      backgroundColor: `${topic.authorColor}22`,
                      color: topic.authorColor,
                    }}
                  >
                    {topic.authorInitials}
                  </div>
                )}
                <div className="text-sm">
                  {topic.authorId ? (
                    <Link
                      to={`/u/${topic.authorId}`}
                      className="font-bold text-ev-text hover:text-ev-primary"
                    >
                      {topic.authorName}
                    </Link>
                  ) : (
                    <div className="font-bold text-ev-text">
                      {topic.authorName}
                    </div>
                  )}
                  <div className="text-xs text-ev-hint">
                    {topic.timeAgo} · 💬 {topic.replies} · 👁 {topic.views}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={togglingSave}
                  onClick={() => void onToggleSave()}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    saved
                      ? 'bg-ev-primary-light text-ev-primary-dark'
                      : 'border border-ev-border text-ev-muted hover:border-ev-primary hover:text-ev-primary'
                  }`}
                >
                  {saved ? '★ Kaydedildi' : '☆ Kaydet'}
                </button>
                {isTopicOwner ? (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void onDeleteTopic()}
                    className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {deleting ? 'Siliniyor…' : 'Konuyu sil'}
                  </button>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => void onReportTopic()}
                    className="rounded-full border border-ev-border px-3 py-1.5 text-xs font-bold text-ev-muted hover:text-ev-text"
                  >
                    Şikayet et
                  </button>
                ) : null}
              </div>

              {topic.photoUrl ? (
                <img
                  src={topic.photoUrl}
                  alt=""
                  className="mt-4 max-h-80 w-full rounded-2xl object-cover"
                />
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ev-muted">
                {topic.excerpt || '—'}
              </p>
            </article>

            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}

            <section className="mt-8">
              <h2 className="text-lg font-extrabold text-ev-text">
                Yanıtlar ({comments.length})
              </h2>
              <ul className="mt-4 space-y-3">
                {comments.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-ev-border bg-ev-surface px-4 py-6 text-center text-sm text-ev-hint">
                    Henüz yanıt yok. İlk yanıtı sen yaz.
                  </li>
                ) : (
                  comments.map((c, i) => {
                    const isCommentOwner =
                      !!user && !!c.authorId && user.uid === c.authorId;
                    return (
                      <li
                        key={c.id}
                        className="rounded-2xl border border-ev-border bg-ev-surface p-4"
                      >
                        <div className="flex items-center gap-2">
                          {c.authorId ? (
                            <Link
                              to={`/u/${c.authorId}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold"
                              style={{
                                backgroundColor: `${c.authorColor}22`,
                                color: c.authorColor,
                              }}
                            >
                              {c.authorInitials}
                            </Link>
                          ) : (
                            <div
                              className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold"
                              style={{
                                backgroundColor: `${c.authorColor}22`,
                                color: c.authorColor,
                              }}
                            >
                              {c.authorInitials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1 text-xs">
                            {c.authorId ? (
                              <Link
                                to={`/u/${c.authorId}`}
                                className="font-bold text-ev-text hover:text-ev-primary"
                              >
                                {c.authorName}
                              </Link>
                            ) : (
                              <span className="font-bold text-ev-text">
                                {c.authorName}
                              </span>
                            )}
                            <span className="text-ev-hint">
                              {' '}
                              · #{i + 1} · {c.timeAgo}
                            </span>
                          </div>
                          {isCommentOwner ? (
                            <button
                              type="button"
                              onClick={() => void onDeleteComment(c.id)}
                              className="text-[11px] font-bold text-red-600 hover:underline"
                            >
                              Sil
                            </button>
                          ) : user ? (
                            <button
                              type="button"
                              onClick={() => void onReportComment(c)}
                              className="text-[11px] font-bold text-ev-hint hover:text-ev-text"
                            >
                              Şikayet
                            </button>
                          ) : null}
                        </div>
                        {c.photoUrl ? (
                          <img
                            src={c.photoUrl}
                            alt=""
                            className="mt-3 max-h-56 rounded-xl object-cover"
                          />
                        ) : null}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ev-muted">
                          {c.text}
                        </p>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="mt-6 rounded-2xl border border-ev-border bg-ev-surface p-4">
                {user ? (
                  <form onSubmit={onReply}>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Yanıtını yaz…"
                      className="w-full rounded-xl border border-ev-border bg-ev-bg px-3 py-2 text-sm outline-none focus:border-ev-primary"
                    />
                    {replyError ? (
                      <p className="mt-2 text-sm text-red-600">{replyError}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={saving || !reply.trim()}
                      className="mt-3 rounded-full bg-ev-primary px-5 py-2.5 text-sm font-extrabold text-white hover:bg-ev-primary-dark disabled:opacity-60"
                    >
                      {saving ? 'Gönderiliyor…' : 'Yanıtı gönder'}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-ev-muted">
                    Yanıt yazmak için{' '}
                    <Link
                      to={`/giris?next=/forum/${topicId}`}
                      className="font-bold text-ev-primary"
                    >
                      giriş yap
                    </Link>
                    .
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
