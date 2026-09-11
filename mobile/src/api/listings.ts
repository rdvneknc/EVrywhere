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
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EvListing, EV_BRANDS } from '../data/marketplace';
import { EVColors } from '../theme/colors';
import { formatTimeAgo } from './forumTopics';
import {
  FIRESTORE_COVER_BYTES,
  FIRESTORE_PHOTO_BYTES,
  compressImageUnderBytes,
  uriToJpegDataUri,
} from '../lib/imageCompress';
import { assertRateLimit } from '../lib/rateLimit';

const COLLECTION = 'listings';

export type CreateListingInput = {
  brandId: string;
  model: string;
  year: number;
  price: number;
  km: number;
  location: string;
  sellerType: string;
  damageStatus: string;
  description?: string;
  batteryHealth: number;
  range: number;
  chargeType: string;
  color: string;
  warranty: string;
  acChargePower: number;
  dcChargePower: number;
  batteryCapacity: number;
  motorPower: number;
  drivetrain: string;
  localPhotoUris: string[];
};

export type UpdateListingInput = {
  price?: number;
  km?: number;
  location?: string;
  sellerType?: string;
  damageStatus?: string;
  description?: string;
  batteryHealth?: number;
  color?: string;
  warranty?: string;
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

function darken(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Storage yokken: fotoğrafları Firestore alt koleksiyonunda data-URI olarak tut.
 * Kapak görseli ilan dokümanında (liste kartı için).
 */
async function preparePhotosForFirestore(localUris: string[]): Promise<{
  coverDataUri: string;
  photoDataUris: string[];
}> {
  const photoDataUris: string[] = [];
  for (let i = 0; i < localUris.length; i += 1) {
    const compressed = await compressImageUnderBytes(
      localUris[i],
      FIRESTORE_PHOTO_BYTES,
      1280,
    );
    photoDataUris.push(await uriToJpegDataUri(compressed.uri));
  }

  const coverFile = await compressImageUnderBytes(
    localUris[0],
    FIRESTORE_COVER_BYTES,
    720,
  );
  const coverDataUri = await uriToJpegDataUri(coverFile.uri);
  return { coverDataUri, photoDataUris };
}

export function mapListingDoc(
  id: string,
  data: Record<string, unknown>,
): EvListing {
  const brand =
    EV_BRANDS.find((b) => b.id === data.brandId) ?? EV_BRANDS[0];
  const created =
    data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
  const brandColor = brand.color;
  const rawColor = String(data.color ?? '');
  const color =
    rawColor && !rawColor.startsWith('#') ? rawColor : 'Belirtilmedi';

  const cover = data.coverPhoto ? String(data.coverPhoto) : '';
  const photosArr = Array.isArray(data.photos)
    ? (data.photos as string[])
    : [];
  const photos =
    photosArr.length > 0 ? photosArr : cover ? [cover] : [];

  return {
    id,
    brandId: String(data.brandId ?? brand.id),
    model: String(data.model ?? ''),
    location: String(data.location ?? ''),
    sellerName: String(data.sellerName ?? 'Kullanıcı'),
    sellerInitials: String(data.sellerInitials ?? 'KU'),
    sellerColor: String(data.sellerColor ?? EVColors.primary),
    sellerUserId: data.sellerUserId ? String(data.sellerUserId) : undefined,
    year: Number(data.year ?? new Date().getFullYear()),
    km: Number(data.km ?? 0),
    price: Number(data.price ?? 0),
    batteryHealth: Number(data.batteryHealth ?? 95),
    range: Number(data.range ?? 400),
    chargeType: String(data.chargeType ?? 'CCS2'),
    sellerType: String(data.sellerType ?? 'Sahibinden'),
    damageStatus: String(data.damageStatus ?? 'Kazasız'),
    postedAgo: formatTimeAgo(created),
    gradient: [darken(brandColor, 0.65), brandColor],
    emoji: brand.emoji,
    isFeatured: Boolean(data.isFeatured),
    color,
    warranty: String(data.warranty ?? 'Yok'),
    acChargePower: Number(data.acChargePower ?? 11),
    dcChargePower: Number(data.dcChargePower ?? 150),
    batteryCapacity: Number(data.batteryCapacity ?? 75),
    motorPower: Number(data.motorPower ?? 200),
    drivetrain: String(data.drivetrain ?? 'Arkadan İtiş'),
    paintedParts: Array.isArray(data.paintedParts)
      ? (data.paintedParts as string[])
      : [],
    replacedParts: Array.isArray(data.replacedParts)
      ? (data.replacedParts as string[])
      : [],
    photos,
    description: data.description ? String(data.description) : undefined,
  };
}

export async function createListing(
  user: User,
  input: CreateListingInput,
): Promise<EvListing> {
  if (input.localPhotoUris.length < 1) {
    throw new Error('En az 1 fotoğraf ekle.');
  }
  if (input.localPhotoUris.length > 8) {
    throw new Error('En fazla 8 fotoğraf ekleyebilirsin.');
  }
  assertRateLimit(`listing:${user.uid}`, 3, 60_000);

  const brand = EV_BRANDS.find((b) => b.id === input.brandId);
  if (!brand) throw new Error('Geçersiz marka.');

  const sellerName =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';

  const { coverDataUri, photoDataUris } = await preparePhotosForFirestore(
    input.localPhotoUris,
  );

  const payload = {
    brandId: input.brandId,
    model: input.model.trim(),
    year: input.year,
    price: input.price,
    km: input.km,
    location: input.location.trim(),
    sellerType: input.sellerType,
    damageStatus: input.damageStatus,
    description: (input.description ?? '').trim(),
    batteryHealth: input.batteryHealth,
    range: input.range,
    chargeType: input.chargeType,
    sellerUserId: user.uid,
    sellerName,
    sellerInitials: initialsFromName(sellerName),
    sellerColor: EVColors.primary,
    color: input.color.trim() || 'Belirtilmedi',
    isFeatured: false,
    warranty: input.warranty,
    acChargePower: input.acChargePower,
    dcChargePower: input.dcChargePower,
    batteryCapacity: input.batteryCapacity,
    motorPower: input.motorPower,
    drivetrain: input.drivetrain,
    paintedParts: [] as string[],
    replacedParts: [] as string[],
    coverPhoto: coverDataUri,
    photoCount: photoDataUris.length,
    photoStorage: 'firestore',
    createdAt: serverTimestamp(),
  };

  const listingRef = await addDoc(collection(db, COLLECTION), payload);

  const batch = writeBatch(db);
  photoDataUris.forEach((dataUri, order) => {
    const photoRef = doc(collection(db, COLLECTION, listingRef.id, 'photos'));
    batch.set(photoRef, {
      dataUri,
      order,
      contentType: 'image/jpeg',
      sellerUserId: user.uid,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();

  return mapListingDoc(listingRef.id, {
    ...payload,
    photos: photoDataUris,
    createdAt: Timestamp.now(),
  });
}

export async function updateListing(
  listingId: string,
  patch: UpdateListingInput,
): Promise<void> {
  const data: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (patch.price !== undefined) data.price = patch.price;
  if (patch.km !== undefined) data.km = patch.km;
  if (patch.location !== undefined) data.location = patch.location.trim();
  if (patch.sellerType !== undefined) data.sellerType = patch.sellerType;
  if (patch.damageStatus !== undefined) data.damageStatus = patch.damageStatus;
  if (patch.description !== undefined) {
    data.description = patch.description.trim();
  }
  if (patch.batteryHealth !== undefined) {
    data.batteryHealth = patch.batteryHealth;
  }
  if (patch.color !== undefined) data.color = patch.color.trim();
  if (patch.warranty !== undefined) data.warranty = patch.warranty;
  await updateDoc(doc(db, COLLECTION, listingId), data);
}

export async function deleteListing(listingId: string): Promise<void> {
  const photosSnap = await getDocs(
    collection(db, COLLECTION, listingId, 'photos'),
  );
  const batch = writeBatch(db);
  photosSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, COLLECTION, listingId));
  await batch.commit();
}

/** Detay ekranı: tüm fotoğrafları alt koleksiyondan yükle */
export async function fetchListingPhotos(listingId: string): Promise<string[]> {
  const q = query(
    collection(db, COLLECTION, listingId, 'photos'),
    orderBy('order', 'asc'),
  );
  const snap = await getDocs(q);
  const uris = snap.docs
    .map((d) => String(d.data().dataUri ?? ''))
    .filter(Boolean);
  return uris;
}

export async function fetchListings(): Promise<EvListing[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) =>
    mapListingDoc(d.id, d.data() as Record<string, unknown>),
  );
}

export async function fetchListingsBySeller(
  sellerUserId: string,
): Promise<EvListing[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('sellerUserId', '==', sellerUserId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      mapListingDoc(d.id, d.data() as Record<string, unknown>),
    );
  } catch {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('sellerUserId', '==', sellerUserId),
      ),
    );
    return snap.docs.map((d) =>
      mapListingDoc(d.id, d.data() as Record<string, unknown>),
    );
  }
}

export function subscribeListings(
  onData: (listings: EvListing[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapListingDoc(d.id, d.data() as Record<string, unknown>),
        ),
      );
    },
    (err) => onError?.(err),
  );
}

export function subscribeListingsByBrand(
  brandId: string,
  onData: (listings: EvListing[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('brandId', '==', brandId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapListingDoc(d.id, d.data() as Record<string, unknown>),
        ),
      );
    },
    (err) => onError?.(err),
  );
}
