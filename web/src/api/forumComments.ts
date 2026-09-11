import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EV_PRIMARY, type ForumComment } from '../data/forum';
import { formatTimeAgo } from './forumTopics';
import { assertRateLimit } from '../lib/rateLimit';
import { createNotification } from './notifications';

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'EV'
  );
}

function createdAtToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function mapForumCommentDoc(
  id: string,
  data: Record<string, unknown>,
): ForumComment {
  const created = createdAtToDate(data.createdAt);
  return {
    id,
    authorId: data.authorId ? String(data.authorId) : undefined,
    authorName: String(data.authorName ?? 'Kullanıcı'),
    authorInitials: String(data.authorInitials ?? 'KU'),
    authorColor: String(data.authorColor ?? EV_PRIMARY),
    text: String(data.text ?? ''),
    timeAgo: formatTimeAgo(created),
    photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
  };
}

export function subscribeForumComments(
  topicId: string,
  onData: (comments: ForumComment[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'forum_topics', topicId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapForumCommentDoc(d.id, d.data() as Record<string, unknown>),
        ),
      );
    },
    (err) => onError?.(err),
  );
}

export async function addForumComment(
  topicId: string,
  user: User,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Yanıt boş olamaz.');
  if (trimmed.length > 2000) {
    throw new Error('Yanıt en fazla 2000 karakter olabilir.');
  }
  assertRateLimit(`forumComment:${user.uid}`, 15, 60_000);

  const authorName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';

  const topicSnap = await getDoc(doc(db, 'forum_topics', topicId));
  const topicAuthorId = topicSnap.exists()
    ? String(topicSnap.data().authorId ?? '')
    : '';

  await addDoc(collection(db, 'forum_topics', topicId, 'comments'), {
    text: trimmed,
    authorId: user.uid,
    authorName,
    authorInitials: initialsFromName(authorName),
    authorColor: EV_PRIMARY,
    likes: 0,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'forum_topics', topicId), {
    replies: increment(1),
  });

  if (topicAuthorId && topicAuthorId !== user.uid) {
    const preview =
      trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
    await createNotification({
      actorId: user.uid,
      userId: topicAuthorId,
      type: 'forum',
      title: 'Yeni forum yanıtı',
      body: `${authorName}: ${preview}`,
      topicId,
    }).catch(() => undefined);
  }
}

export async function deleteForumComment(
  topicId: string,
  commentId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'forum_topics', topicId, 'comments', commentId));
  await updateDoc(doc(db, 'forum_topics', topicId), {
    replies: increment(-1),
  }).catch(() => undefined);
}
