'use client';

import React from 'react';
import { getAchievementById } from '@/utils/achievementsEngine';

const AchievementBadge = ({ achievementId, unlocked = false, unlockedAt = null, compact = false }) => {
  const achievement = getAchievementById(achievementId);

  if (!achievement) return null;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
          unlocked
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400'
            : 'bg-gray-100 border-2 border-gray-300 opacity-50'
        }`}
        title={achievement.description}
      >
        <span className="text-2xl">{achievement.icon}</span>
        <span className={`text-sm font-bold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {achievement.name}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl transition-all ${
        unlocked
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 shadow-lg'
          : 'bg-gray-50 border-2 border-gray-200 opacity-60'
      }`}
    >
      <div className="text-center">
        <div className={`text-5xl mb-3 ${unlocked ? 'animate-pulse' : 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className={`text-lg font-bold mb-1 ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {achievement.name}
        </div>
        <div className={`text-sm mb-2 ${unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
          {achievement.description}
        </div>
        {unlocked && unlockedAt && (
          <div className="text-xs text-gray-500 italic">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </div>
        )}
        {!unlocked && (
          <div className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <span>🔒</span>
            <span>Locked</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;
