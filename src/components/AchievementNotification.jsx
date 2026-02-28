'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAchievementById } from '@/utils/achievementsEngine';
import WinConfettiOverlay from './WinConfettiOverlay';

const AchievementNotification = ({ achievementId, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const achievement = getAchievementById(achievementId);

  const handleConfettiDone = useCallback(() => {
    setShowConfetti(false);
  }, []);

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
      <WinConfettiOverlay
        active={showConfetti}
        durationMs={2500}
        intensity={0.7}
        origin="top"
        onDone={handleConfettiDone}
      />
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="bg-wordle-correct rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border-4 border-wordle-present">
          <div className="text-center">
            <div className="text-6xl mb-3 animate-bounce">
              {achievement.icon}
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-background mb-1">
              Achievement Unlocked!
            </div>
            <div className="text-xl font-bold text-button-text mb-2">
              {achievement.name}
            </div>
            <div className="text-sm text-button-text opacity-90">
              {achievement.description}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="mt-4 w-full py-2 bg-card text-wordle-correct rounded-lg font-bold hover:bg-surface-hover transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>
    </>
  );
};

export default AchievementNotification;
