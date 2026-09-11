import { useEffect, useMemo, useState } from 'react';
import {
  relationFromLists,
  subscribeBlockedByUserIds,
  subscribeBlockedUserIds,
  syncOutgoingBlockMirrors,
  type BlockRelation,
} from '../api/moderation';
import { useAuth } from '../auth/AuthContext';

export function useBlockLists() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [blockedByIds, setBlockedByIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setBlockedIds([]);
      setBlockedByIds([]);
      return;
    }
    void syncOutgoingBlockMirrors(user.uid).catch(() => undefined);
    const unsubA = subscribeBlockedUserIds(user.uid, setBlockedIds);
    const unsubB = subscribeBlockedByUserIds(user.uid, setBlockedByIds);
    return () => {
      unsubA();
      unsubB();
    };
  }, [user?.uid]);

  const hiddenIds = useMemo(
    () => new Set([...blockedIds, ...blockedByIds]),
    [blockedIds, blockedByIds],
  );

  const relationWith = (otherUid?: string): BlockRelation =>
    relationFromLists(blockedIds, blockedByIds, otherUid);

  return { blockedIds, blockedByIds, hiddenIds, relationWith };
}
