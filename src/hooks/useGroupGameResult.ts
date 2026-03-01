'use client';

import { useCallback, useRef, useState } from 'react';
import { submitGroupResult } from '@/hooks/useGroups';

interface GroupContext {
  groupId: string;
  gameKey: string;
}

interface GameResultData {
  won: boolean;
  moves?: number | null;
  timeMs: number;
}

/**
 * Hook to detect group context and submit game results when a game ends.
 *
 * Games should call `submitResult(data)` on game completion.
 * The hook reads the group context from sessionStorage (set by the play redirect page).
 */
export function useGroupGameResult() {
  // Lazy initializer — runs once, no effect needed, no cascading render
  const [groupContext] = useState<GroupContext | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('tasally_groupContext');
      if (!raw) return null;
      const ctx = JSON.parse(raw) as GroupContext;
      return ctx.groupId && ctx.gameKey ? ctx : null;
    } catch {
      return null;
    }
  });

  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submitResult = useCallback(
    async (data: GameResultData) => {
      if (!groupContext || submitted) return null;
      try {
        const res = await submitGroupResult(groupContext.groupId, {
          gameKey: groupContext.gameKey,
          won: data.won,
          moves: data.moves ?? null,
          timeMs: data.timeMs,
        });
        if (res.ok) {
          setSubmitted(true);
          setResult(res.data);
          sessionStorage.removeItem('tasally_groupContext');
        }
        return res;
      } catch {
        return null;
      }
    },
    [groupContext, submitted]
  );

  const clearContext = useCallback(() => {
    sessionStorage.removeItem('tasally_groupContext');
  }, []);

  return {
    isGroupGame: !!groupContext,
    groupId: groupContext?.groupId ?? null,
    gameKey: groupContext?.gameKey ?? null,
    submitted,
    result,
    submitResult,
    clearContext,
  };
}
