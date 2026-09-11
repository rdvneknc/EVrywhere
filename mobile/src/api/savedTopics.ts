import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ForumTopic } from '../data/forum';
import { mapForumTopicDoc } from './forumTopics';

export type SavedTopicPreview = {
  topicId: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  authorId?: string;
  categoryId: string;
  brandId: string;
  photoUrl?: string;
  replies: number;
  savedAt: number;
};

function savedPath(userId: string, topicId: string) {
  return doc(db, 'users', userId, 'saved_topics', topicId);
}

export async function isTopicSaved(
  userId: string,
  topicId: string,
): Promise<boolean> {
  const snap = await getDoc(savedPath(userId, topicId));
  return snap.exists();
}

export function subscribeTopicSaved(
  userId: string,
  topicId: string,
  onData: (saved: boolean) => void,
): () => void {
  return onSnapshot(savedPath(userId, topicId), (snap) => {
    onData(snap.exists());
  });
}

export async function saveTopic(
  userId: string,
  topic: ForumTopic,
): Promise<void> {
  await setDoc(savedPath(userId, topic.id), {
    topicId: topic.id,
    title: topic.title,
    excerpt: topic.excerpt,
    authorName: topic.authorName,
    authorInitials: topic.authorInitials,
    authorColor: topic.authorColor,
    authorId: topic.authorId ?? null,
    categoryId: topic.categoryId,
    brandId: topic.brandId,
    photoUrl: topic.photoUrl ?? null,
    replies: topic.replies,
    savedAt: serverTimestamp(),
  });
}

export async function unsaveTopic(
  userId: string,
  topicId: string,
): Promise<void> {
  await deleteDoc(savedPath(userId, topicId));
}

export async function toggleSaveTopic(
  userId: string,
  topic: ForumTopic,
): Promise<boolean> {
  const exists = await isTopicSaved(userId, topic.id);
  if (exists) {
    await unsaveTopic(userId, topic.id);
    return false;
  }
  await saveTopic(userId, topic);
  return true;
}

export function subscribeSavedTopics(
  userId: string,
  onData: (items: SavedTopicPreview[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'users', userId, 'saved_topics'),
    orderBy('savedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: SavedTopicPreview[] = snap.docs.map((d) => {
        const data = d.data();
        const savedRaw = data.savedAt;
        let savedAt = Date.now();
        if (
          savedRaw &&
          typeof savedRaw === 'object' &&
          'toMillis' in savedRaw &&
          typeof (savedRaw as { toMillis: () => number }).toMillis === 'function'
        ) {
          savedAt = (savedRaw as { toMillis: () => number }).toMillis();
        }
        return {
          topicId: String(data.topicId ?? d.id),
          title: String(data.title ?? ''),
          excerpt: String(data.excerpt ?? ''),
          authorName: String(data.authorName ?? ''),
          authorInitials: String(data.authorInitials ?? 'EV'),
          authorColor: String(data.authorColor ?? '#2DC653'),
          authorId: data.authorId ? String(data.authorId) : undefined,
          categoryId: String(data.categoryId ?? 'general'),
          brandId: String(data.brandId ?? 'all'),
          photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
          replies: Number(data.replies ?? 0),
          savedAt,
        };
      });
      onData(items);
    },
    (err) => onError?.(err),
  );
}

export async function fetchSavedTopics(
  userId: string,
): Promise<SavedTopicPreview[]> {
  const q = query(
    collection(db, 'users', userId, 'saved_topics'),
    orderBy('savedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      topicId: String(data.topicId ?? d.id),
      title: String(data.title ?? ''),
      excerpt: String(data.excerpt ?? ''),
      authorName: String(data.authorName ?? ''),
      authorInitials: String(data.authorInitials ?? 'EV'),
      authorColor: String(data.authorColor ?? '#2DC653'),
      authorId: data.authorId ? String(data.authorId) : undefined,
      categoryId: String(data.categoryId ?? 'general'),
      brandId: String(data.brandId ?? 'all'),
      photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
      replies: Number(data.replies ?? 0),
      savedAt: Date.now(),
    };
  });
}

/** Kaydedilen önizlemeden tam konu; yoksa canlı doküman. */
export async function resolveSavedTopic(
  preview: SavedTopicPreview,
): Promise<ForumTopic> {
  const live = await getDoc(doc(db, 'forum_topics', preview.topicId));
  if (live.exists()) {
    return mapForumTopicDoc(live.id, live.data() as Record<string, unknown>);
  }
  return {
    id: preview.topicId,
    title: preview.title,
    excerpt: preview.excerpt,
    authorName: preview.authorName,
    authorInitials: preview.authorInitials,
    authorColor: preview.authorColor,
    authorId: preview.authorId,
    categoryId: preview.categoryId,
    brandId: preview.brandId,
    photoUrl: preview.photoUrl,
    timeAgo: 'Kaydedildi',
    readTime: '1 dk',
    replies: preview.replies,
    views: 0,
    comments: [],
  };
}
