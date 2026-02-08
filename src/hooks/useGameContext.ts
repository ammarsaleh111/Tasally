/**
 * useGameContext Hook
 *
 * Provides game context management for game components.
 * Handles context detection, result submission, and navigation.
 *
 * Usage:
 *   const { context, submitResult, returnToHub } = useGameContext();
 */

'use client';

import { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  GameContext,
  parseGameContextFromURL,
  loadGameContext,
  saveGameContext,
  clearGameContext,
  getReturnURL,
  submitGameResult,
} from '@/lib/gameContext';

export interface UseGameContextResult {
  /** Current game context (global or group) */
  context: GameContext;
  /** Whether context has been determined */
  ready: boolean;
  /** Submit game result to the correct endpoint */
  submitResult: (result: {
    gameKey: string;
    won: boolean;
    moves?: number | null;
    timeMs: number;
  }) => Promise<{ ok: boolean; data?: any; error?: string }>;
  /** Navigate back to the correct hub (games or group page) */
  returnToHub: () => void;
  /** Whether this is a group game */
  isGroupGame: boolean;
  /** Group ID if this is a group game */
  groupId: string | null;
  /** Group name if available */
  groupName: string | null;
  /** Return URL for navigation (use in GameHeader returnUrl prop) */
  returnUrl: string;
  /** Return label for navigation (e.g., "Games" or "Group") */
  returnLabel: string;
}

/**
 * Determine context synchronously from search params.
 * This avoids the need for useEffect state updates.
 */
function determineContext(searchParams: URLSearchParams): GameContext {
  // Priority 1: URL search params (most reliable)
  const urlContext = parseGameContextFromURL(searchParams);
  if (urlContext.type === 'group') {
    return urlContext;
  }

  // Priority 2: SessionStorage (fallback for redirects)
  if (typeof window !== 'undefined') {
    const storedContext = loadGameContext();
    if (storedContext) {
      return storedContext;
    }
  }

  // Default: Global context
  return { type: 'global' };
}

export function useGameContext(): UseGameContextResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initializedRef = useRef(false);

  // Compute context immediately from params (no effect needed)
  const context = useMemo(() => {
    return determineContext(searchParams);
  }, [searchParams]);

  // Save context to sessionStorage once on initial render
  useLayoutEffect(() => {
    if (!initializedRef.current && context.type === 'group') {
      saveGameContext(context);
      initializedRef.current = true;
    }
  }, [context]);

  // Submit result to the correct endpoint
  const submitResult = useCallback(
    async (result: {
      gameKey: string;
      won: boolean;
      moves?: number | null;
      timeMs: number;
    }) => {
      return submitGameResult(context, result);
    },
    [context]
  );

  // Navigate back to the correct hub
  const returnToHub = useCallback(() => {
    const url = getReturnURL(context);
    clearGameContext(); // Clean up context
    router.push(url);
  }, [context, router]);

  // Derived values
  const isGroupGame = context.type === 'group';
  const groupId = context.type === 'group' ? context.groupId : null;
  const groupName = context.type === 'group' ? context.groupName || null : null;
  const returnUrl = getReturnURL(context);
  const returnLabel = isGroupGame ? (groupName || 'Group') : 'Games';

  return useMemo(
    () => ({
      context,
      ready: true, // Always ready since we compute synchronously
      submitResult,
      returnToHub,
      isGroupGame,
      groupId,
      groupName,
      returnUrl,
      returnLabel,
    }),
    [context, submitResult, returnToHub, isGroupGame, groupId, groupName, returnUrl, returnLabel]
  );
}
