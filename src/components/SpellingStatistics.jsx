'use client';

import { useState, useEffect } from 'react';
import { getGameStats } from '@/utils/profileManager';

/**
 * Statistics Modal for Spelling Bee Game
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
      <div className="bg-card rounded-lg p-6 max-w-md w-full">
        <div className="text-center text-text-muted">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Statistics</h2>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Today's Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Today&apos;s Game</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard
            label="Words Found"
            value={`${stats.wordsFound}/${stats.totalWords}`}
            color="text-blue-600"
          />
          <StatCard
            label="Score"
            value={`${stats.score}/${stats.maxScore}`}
            color="text-yellow-600"
          />
          <StatCard
            label="Pangrams"
            value={`${stats.pangramsFound}/${stats.totalPangrams}`}
            color="text-amber-600"
          />
          <StatCard
            label="Completion"
            value={`${stats.percentage}%`}
            color="text-green-600"
          />
        </div>

        {/* Current Rank */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-text-muted mb-1">Current Rank</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.rank}
          </div>
        </div>
      </div>

      {/* All-Time Stats */}
      {allTimeStats && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">All-Time Stats</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Games Played"
              value={allTimeStats.gamesPlayed || 0}
              color="text-purple-600"
            />
            <StatCard
              label="Total Words"
              value={allTimeStats.totalWords || 0}
              color="text-blue-600"
            />
            <StatCard
              label="Total Pangrams"
              value={allTimeStats.totalPangrams || 0}
              color="text-amber-600"
            />
            <StatCard
              label="Avg Score"
              value={Math.round(allTimeStats.averageScore || 0)}
              color="text-green-600"
            />
          </div>

          {/* Streak */}
          {allTimeStats.currentStreak > 0 && (
            <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-text-muted mb-1">Current Streak</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {allTimeStats.currentStreak} day{allTimeStats.currentStreak !== 1 ? 's' : ''} 🔥
              </div>
              <div className="text-xs text-text-muted mt-1">
                Best: {allTimeStats.maxStreak || 0} days
              </div>
            </div>
          )}

          {/* Rank Distribution */}
          {allTimeStats.rankDistribution && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-foreground mb-2">Rank History</div>
              <div className="space-y-1">
                {Object.entries(allTimeStats.rankDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([rank, count]) => (
                    <div key={rank} className="flex justify-between text-sm">
                      <span className="text-text-muted">{rank}</span>
                      <span className="font-semibold text-foreground">{count}×</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full mt-6 py-3 bg-yellow-400 text-gray-900 dark:text-slate-900 rounded-lg hover:bg-yellow-500 font-semibold transition-colors"
      >
        Close
      </button>
    </div>
  );
}

/**
 * Individual stat card
 */
function StatCard({ label, value, color }) {
  return (
    <div className="bg-surface-hover rounded-lg p-3 text-center border border-card-border">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
