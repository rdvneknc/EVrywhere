import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EV_PRIMARY, type ForumTopic } from '../data/forum';
import { assertRateLimit } from '../lib/rateLimit';

const COLLECTION = 'forum_topics';

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

export function formatTimeAgo(date: Date | null): string {
  if (!date) return 'Yakın zamanda';
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 45) return 'Şimdi';
  if (sec < 3600) return `${Math.floor(sec / 60)} dk önce`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} saat önce`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)} gün önce`;
  return date.toLocaleDateString('tr-TR');
}

function createdAtToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function mapForumTopicDoc(
  id: string,
  data: Record<string, unknown>,
): ForumTopic {
  const created = createdAtToDate(data.createdAt);
  const photoRaw =
    data.photoUrl ??
    data.coverPhoto ??
    (Array.isArray(data.photos) && data.photos[0] ? data.photos[0] : null);
  return {
    id,
    title: String(data.title ?? ''),
    excerpt: String(data.excerpt ?? ''),
    authorName: String(data.authorName ?? 'Kullanıcı'),
    authorInitials: String(data.authorInitials ?? 'KU'),
    authorColor: String(data.authorColor ?? EV_PRIMARY),
    authorId: data.authorId ? String(data.authorId) : undefined,
    categoryId: String(data.categoryId ?? 'general'),
    brandId: String(data.brandId ?? 'all'),
    timeAgo: formatTimeAgo(created),
    replies: Number(data.replies ?? 0),
    views: Number(data.views ?? 0),
    photoUrl: photoRaw ? String(photoRaw) : undefined,
    createdAtMs: created?.getTime() ?? 0,
  };
}

export function subscribeForumTopics(
  onData: (topics: ForumTopic[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapForumTopicDoc(d.id, d.data() as Record<string, unknown>),
        ),
      );
    },
    (err) => onError?.(err),
  );
}

export async function fetchForumTopic(
  topicId: string,
): Promise<ForumTopic | null> {
  const snap = await getDoc(doc(db, COLLECTION, topicId));
  if (!snap.exists()) return null;
  return mapForumTopicDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function incrementTopicViews(topicId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, topicId), {
    views: increment(1),
  }).catch(() => undefined);
}

export async function createForumTopic(
  user: User,
  input: {
    title: string;
    excerpt: string;
    categoryId: string;
  },
): Promise<string> {
  const title = input.title.trim();
  if (!title) throw new Error('Başlık gerekli.');
  if (title.length > 200) throw new Error('Başlık en fazla 200 karakter.');
  const excerpt = input.excerpt.trim();
  if (excerpt.length > 2000) throw new Error('İçerik en fazla 2000 karakter.');
  assertRateLimit(`forumTopic:${user.uid}`, 5, 60_000);

  const authorName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';

  const ref = await addDoc(collection(db, COLLECTION), {
    title,
    excerpt,
    authorName,
    authorInitials: initialsFromName(authorName),
    authorColor: EV_PRIMARY,
    authorId: user.uid,
    categoryId: input.categoryId || 'general',
    brandId: 'all',
    replies: 0,
    views: 1,
    isPinned: false,
    isHot: false,
    readTime: '1 dk',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchTopicsByAuthor(
  authorId: string,
): Promise<ForumTopic[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      limit(30),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapForumTopicDoc(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where('authorId', '==', authorId)),
    );
    return snap.docs
      .map((d) =>
        mapForumTopicDoc(d.id, d.data() as Record<string, unknown>),
      )
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, 30);
  }
}

export async function deleteForumTopic(topicId: string): Promise<void> {
  const commentsSnap = await getDocs(
    collection(db, COLLECTION, topicId, 'comments'),
  );
  const docs = commentsSnap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, COLLECTION, topicId));
}
