'use client';

import { useState, useEffect } from 'react';
import { getGameStats } from '@/utils/profileManager';

/**
 * Statistics content for Spelling Bee Game
 * Used inside Modal component which provides the title
 */
export default function SpellingStatistics({ stats, onClose }) {
  const [allTimeStats, setAllTimeStats] = useState(null);

  useEffect(() => {
    // Load all-time stats from profile
    const profileStats = getGameStats('spelling');
    setAllTimeStats(profileStats);
  }, []);

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="text-center text-text-muted">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Today&apos;s Game</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Words Found"
            value={`${stats.wordsFound || 0}/${stats.totalWords || 0}`}
          />
          <StatCard
            label="Score"
            value={`${stats.score || 0}/${stats.maxScore || 0}`}
          />
          <StatCard
            label="Pangrams"
            value={`${stats.pangramsFound || 0}/${stats.totalPangrams || 0}`}
          />
          <StatCard
            label="Completion"
            value={`${stats.percentage || 0}%`}
          />
        </div>

        {/* Current Rank */}
        <div className="mt-4 bg-wordle-present/20 rounded-lg p-4 text-center border border-wordle-present/40">
          <div className="text-xs text-text-muted mb-1">Current Rank</div>
          <div className="text-2xl font-bold text-wordle-present">
            {stats.rank || 'Beginner'}
          </div>
        </div>
      </div>

      {/* All-Time Stats */}
      {allTimeStats && allTimeStats.gamesPlayed > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">All-Time</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Games Played"
              value={allTimeStats.gamesPlayed || 0}
            />
            <StatCard
              label="Total Words"
              value={allTimeStats.totalWords || 0}
            />
            <StatCard
              label="Total Pangrams"
              value={allTimeStats.totalPangrams || 0}
            />
            <StatCard
              label="Avg Score"
              value={Math.round(allTimeStats.averageScore || 0)}
            />
          </div>

          {/* Streak */}
          {allTimeStats.currentStreak > 0 && (
            <div className="mt-4 bg-connections-orange/20 rounded-lg p-4 text-center border border-connections-orange/40">
              <div className="text-xs text-text-muted mb-1">Current Streak</div>
              <div className="text-2xl font-bold text-connections-orange">
                {allTimeStats.currentStreak} day{allTimeStats.currentStreak !== 1 ? 's' : ''} 🔥
              </div>
              <div className="text-xs text-text-muted mt-1">
                Best: {allTimeStats.maxStreak || 0} days
              </div>
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3 bg-wordle-correct text-white rounded-lg hover:opacity-90 font-bold transition-opacity"
      >
        Close
      </button>
    </div>
  );
}

/**
 * Individual stat card - themed
 */
function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-lg p-3 text-center border border-card-border">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
