import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { ForumTopic } from '../data/forum';
import { EVColors } from '../theme/colors';
import {
  FIRESTORE_COVER_BYTES,
  compressImageUnderBytes,
  uriToJpegDataUri,
} from '../lib/imageCompress';
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
    authorColor: String(data.authorColor ?? EVColors.primary),
    authorId: data.authorId ? String(data.authorId) : undefined,
    categoryId: String(data.categoryId ?? 'general'),
    brandId: String(data.brandId ?? 'all'),
    timeAgo: formatTimeAgo(created),
    readTime: String(data.readTime ?? '1 dk'),
    replies: Number(data.replies ?? 0),
    views: Number(data.views ?? 0),
    isPinned: Boolean(data.isPinned),
    isHot: Boolean(data.isHot),
    photoUrl: photoRaw ? String(photoRaw) : undefined,
    comments: [],
  };
}

export type CreateForumTopicInput = {
  title: string;
  excerpt: string;
  categoryId: string;
  brandId: string;
  /** Yerel galeri URI — sıkıştırılıp data URI olarak kaydedilir */
  localPhotoUri?: string;
};

export async function createForumTopic(
  user: User,
  input: CreateForumTopicInput,
): Promise<ForumTopic> {
  const title = input.title.trim();
  if (!title) throw new Error('Başlık gerekli.');
  if (title.length > 200) throw new Error('Başlık en fazla 200 karakter.');
  if ((input.excerpt ?? '').trim().length > 2000) {
    throw new Error('İçerik en fazla 2000 karakter.');
  }
  assertRateLimit(`forumTopic:${user.uid}`, 5, 60_000);

  const authorName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';
  const authorInitials = initialsFromName(authorName);

  let photoUrl: string | undefined;
  if (input.localPhotoUri) {
    const compressed = await compressImageUnderBytes(
      input.localPhotoUri,
      FIRESTORE_COVER_BYTES,
      1200,
    );
    photoUrl = await uriToJpegDataUri(compressed.uri);
  }

  const payload: Record<string, unknown> = {
    title,
    excerpt: input.excerpt.trim(),
    authorName,
    authorInitials,
    authorColor: EVColors.primary,
    authorId: user.uid,
    categoryId: input.categoryId,
    brandId: input.brandId,
    replies: 0,
    views: 1,
    isPinned: false,
    isHot: false,
    readTime: '1 dk',
    createdAt: serverTimestamp(),
  };
  if (photoUrl) {
    payload.photoUrl = photoUrl;
  }

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return mapForumTopicDoc(ref.id, {
    ...payload,
    createdAt: Timestamp.now(),
  });
}

/** Realtime: yeni konular tüm cihazlarda güncellenir. */
export async function fetchForumTopics(): Promise<ForumTopic[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) =>
    mapForumTopicDoc(doc.id, doc.data() as Record<string, unknown>),
  );
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
      const topics = snap.docs.map((doc) =>
        mapForumTopicDoc(doc.id, doc.data() as Record<string, unknown>),
      );
      onData(topics);
    },
    (err) => {
      onError?.(err);
    },
  );
}

/** Bir üyenin açtığı konular (yeniden eskiye). */
export async function fetchForumTopicsByAuthor(
  authorId: string,
): Promise<ForumTopic[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapForumTopicDoc(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    // Composite index yoksa sadece authorId ile çekip client’ta sırala
    const q = query(
      collection(db, COLLECTION),
      where('authorId', '==', authorId),
      limit(100),
    );
    const snap = await getDocs(q);
    const topics = snap.docs.map((d) =>
      mapForumTopicDoc(d.id, d.data() as Record<string, unknown>),
    );
    return topics;
  }
}

/** Konuyu ve altındaki yorumları siler (yalnızca yazar — rules). */
export async function deleteForumTopic(topicId: string): Promise<void> {
  const commentsSnap = await getDocs(
    collection(db, COLLECTION, topicId, 'comments'),
  );
  const docs = commentsSnap.docs;
  try {
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('permission') || msg.includes('Permission')) {
      throw new Error(
        'Yanıtlar silinemedi. Firebase kurallarını güncelleyip Publish et, sonra tekrar dene.',
      );
    }
    throw e;
  }
  try {
    await deleteDoc(doc(db, COLLECTION, topicId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('permission') || msg.includes('Permission')) {
      throw new Error(
        'Konu silinemedi (izin). Profil adın konu yazarıyla aynı mı kontrol et; kuralları Publish ettiğinden emin ol.',
      );
    }
    throw e;
  }
}
