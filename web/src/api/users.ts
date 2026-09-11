import {
  Timestamp,
  collection,
  collectionGroup,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { updateProfile, type User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EV_PRIMARY } from '../data/forum';

export type UserGarage = {
  brand: string;
  model: string;
  year: string;
  km: string;
  batteryHealth: string;
  rangeKm: string;
  emoji: string;
};

export type UserPublicProfile = {
  userId: string;
  displayName: string;
  initials: string;
  color: string;
  bio: string;
  createdAt: Date | null;
  topicCount: number;
  replyCount: number;
  listingCount: number;
  garage: UserGarage | null;
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

function createdAtToDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function mapGarage(raw: unknown): UserGarage | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;
  const brand = String(g.brand ?? '').trim();
  const model = String(g.model ?? '').trim();
  if (!brand && !model) return null;
  return {
    brand,
    model,
    year: String(g.year ?? ''),
    km: String(g.km ?? ''),
    batteryHealth: String(g.batteryHealth ?? ''),
    rangeKm: String(g.rangeKm ?? ''),
    emoji: String(g.emoji ?? '⚡'),
  };
}

export async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const displayName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';
  const initials = initialsFromName(displayName);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName,
      initials,
      color: EV_PRIMARY,
      bio: '',
      createdAt: Timestamp.now(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(
    ref,
    {
      displayName,
      initials,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateMyProfile(
  user: User,
  input: {
    displayName: string;
    bio?: string;
    garage?: UserGarage | null;
  },
): Promise<void> {
  const displayName = input.displayName.trim() || 'Kullanıcı';
  const initials = initialsFromName(displayName);
  await updateProfile(user, { displayName });

  const patch: Record<string, unknown> = {
    displayName,
    initials,
    updatedAt: serverTimestamp(),
  };
  if (input.bio !== undefined) patch.bio = input.bio.trim().slice(0, 500);
  if (input.garage !== undefined) {
    patch.garage = input.garage
      ? {
          brand: input.garage.brand.trim(),
          model: input.garage.model.trim(),
          year: input.garage.year.trim(),
          km: input.garage.km.trim(),
          batteryHealth: input.garage.batteryHealth.trim(),
          rangeKm: input.garage.rangeKm.trim(),
          emoji: input.garage.emoji || '⚡',
        }
      : null;
  }
  await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
}

async function countListings(userId: string): Promise<number> {
  try {
    return (
      await getCountFromServer(
        query(collection(db, 'listings'), where('sellerUserId', '==', userId)),
      )
    ).data().count;
  } catch {
    try {
      return (
        await getDocs(
          query(
            collection(db, 'listings'),
            where('sellerUserId', '==', userId),
          ),
        )
      ).size;
    } catch {
      return 0;
    }
  }
}

export async function fetchUserPublicProfile(
  userId: string,
  fallback?: { name: string; initials: string; color: string },
): Promise<UserPublicProfile> {
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.exists() ? snap.data() : null;

  const displayName =
    (data?.displayName as string | undefined)?.trim() ||
    fallback?.name ||
    'Kullanıcı';
  const initials =
    (data?.initials as string | undefined) ||
    fallback?.initials ||
    initialsFromName(displayName);
  const color =
    (data?.color as string | undefined) || fallback?.color || EV_PRIMARY;

  let topicCount = 0;
  let replyCount = 0;
  try {
    topicCount = (
      await getCountFromServer(
        query(collection(db, 'forum_topics'), where('authorId', '==', userId)),
      )
    ).data().count;
  } catch {
    try {
      topicCount = (
        await getDocs(
          query(
            collection(db, 'forum_topics'),
            where('authorId', '==', userId),
          ),
        )
      ).size;
    } catch {
      topicCount = 0;
    }
  }

  try {
    replyCount = (
      await getCountFromServer(
        query(collectionGroup(db, 'comments'), where('authorId', '==', userId)),
      )
    ).data().count;
  } catch {
    replyCount = 0;
  }

  return {
    userId,
    displayName,
    initials,
    color,
    bio: String(data?.bio ?? ''),
    createdAt: createdAtToDate(data?.createdAt),
    topicCount,
    replyCount,
    listingCount: await countListings(userId),
    garage: mapGarage(data?.garage),
  };
}

export function formatJoinDate(date: Date | null): string {
  if (!date) return 'Bilinmiyor';
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
