import React from 'react';
import Modal from './Modal';
import { calculateWinRate } from '@/utils/statsCalculator';

const Statistics = ({ isOpen, onClose, stats }) => {
  const { played = 0, won = 0, currentStreak = 0, maxStreak = 0, distribution = {} } = stats;
  
  // Use centralized win rate calculation - ensures it never exceeds 100%
  const winPercentage = calculateWinRate(won, played);
  
  // Find max count for scaling bars
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <Modal 
      isOpen={isOpen} 
      title="Statistics"
    >
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{played}</div>
            <div className="text-xs text-text-muted uppercase">Played</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{winPercentage}</div>
            <div className="text-xs text-text-muted uppercase">Win %</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{currentStreak}</div>
            <div className="text-xs text-text-muted uppercase">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{maxStreak}</div>
            <div className="text-xs text-text-muted uppercase">Max Streak</div>
          </div>
        </div>

        {/* Guess Distribution */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-foreground">
            Guess Distribution
          </h3>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map((guess) => {
              const count = distribution[guess] || 0;
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={guess} className="flex items-center gap-2">
                  <div className="text-sm font-bold w-3 text-foreground">{guess}</div>
                  <div className="flex-1 flex items-center">
                    <div 
                      className="bg-text-muted text-[var(--button-text)] text-xs font-bold px-2 py-1 rounded min-w-[2rem] text-right transition-all duration-300"
                      style={{ 
                        width: `${Math.max(percentage, count > 0 ? 8 : 0)}%`,
                        backgroundColor: count > 0 ? 'var(--wordle-correct)' : 'var(--text-muted)'
                      }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-[var(--button-primary)] text-[var(--button-text)] font-bold hover:bg-[var(--button-primary-hover)] transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default Statistics;
