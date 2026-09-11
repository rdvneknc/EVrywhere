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
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { EV_PRIMARY } from '../data/forum';
import { createNotification } from './notifications';
import { assertCanInteract } from './moderation';
import { assertRateLimit } from '../lib/rateLimit';

export type PeerProfile = {
  userId: string;
  name: string;
  initials: string;
  color: string;
};

export type ConversationContextType = 'listing' | 'topic' | 'dm';

export type ConversationContext = {
  type: ConversationContextType;
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
};

export type ConversationSummary = {
  id: string;
  peer: PeerProfile;
  subject: string;
  context: ConversationContext | null;
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
    color: EV_PRIMARY,
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

function subjectFromContext(ctx: ConversationContext): string {
  if (ctx.type === 'listing') return `İlan: ${ctx.title}`;
  if (ctx.type === 'topic') return `Konu: ${ctx.title}`;
  return ctx.title || 'Direkt mesaj';
}

function contextFields(ctx: ConversationContext): Record<string, string> {
  const fields: Record<string, string> = {
    subject: subjectFromContext(ctx).slice(0, 200),
    contextType: ctx.type,
    contextTitle: ctx.title.slice(0, 200),
  };
  if (ctx.id) fields.contextId = ctx.id.slice(0, 200);
  if (ctx.subtitle) fields.contextSubtitle = ctx.subtitle.slice(0, 200);
  if (ctx.imageUrl) fields.contextImage = ctx.imageUrl.slice(0, 400000);
  if (ctx.href) fields.contextHref = ctx.href.slice(0, 400);
  return fields;
}

function parseContext(data: Record<string, unknown>): ConversationContext | null {
  const type = String(data.contextType ?? '');
  const title = String(data.contextTitle ?? '').trim();
  if (type !== 'listing' && type !== 'topic') {
    const subject = String(data.subject ?? '').trim();
    if (subject.startsWith('İlan: ')) {
      return {
        type: 'listing',
        title: subject.slice(6).trim() || 'İlan',
        href: undefined,
      };
    }
    if (subject.startsWith('Konu: ')) {
      return {
        type: 'topic',
        title: subject.slice(6).trim() || 'Konu',
        href: undefined,
      };
    }
    return null;
  }
  if (!title) return null;
  return {
    type,
    id: data.contextId ? String(data.contextId) : undefined,
    title,
    subtitle: data.contextSubtitle
      ? String(data.contextSubtitle)
      : undefined,
    imageUrl: data.contextImage ? String(data.contextImage) : undefined,
    href: data.contextHref
      ? String(data.contextHref)
      : type === 'listing' && data.contextId
        ? `/ilanlar/${String(data.contextId)}`
        : type === 'topic' && data.contextId
          ? `/forum/${String(data.contextId)}`
          : undefined,
  };
}

function normalizeContextArg(
  contextOrSubject?: ConversationContext | string,
): ConversationContext {
  if (!contextOrSubject) {
    return { type: 'dm', title: 'Direkt mesaj' };
  }
  if (typeof contextOrSubject === 'string') {
    const s = contextOrSubject.trim() || 'Direkt mesaj';
    if (s.startsWith('İlan: ')) {
      return { type: 'listing', title: s.slice(6).trim() || 'İlan' };
    }
    if (s.startsWith('Konu: ')) {
      return { type: 'topic', title: s.slice(6).trim() || 'Konu' };
    }
    return { type: 'dm', title: s };
  }
  return contextOrSubject;
}

export async function openOrCreateConversation(
  me: User,
  peer: PeerProfile,
  contextOrSubject?: ConversationContext | string,
): Promise<string> {
  if (peer.userId === me.uid) {
    throw new Error('Kendine mesaj gönderemezsin.');
  }
  await assertCanInteract(me.uid, peer.userId);

  const ctx = normalizeContextArg(contextOrSubject);
  const id = conversationIdFor(me.uid, peer.userId);
  const ref = doc(db, 'conversations', id);
  const meProfile = profileFromUser(me);
  const participantIds = [me.uid, peer.userId].sort();
  const ctxFields = contextFields(ctx);

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
      ...ctxFields,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unread: { [me.uid]: 0, [peer.userId]: 0 },
      createdAt: serverTimestamp(),
    });
  } else if (ctx.type === 'listing' || ctx.type === 'topic') {
    // Aynı kişiyle sohbet sürer; aktif bağlamı güncelle
    await updateDoc(ref, ctxFields);
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
        const data = d.data() as Record<string, unknown>;
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
            color: peerData.color ?? EV_PRIMARY,
          },
          subject: String(data.subject ?? 'Direkt mesaj'),
          context: parseContext(data),
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
  onData: (
    meta: {
      peer: PeerProfile;
      subject: string;
      context: ConversationContext | null;
    } | null,
  ) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'conversations', conversationId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data() as Record<string, unknown>;
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
          color: peerData.color ?? EV_PRIMARY,
        },
        subject: String(data.subject ?? 'Direkt mesaj'),
        context: parseContext(data),
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
