/**
 * Leaderboard Polling Hooks
 *
 * Provides 10-second auto-refresh for leaderboards via client-side polling.
 * Backend serves cached data to handle polling load safely.
 *
 * CRITICAL RULES:
 *   - Global leaderboard uses /api/leaderboards/global
 *   - Group leaderboard uses /api/groups/:groupId/leaderboard-total
 *   - These are SEPARATE systems, never mixed
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LeaderboardEntry {
  rank: number;
  identityId: string;
  displayName: string;
  totalPoints: number;
  totalTimeMs: number;
  gamesPlayed: number;
  wins: number;
}

const POLLING_INTERVAL_MS = 10_000; // 10 seconds

/**
 * Hook for Global Leaderboard with 10-second polling.
 * Uses /api/leaderboards/global endpoint.
 */
export function useGlobalLeaderboard(limit: number = 50) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetchLeaderboard = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);

    try {
      const res = await fetch(`/api/leaderboards/global?limit=${limit}`);
      const json = await res.json();

      if (!mountedRef.current) return;

      if (json.ok) {
        setLeaderboard(json.data.leaderboard);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error?.message || 'Failed to load leaderboard');
      }
    } catch {
      if (mountedRef.current) {
        setError('Network error');
      }
    } finally {
      if (mountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchLeaderboard(true);

    // 10-second polling interval
    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchLeaderboard(false),
  };
}

/**
 * Hook for Group Leaderboard with 10-second polling.
 * Uses /api/groups/:groupId/leaderboard-total endpoint.
 *
 * CRITICAL: This is SEPARATE from global leaderboard.
 */
export function useGroupLeaderboard(groupId: string | null, limit: number = 50) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const fetchLeaderboard = useCallback(async (isInitial = false) => {
    if (!groupId) return;
    if (isInitial) setLoading(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/leaderboard-total?limit=${limit}`);
      const json = await res.json();

      if (!mountedRef.current) return;

      if (json.ok) {
        setLeaderboard(json.data.leaderboard);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error?.message || 'Failed to load leaderboard');
      }
    } catch {
      if (mountedRef.current) {
        setError('Network error');
      }
    } finally {
      if (mountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, [groupId, limit]);

  useEffect(() => {
    if (!groupId) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    fetchLeaderboard(true);

    // 10-second polling interval
    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLeaderboard, groupId]);

  return {
    leaderboard,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchLeaderboard(false),
  };
}

/**
 * Format time since last update for display.
 */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}
