'use client';

import React, { useEffect, useState } from 'react';
import { getTimeUntilNextPuzzle, hasPlayedToday } from '@/utils/profileManager';

const DailyReminder = ({ gameName, visible = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeUntilNextPuzzle());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilNextPuzzle());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const playedToday = hasPlayedToday(gameName);

  if (!visible || !playedToday) return null;

  return (
    <div className="bg-wordle-correct text-button-text rounded-xl p-6 shadow-lg">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">
          ✅ Great job today!
        </div>
        <div className="text-sm opacity-90 mb-4">
          Come back tomorrow for a new puzzle
        </div>
        <div className="bg-card/20 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wide opacity-75 mb-2">
            Next puzzle in
          </div>
          <div className="text-3xl font-bold font-mono">
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReminder;
