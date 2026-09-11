import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EVColors } from '../theme/colors';
import { createNotification } from './notifications';
import { assertCanInteract } from './moderation';
import { assertRateLimit } from '../lib/rateLimit';

export type PeerProfile = {
  userId: string;
  name: string;
  initials: string;
  color: string;
};

export type ConversationSummary = {
  id: string;
  peer: PeerProfile;
  subject: string;
  lastMessage: string;
  lastMessageAt: number;
  unread: number;
};

export type ChatMessageDoc = {
  id: string;
  text: string;
  senderId: string;
  fromMe: boolean;
  time: number;
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

export function profileFromUser(user: User): PeerProfile {
  const name =
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Kullanıcı';
  return {
    userId: user.uid,
    name,
    initials: initialsFromName(name),
    color: EVColors.primary,
  };
}

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

function tsToMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

export function chatTimeAgo(time: number): string {
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Şimdi';
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  return `${Math.floor(hours / 24)} gün`;
}

export async function openOrCreateConversation(
  me: User,
  peer: PeerProfile,
  subject = 'Direkt mesaj',
): Promise<string> {
  if (peer.userId === me.uid) {
    throw new Error('Kendine mesaj gönderemezsin.');
  }
  await assertCanInteract(me.uid, peer.userId);

  const id = conversationIdFor(me.uid, peer.userId);
  const ref = doc(db, 'conversations', id);
  const meProfile = profileFromUser(me);
  const participantIds = [me.uid, peer.userId].sort();

  // getDoc yokken permission hatası vermesin diye merge create/update
  const existing = await getDoc(ref).catch(() => null);
  const exists = existing != null && existing.exists();

  if (!exists) {
    await setDoc(ref, {
      participantIds,
      participants: {
        [me.uid]: {
          name: meProfile.name,
          initials: meProfile.initials,
          color: meProfile.color,
        },
        [peer.userId]: {
          name: peer.name,
          initials: peer.initials,
          color: peer.color,
        },
      },
      subject,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unread: { [me.uid]: 0, [peer.userId]: 0 },
      createdAt: serverTimestamp(),
    });
  } else if (subject && subject !== 'Direkt mesaj') {
    const data = existing!.data();
    if (!data.subject || data.subject === 'Direkt mesaj') {
      await updateDoc(ref, { subject });
    }
  }

  return id;
}

export async function sendChatMessage(
  conversationId: string,
  me: User,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 2000) {
    throw new Error('Mesaj en fazla 2000 karakter olabilir.');
  }
  assertRateLimit(`msg:${me.uid}`, 30, 60_000);

  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Konuşma bulunamadı');

  const data = snap.data();
  const participantIds = (data.participantIds as string[]) ?? [];
  if (!participantIds.includes(me.uid)) {
    throw new Error('Bu konuşmaya erişimin yok');
  }

  const otherId = participantIds.find((id) => id !== me.uid);
  if (otherId) {
    await assertCanInteract(me.uid, otherId);
  }

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    text: trimmed,
    senderId: me.uid,
    createdAt: serverTimestamp(),
  });

  const updates: Record<string, unknown> = {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastSenderId: me.uid,
  };
  if (otherId) {
    updates[`unread.${otherId}`] = increment(1);
  }
  await updateDoc(ref, updates);

  if (otherId) {
    const preview =
      trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
    const meName =
      me.displayName?.trim() || me.email?.split('@')[0] || 'Birisi';
    await createNotification({
      actorId: me.uid,
      userId: otherId,
      type: 'message',
      title: 'Yeni mesaj',
      body: `${meName}: ${preview}`,
      conversationId,
    }).catch(() => undefined);
  }
}

export async function markConversationRead(
  conversationId: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unread.${uid}`]: 0,
  });
}

export function subscribeMyConversations(
  uid: string,
  onData: (items: ConversationSummary[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: ConversationSummary[] = snap.docs.map((d) => {
        const data = d.data();
        const participants = (data.participants ?? {}) as Record<
          string,
          { name?: string; initials?: string; color?: string }
        >;
        const otherId =
          ((data.participantIds as string[]) ?? []).find((id) => id !== uid) ??
          '';
        const peerData = participants[otherId] ?? {};
        const unreadMap = (data.unread ?? {}) as Record<string, number>;
        return {
          id: d.id,
          peer: {
            userId: otherId,
            name: peerData.name ?? 'Üye',
            initials: peerData.initials ?? 'Ü',
            color: peerData.color ?? EVColors.primary,
          },
          subject: String(data.subject ?? 'Direkt mesaj'),
          lastMessage: String(data.lastMessage ?? ''),
          lastMessageAt: tsToMillis(data.lastMessageAt),
          unread: Number(unreadMap[uid] ?? 0),
        };
      });
      items.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      onData(items);
    },
    (err) => onError?.(err),
  );
}

export function subscribeConversationMessages(
  conversationId: string,
  myUid: string,
  onData: (messages: ChatMessageDoc[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: String(data.text ?? ''),
            senderId: String(data.senderId ?? ''),
            fromMe: data.senderId === myUid,
            time: tsToMillis(data.createdAt) || Date.now(),
          };
        }),
      );
    },
    (err) => onError?.(err),
  );
}

export function subscribeConversationMeta(
  conversationId: string,
  myUid: string,
  onData: (meta: { peer: PeerProfile; subject: string } | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'conversations', conversationId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data();
      const participants = (data.participants ?? {}) as Record<
        string,
        { name?: string; initials?: string; color?: string }
      >;
      const otherId =
        ((data.participantIds as string[]) ?? []).find((id) => id !== myUid) ??
        '';
      const peerData = participants[otherId] ?? {};
      onData({
        peer: {
          userId: otherId,
          name: peerData.name ?? 'Üye',
          initials: peerData.initials ?? 'Ü',
          color: peerData.color ?? EVColors.primary,
        },
        subject: String(data.subject ?? 'Direkt mesaj'),
      });
    },
    (err) => onError?.(err),
  );
}

export function subscribeTotalUnread(
  uid: string,
  onData: (total: number) => void,
  onError?: (error: Error) => void,
): () => void {
  return subscribeMyConversations(
    uid,
    (items) => onData(items.reduce((sum, c) => sum + c.unread, 0)),
    onError,
  );
}
