import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { assertRateLimit } from '../lib/rateLimit';

export type NotifType = 'priceDown' | 'priceUp' | 'forum' | 'system' | 'message';

export type AppNotification = {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  time: number;
  isRead: boolean;
  topicId?: string;
  conversationId?: string;
};

function mapNotif(
  id: string,
  data: Record<string, unknown>,
): AppNotification {
  const timeRaw = data.time;
  let time = Date.now();
  if (typeof timeRaw === 'number') time = timeRaw;
  else if (
    timeRaw &&
    typeof timeRaw === 'object' &&
    'toMillis' in timeRaw &&
    typeof (timeRaw as { toMillis: () => number }).toMillis === 'function'
  ) {
    time = (timeRaw as { toMillis: () => number }).toMillis();
  }

  return {
    id,
    userId: String(data.userId ?? ''),
    type: (data.type as NotifType) ?? 'system',
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    time,
    isRead: Boolean(data.isRead),
    topicId: data.topicId ? String(data.topicId) : undefined,
    conversationId: data.conversationId
      ? String(data.conversationId)
      : undefined,
  };
}

export type CreateNotificationInput = {
  actorId: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  topicId?: string;
  conversationId?: string;
};

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  if (!input.userId || !input.actorId) return;
  assertRateLimit(`notif:${input.actorId}`, 20, 60_000);
  const title = input.title.trim().slice(0, 120);
  const body = input.body.trim().slice(0, 500);
  await addDoc(collection(db, 'notifications'), {
    actorId: input.actorId,
    userId: input.userId,
    type: input.type,
    title,
    body,
    topicId: input.topicId ?? null,
    conversationId: input.conversationId ?? null,
    isRead: false,
    time: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeUserNotifications(
  userId: string,
  onData: (items: AppNotification[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) =>
        mapNotif(d.id, d.data() as Record<string, unknown>),
      );
      items.sort((a, b) => b.time - a.time);
      onData(items);
    },
    (err) => onError?.(err),
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { isRead: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
  );
  const snap = await getDocs(q);
  const unread = snap.docs.filter((d) => !d.data().isRead);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((d) => batch.update(d.ref, { isRead: true }));
  await batch.commit();
}

export async function removeNotificationDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', id));
}

export function timeAgo(time: number): string {
  const diffMs = Date.now() - time;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Şimdi';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}
