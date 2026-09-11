import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  await setDoc(doc(db, 'users', myUid, 'blocked', blockedUid), {
    blockedUid,
    createdAt: serverTimestamp(),
  });
}

export async function unblockUser(
  myUid: string,
  blockedUid: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', myUid, 'blocked', blockedUid));
}

export async function fetchBlockedUserIds(myUid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', myUid, 'blocked'));
  return snap.docs.map((d) => d.id);
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

export function isBlocked(blockedIds: string[], userId?: string): boolean {
  if (!userId) return false;
  return blockedIds.includes(userId);
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
