import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EVColors } from '../theme/colors';
import { formatTimeAgo } from './forumTopics';
import { assertRateLimit } from '../lib/rateLimit';

const COLLECTION = 'posts';

export type StationReview = {
  id: string;
  stationOcmId: number;
  stationName: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  rating: number;
  text: string;
  timeAgo: string;
  createdAtMs: number;
};

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

function mapReview(
  id: string,
  data: Record<string, unknown>,
): StationReview {
  const created =
    data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
  return {
    id,
    stationOcmId: Number(data.stationOcmId ?? 0),
    stationName: String(data.stationName ?? ''),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? 'Kullanıcı'),
    authorInitials: String(data.authorInitials ?? 'KU'),
    authorColor: String(data.authorColor ?? EVColors.primary),
    rating: Math.min(5, Math.max(0, Number(data.rating ?? 0))),
    text: String(data.text ?? ''),
    timeAgo: formatTimeAgo(created),
    createdAtMs: created?.getTime() ?? 0,
  };
}

export function averageRating(reviews: StationReview[]): number | null {
  const rated = reviews.filter((r) => r.rating > 0);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

export function subscribeStationReviews(
  stationOcmId: number,
  onData: (reviews: StationReview[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('type', '==', 'charging_review'),
    where('stationOcmId', '==', stationOcmId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) =>
        mapReview(d.id, d.data() as Record<string, unknown>),
      );
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (err) => onError?.(err),
  );
}

/** İstasyona puan/yorum yazar veya kendi kaydını günceller (1 üye = 1 inceleme). */
export async function upsertStationReview(
  user: User,
  input: {
    stationOcmId: number;
    stationName: string;
    rating: number;
    text?: string;
  },
): Promise<void> {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const text = (input.text ?? '').trim();
  if (!rating && !text) throw new Error('Puan veya yorum gerekli.');
  if (text.length > 1000) {
    throw new Error('Yorum en fazla 1000 karakter olabilir.');
  }
  assertRateLimit(`chargeReview:${user.uid}`, 10, 60_000);

  const authorName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';

  const existing = await getDocs(
    query(
      collection(db, COLLECTION),
      where('type', '==', 'charging_review'),
      where('stationOcmId', '==', input.stationOcmId),
      where('authorId', '==', user.uid),
    ),
  );

  const payload = {
    type: 'charging_review' as const,
    stationOcmId: input.stationOcmId,
    stationName: input.stationName,
    authorId: user.uid,
    authorName,
    authorInitials: initialsFromName(authorName),
    authorColor: EVColors.primary,
    rating,
    text,
    updatedAt: serverTimestamp(),
  };

  if (!existing.empty) {
    const prev = existing.docs[0];
    const prevData = prev.data();
    await updateDoc(prev.ref, {
      ...payload,
      rating: rating || Number(prevData.rating ?? 0),
      text: text || String(prevData.text ?? ''),
    });
    return;
  }

  await addDoc(collection(db, COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function deleteStationReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, reviewId));
}

/** Sıralama için createdAt varsa kullan — subscribe fallback */
export async function fetchStationReviews(
  stationOcmId: number,
): Promise<StationReview[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('type', '==', 'charging_review'),
        where('stationOcmId', '==', stationOcmId),
        orderBy('createdAt', 'desc'),
      ),
    );
    return snap.docs.map((d) =>
      mapReview(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('type', '==', 'charging_review'),
        where('stationOcmId', '==', stationOcmId),
      ),
    );
    return snap.docs.map((d) =>
      mapReview(d.id, d.data() as Record<string, unknown>),
    );
  }
}
