'use client';

import React, { useEffect, useState } from 'react';
import { getAchievementById } from '@/utils/achievementsEngine';
import Confetti from './Confetti';

const AchievementNotification = ({ achievementId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const achievement = getAchievementById(achievementId);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!achievement) return null;

  return (
    <>
      <Confetti />
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border-4 border-yellow-300">
          <div className="text-center">
            <div className="text-6xl mb-3 animate-bounce">
              {achievement.icon}
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-yellow-900 mb-1">
              Achievement Unlocked!
            </div>
            <div className="text-xl font-bold text-white mb-2">
              {achievement.name}
            </div>
            <div className="text-sm text-yellow-100">
              {achievement.description}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="mt-4 w-full py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-yellow-50 transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>
    </>
  );
};

export default AchievementNotification;
