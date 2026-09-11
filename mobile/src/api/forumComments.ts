import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { ForumComment } from '../data/forum';
import { EVColors } from '../theme/colors';
import { formatTimeAgo } from './forumTopics';
import { createNotification } from './notifications';
import { assertRateLimit } from '../lib/rateLimit';
import {
  FIRESTORE_COVER_BYTES,
  compressImageUnderBytes,
  uriToJpegDataUri,
} from '../lib/imageCompress';

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

export type StoredForumComment = ForumComment & {
  id: string;
  authorId?: string;
};

export function mapForumCommentDoc(
  id: string,
  data: Record<string, unknown>,
): StoredForumComment {
  const created = createdAtToDate(data.createdAt);
  return {
    id,
    authorId: data.authorId ? String(data.authorId) : undefined,
    authorName: String(data.authorName ?? 'Kullanıcı'),
    authorInitials: String(data.authorInitials ?? 'KU'),
    authorColor: String(data.authorColor ?? EVColors.primary),
    text: String(data.text ?? ''),
    timeAgo: formatTimeAgo(created),
    likes: Number(data.likes ?? 0),
    photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
  };
}

export function subscribeForumComments(
  topicId: string,
  onData: (comments: StoredForumComment[]) => void,
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

export async function fetchForumComments(
  topicId: string,
): Promise<StoredForumComment[]> {
  const q = query(
    collection(db, 'forum_topics', topicId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapForumCommentDoc(d.id, d.data() as Record<string, unknown>),
  );
}

export async function addForumComment(
  topicId: string,
  user: User,
  text: string,
  localPhotoUri?: string,
): Promise<void> {
  const authorName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';
  const authorInitials = initialsFromName(authorName);
  const trimmed = text.trim();

  if (!trimmed && !localPhotoUri) {
    throw new Error('Yorum veya fotoğraf gerekli.');
  }
  if (trimmed.length > 2000) {
    throw new Error('Yorum en fazla 2000 karakter olabilir.');
  }
  assertRateLimit(`forumComment:${user.uid}`, 15, 60_000);

  let photoUrl: string | undefined;
  if (localPhotoUri) {
    const compressed = await compressImageUnderBytes(
      localPhotoUri,
      FIRESTORE_COVER_BYTES,
      1200,
    );
    photoUrl = await uriToJpegDataUri(compressed.uri);
  }

  const topicSnap = await getDoc(doc(db, 'forum_topics', topicId));
  const topicData = topicSnap.exists() ? topicSnap.data() : null;
  const topicAuthorId = topicData?.authorId
    ? String(topicData.authorId)
    : undefined;

  const payload: Record<string, unknown> = {
    text: trimmed,
    authorId: user.uid,
    authorName,
    authorInitials,
    authorColor: EVColors.primary,
    likes: 0,
    createdAt: serverTimestamp(),
  };
  if (photoUrl) payload.photoUrl = photoUrl;

  await addDoc(collection(db, 'forum_topics', topicId, 'comments'), payload);

  await updateDoc(doc(db, 'forum_topics', topicId), {
    replies: increment(1),
  });

  if (topicAuthorId && topicAuthorId !== user.uid) {
    const preview = trimmed
      ? trimmed.length > 80
        ? `${trimmed.slice(0, 80)}…`
        : trimmed
      : '📷 bir fotoğraf ekledi';
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

/** Yanıtı siler ve konu replies sayacını düşürür (yalnızca yazar — rules). */
export async function deleteForumComment(
  topicId: string,
  commentId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'forum_topics', topicId, 'comments', commentId));
  await updateDoc(doc(db, 'forum_topics', topicId), {
    replies: increment(-1),
  }).catch(() => undefined);
}
