'use client';

import React from 'react';

/**
 * SolvedStateBanner - Visual indicator that game is complete
 * Shows prominently after user closes result modal
 * 
 * @param {boolean} isWin - Won or lost
 * @param {string} message - Primary message
 * @param {string} subtitle - Secondary message
 * @param {React.ReactNode} actionButton - Optional CTA
 */
const SolvedStateBanner = ({ isWin, message, subtitle, actionButton }) => {
  if (!message) return null;

  return (
    <div className={`w-full max-w-2xl mx-auto mb-6 rounded-xl p-6 border-2 transition-all duration-300 ${
      isWin 
        ? 'bg-gradient-to-r from-success/10 to-success/5 border-success/40 shadow-lg shadow-success/10' 
        : 'bg-gradient-to-r from-muted/10 to-muted/5 border-border/60'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className={`text-4xl ${isWin ? 'animate-bounce-gentle' : ''}`}>
            {isWin ? '✅' : '📝'}
          </div>

          {/* Text */}
          <div>
            <div className={`text-xl font-bold ${isWin ? 'text-success' : 'text-foreground'}`}>
              {message}
            </div>
            {subtitle && (
              <div className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Optional Action */}
        {actionButton && (
          <div>
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolvedStateBanner;
