'use client';

import React from 'react';
import Modal from './Modal';
import { getHistoryForDateRange } from '@/utils/profileManager';
import { calculateWinRate } from '@/utils/statsCalculator';

const StatisticsModal = ({ isOpen, onClose, gameName, stats, customContent }) => {
  const {
    gamesPlayed = 0,
    gamesWon = 0,
    currentStreak = 0,
    longestStreak = 0,
    bestTime = null,
    averageAttempts = 0,
  } = stats || {};

  // Use centralized win rate calculation - ensures it never exceeds 100%
  const winPercentage = calculateWinRate(gamesWon, gamesPlayed);

  // Get 7-day and 30-day history
  const sevenDayHistory = getHistoryForDateRange(gameName, 7);
  const thirtyDayHistory = getHistoryForDateRange(gameName, 30);

  // Handle undefined gameName
  const displayName = gameName ? gameName.charAt(0).toUpperCase() + gameName.slice(1) : 'Game';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${displayName} Statistics`}>
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox value={gamesPlayed} label="Played" />
          <StatBox value={winPercentage} label="Win %" />
          <StatBox value={currentStreak} label="Current Streak" highlight={currentStreak > 0} />
          <StatBox value={longestStreak} label="Best Streak" />
        </div>

        {/* Additional Stats */}
        {(bestTime !== null || averageAttempts > 0) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            {bestTime !== null && (
              <StatBox value={formatTime(bestTime)} label="Best Time" />
            )}
            {averageAttempts > 0 && (
              <StatBox value={averageAttempts} label="Avg Attempts" />
            )}
          </div>
        )}

        {/* 7-Day Graph */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground">
            Last 7 Days
          </h3>
          <HistoryGraph data={sevenDayHistory} />
        </div>

        {/* 30-Day Graph */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground">
            Last 30 Days
          </h3>
          <HistoryGraph data={thirtyDayHistory} compact />
        </div>

        {/* Custom content (game-specific) */}
        {customContent && (
          <div className="pt-2 border-t border-border">
            {customContent}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))] rounded-lg hover:bg-[hsl(var(--button-primary-hover))] transition-all font-bold"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

// Stat Box Component
const StatBox = ({ value, label, highlight = false }) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${highlight ? 'text-wordle-correct' : 'text-foreground'}`}>
      {value}
    </div>
    <div className="text-xs text-text-muted uppercase">{label}</div>
  </div>
);

// History Graph Component
const HistoryGraph = ({ data, compact = false }) => {
  const barHeight = compact ? 'h-8' : 'h-12';
  const fontSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`grid ${compact ? 'grid-cols-30 gap-0.5' : 'grid-cols-7 gap-2'}`}>
      {data.map((day, index) => {
        const hasResult = day.result !== null;
        const isWin = hasResult && day.result.win;
        const isLoss = hasResult && !day.result.win;

        // Format date label
        const date = new Date(day.date);
        const label = compact
          ? '' // No labels for 30-day view
          : date.toLocaleDateString('en-US', { weekday: 'short' })[0]; // First letter

        return (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className={`w-full ${barHeight} flex items-end justify-center`}>
              {hasResult && (
                <div
                  className={`w-full transition-all ${
                    isWin
                      ? 'bg-wordle-correct'
                      : isLoss
                      ? 'bg-wordle-absent'
                      : 'bg-graph-bar'
                  } ${compact ? 'h-full' : 'h-full'} rounded-sm`}
                  title={`${day.date}: ${isWin ? 'Win' : 'Loss'}`}
                />
              )}
              {!hasResult && (
                <div className="w-full h-2 bg-graph-bg rounded-sm" />
              )}
            </div>
            {!compact && (
              <div className={`${fontSize} text-text-muted font-medium`}>
                {label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper function to format time
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default StatisticsModal;
