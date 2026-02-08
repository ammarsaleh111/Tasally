/**
 * UnlimitedLeaderboard
 *
 * Displays the leaderboard for unlimited mode games.
 * Automatically detects context (global vs group) and shows appropriate data.
 * Uses 10-second client-side polling for updates.
 */

'use client';

import React from 'react';
import { useGlobalLeaderboard, useGroupLeaderboard, formatLastUpdated } from '@/hooks/useLeaderboard';
import { useGameContext } from '@/hooks/useGameContext';

interface LeaderboardEntry {
  identityId: string;
  displayName: string | null;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  rank: number;
}

interface UnlimitedLeaderboardProps {
  /** Maximum number of entries to show */
  limit?: number;
  /** Optional custom title override */
  title?: string;
  /** Whether to show as compact (fewer details) */
  compact?: boolean;
}

export default function UnlimitedLeaderboard({
  limit = 10,
  title,
  compact = false,
}: UnlimitedLeaderboardProps) {
  const { context, isGroupGame, groupId, groupName } = useGameContext();

  // Use appropriate hook based on context
  const globalData = useGlobalLeaderboard(isGroupGame ? 0 : limit);
  const groupData = useGroupLeaderboard(groupId || '', isGroupGame ? limit : 0);

  const { leaderboard: entries, loading, error, lastUpdated } = isGroupGame ? groupData : globalData;

  const displayTitle =
    title || (isGroupGame ? `${groupName || 'Group'} Leaderboard` : 'Global Leaderboard');

  const badgeClass = isGroupGame
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : 'bg-green-500/20 text-green-400 border-green-500/30';
  const badgeIcon = isGroupGame ? '👥' : '🌍';
  const badgeLabel = isGroupGame ? 'Group' : 'Global';

  if (error) {
    return (
      <div className="bg-neutral-800 rounded-xl p-4 border border-red-500/30">
        <p className="text-red-400 text-sm">Failed to load leaderboard</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{displayTitle}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${badgeClass}`}
          >
            {badgeIcon} {badgeLabel}
          </span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-neutral-500">
            {formatLastUpdated(lastUpdated)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-neutral-700/50">
        {loading && entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-neutral-500 text-sm mt-2">Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-500">
            <p>No results yet</p>
            <p className="text-sm">Play a game to get on the leaderboard!</p>
          </div>
        ) : (
          entries.map((entry: LeaderboardEntry) => (
            <div
              key={entry.identityId}
              className={`px-4 flex items-center gap-3 ${
                compact ? 'py-2' : 'py-3'
              }`}
            >
              {/* Rank */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  entry.rank === 1
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : entry.rank === 2
                    ? 'bg-neutral-400/20 text-neutral-300'
                    : entry.rank === 3
                    ? 'bg-amber-600/20 text-amber-500'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {entry.displayName || 'Anonymous'}
                </p>
                {!compact && (
                  <p className="text-xs text-neutral-500">
                    {entry.wins} wins • {entry.gamesPlayed} games
                  </p>
                )}
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="font-bold text-white tabular-nums">
                  {entry.totalPoints.toLocaleString()}
                </p>
                {!compact && (
                  <p className="text-xs text-neutral-500">points</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - subtle indicator of auto-refresh */}
      <div className="px-4 py-2 border-t border-neutral-700/50 bg-neutral-900/50">
        <p className="text-xs text-neutral-600 text-center">
          Auto-refreshes every 10s
        </p>
      </div>
    </div>
  );
}
