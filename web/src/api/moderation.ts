import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { assertRateLimit } from '../lib/rateLimit';

export type ReportTargetType =
  | 'user'
  | 'listing'
  | 'topic'
  | 'comment'
  | 'post';

/** me ↔ other ilişki durumu */
export type BlockRelation = 'none' | 'blocked' | 'blocked_by' | 'mutual';

export const BLOCK_MESSAGE = {
  blocked: 'Bu kullanıcıyı engellediniz.',
  blocked_by: 'Bu kullanıcı sizi engelledi.',
} as const;

export async function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  targetLabel?: string;
}): Promise<void> {
  const reason = input.reason.trim();
  if (!reason) throw new Error('Şikayet nedeni gerekli.');
  if (reason.length > 500) throw new Error('Şikayet en fazla 500 karakter.');
  assertRateLimit(`report:${input.reporterId}`, 5, 60_000);

  await addDoc(collection(db, 'reports'), {
    reporterId: input.reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel ?? null,
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function blockUser(
  myUid: string,
  blockedUid: string,
): Promise<void> {
  if (!myUid || !blockedUid || myUid === blockedUid) return;
  await Promise.all([
    setDoc(doc(db, 'users', myUid, 'blocked', blockedUid), {
      blockedUid,
      createdAt: serverTimestamp(),
    }),
    setDoc(doc(db, 'users', blockedUid, 'blockedBy', myUid), {
      blockerUid: myUid,
      createdAt: serverTimestamp(),
    }),
  ]);
}

export async function unblockUser(
  myUid: string,
  blockedUid: string,
): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, 'users', myUid, 'blocked', blockedUid)),
    deleteDoc(doc(db, 'users', blockedUid, 'blockedBy', myUid)),
  ]);
}

/** Eski engeller için ters indeksi tamamla (bir kez çağrılır). */
export async function syncOutgoingBlockMirrors(myUid: string): Promise<void> {
  const ids = await fetchBlockedUserIds(myUid);
  await Promise.all(
    ids.map((blockedUid) =>
      setDoc(
        doc(db, 'users', blockedUid, 'blockedBy', myUid),
        { blockerUid: myUid, createdAt: serverTimestamp() },
        { merge: true },
      ),
    ),
  );
}

export async function fetchBlockedUserIds(myUid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'blocked'));
  return snap.docs.map((d) => d.id);
}

export async function fetchBlockedByUserIds(myUid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'blockedBy'));
  return snap.docs.map((d) => d.id);
}

/** Benim engellediklerim + beni engelleyenler */
export async function fetchHiddenUserIds(myUid: string): Promise<string[]> {
  const [blocked, blockedBy] = await Promise.all([
    fetchBlockedUserIds(myUid),
    fetchBlockedByUserIds(myUid),
  ]);
  return [...new Set([...blocked, ...blockedBy])];
}

export function subscribeBlockedUserIds(
  myUid: string,
  onData: (ids: string[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', myUid, 'blocked'),
    (snap) => onData(snap.docs.map((d) => d.id)),
    (err) => onError?.(err),
  );
}

export function subscribeBlockedByUserIds(
  myUid: string,
  onData: (ids: string[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', myUid, 'blockedBy'),
    (snap) => onData(snap.docs.map((d) => d.id)),
    (err) => onError?.(err),
  );
}

export function subscribeHiddenUserIds(
  myUid: string,
  onData: (ids: string[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let blocked: string[] = [];
  let blockedBy: string[] = [];
  const emit = () => onData([...new Set([...blocked, ...blockedBy])]);
  const unsubA = subscribeBlockedUserIds(
    myUid,
    (ids) => {
      blocked = ids;
      emit();
    },
    onError,
  );
  const unsubB = subscribeBlockedByUserIds(
    myUid,
    (ids) => {
      blockedBy = ids;
      emit();
    },
    onError,
  );
  return () => {
    unsubA();
    unsubB();
  };
}

export function isBlocked(blockedIds: string[], userId?: string): boolean {
  if (!userId) return false;
  return blockedIds.includes(userId);
}

export function relationFromLists(
  blockedIds: string[],
  blockedByIds: string[],
  otherUid?: string,
): BlockRelation {
  if (!otherUid) return 'none';
  const iBlocked = blockedIds.includes(otherUid);
  const theyBlocked = blockedByIds.includes(otherUid);
  if (iBlocked && theyBlocked) return 'mutual';
  if (iBlocked) return 'blocked';
  if (theyBlocked) return 'blocked_by';
  return 'none';
}

export function messageForBlockRelation(
  relation: BlockRelation,
): string | null {
  if (relation === 'none') return null;
  if (relation === 'blocked_by') return BLOCK_MESSAGE.blocked_by;
  return BLOCK_MESSAGE.blocked;
}

export async function getBlockRelation(
  myUid: string,
  otherUid: string,
): Promise<BlockRelation> {
  if (!myUid || !otherUid || myUid === otherUid) return 'none';
  const [outSnap, inSnap, peerBlockedMe] = await Promise.all([
    getDoc(doc(db, 'users', myUid, 'blocked', otherUid)),
    getDoc(doc(db, 'users', myUid, 'blockedBy', otherUid)),
    // Ters indeks yoksa bile karşı tarafın engel kaydını oku
    getDoc(doc(db, 'users', otherUid, 'blocked', myUid)).catch(() => null),
  ]);
  const iBlocked = outSnap.exists();
  const theyBlocked =
    inSnap.exists() || (peerBlockedMe != null && peerBlockedMe.exists());
  if (iBlocked && theyBlocked) return 'mutual';
  if (iBlocked) return 'blocked';
  if (theyBlocked) return 'blocked_by';
  return 'none';
}

export async function assertCanInteract(
  myUid: string,
  otherUid: string,
): Promise<void> {
  const relation = await getBlockRelation(myUid, otherUid);
  const msg = messageForBlockRelation(relation);
  if (msg) throw new Error(msg);
}

/** Permission-denied (rules) → kullanıcıya anlamlı engel mesajı */
export function mapMessagingError(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = String((e as { code: string }).code);
    if (
      code === 'permission-denied' ||
      code === 'functions/permission-denied'
    ) {
      return 'Bu kullanıcıyla mesajlaşamazsınız (engel).';
    }
  }
  if (e instanceof Error) return e.message;
  return 'İşlem başarısız.';
}

export function promptReportReason(): string | null {
  const reason = window.prompt('Şikayet nedenini yaz (en fazla 500 karakter):');
  if (reason == null) return null;
  const trimmed = reason.trim();
  if (!trimmed) {
    window.alert('Şikayet nedeni gerekli.');
    return null;
  }
  return trimmed.slice(0, 500);
}
