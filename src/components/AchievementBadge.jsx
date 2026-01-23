'use client';

import React from 'react';
import { getAchievementById } from '@/utils/achievementsEngine';

const AchievementBadge = ({
  achievementId,
  achievement: achievementProp = null,
  unlocked = false,
  unlockedAt = null,
  compact = false,
  className = '',
}) => {
  const achievement = achievementProp ?? getAchievementById(achievementId);

  if (!achievement) return null;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${className} ${
          unlocked
            ? 'bg-wordle-present border-2 border-wordle-correct'
            : 'bg-card border-2 border-border-default opacity-50'
        }`}
        title={achievement.description}
      >
        <span className="text-2xl">{achievement.icon}</span>
        <span className={`text-sm font-bold ${unlocked ? 'text-foreground' : 'text-text-muted'}`}>
          {achievement.name}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl transition-all ${className} ${
        unlocked
          ? 'bg-wordle-present border-2 border-wordle-correct shadow-lg'
          : 'bg-card border-2 border-border-default opacity-60'
      }`}
    >
      <div className="text-center">
        <div className={`text-5xl mb-3 ${unlocked ? 'animate-pulse' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className={`text-lg font-bold mb-1 ${unlocked ? 'text-foreground' : 'text-text-muted'}`}>
          {achievement.name}
        </div>
        <div className={`text-sm mb-2 ${unlocked ? 'text-foreground' : 'text-text-muted'}`}>
          {achievement.description}
        </div>
        {unlocked && unlockedAt && (
          <div className="text-xs text-text-muted italic">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </div>
        )}
        {!unlocked && (
          <div className="text-xs text-text-muted mt-2 flex items-center justify-center gap-1">
            <span>🔒</span>
            <span>Locked</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;
