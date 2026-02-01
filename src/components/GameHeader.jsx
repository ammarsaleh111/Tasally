'use client';

import Link from 'next/link';
import React from 'react';

const HeaderButton = ({ onClick, disabled, icon, label, locked, dataTutorial }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    data-tutorial={dataTutorial}
    className={`
      flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-[44px]
      text-sm font-medium
      transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
      ${disabled
        ? 'text-[hsl(var(--muted-foreground))]/40 cursor-not-allowed'
        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] active:scale-95'
      }
    `}
    title={locked ? `${label} - Available after game ends` : label}
    aria-label={label}
  >
    <span className="text-base">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    {locked && <span className="text-xs">🔒</span>}
  </button>
);

/**
 * Unified GameHeader - Consistent header for ALL games
 * 
 * Features:
 * - Same position, style, animation across all games
 * - Standard buttons: How to Play (?), Stats (📊), Learning Log (📘)
 * - Learning Log button only visible after game ends
 * - Responsive design with mobile-first approach
 * - Theme-aware styling
 * 
 * @param {string} title - Game title
 * @param {function} onHowToPlay - Handler for How to Play modal
 * @param {function} onStats - Handler for Stats modal
 * @param {function} onLearningLog - Handler for Learning Log modal
 * @param {function} onBadges - Handler for Badges drawer
 * @param {boolean} gameComplete - Whether the game has ended
 * @param {boolean} showLearningLog - Override to show Learning Log button
 * @param {string} mode - Game mode (daily/practice/unlimited) for badge display
 * @param {React.ReactNode} themeBadge - Optional theme badge component
 */
const GameHeader = ({ 
  title, 
  onHowToPlay, 
  onStats, 
  onLearningLog,
  onBadges,
  gameComplete = false,
  showLearningLog = false,
  mode,
  themeBadge,
}) => {
  const canShowLearningLog = gameComplete || showLearningLog;

  return (
    <header 
      className="
        w-full sticky top-0 z-40
        bg-[hsl(var(--background))]/95 backdrop-blur-md
        border-b border-[hsl(var(--border))]
        transition-all duration-300
      "
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Navigation and How to Play */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1">
            <Link 
              href="/games" 
              className="
                flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl
                text-sm font-medium
                text-[hsl(var(--muted-foreground))]
                hover:text-[hsl(var(--foreground))]
                hover:bg-[hsl(var(--surface-hover))]
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="hidden sm:inline">Games</span>
            </Link>
            
            {onHowToPlay && (
              <HeaderButton
                onClick={onHowToPlay}
                icon="❓"
                label="How to Play"
                dataTutorial="how-to-play"
              />
            )}
          </div>

          {/* Center - Title and Mode Badge */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 px-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-[hsl(var(--foreground))] text-center">
              {title}
            </h1>
            {(mode || themeBadge) && (
              <div className="flex items-center gap-2 mt-0.5">
                {mode && (
                  <span className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${mode === 'daily' 
                      ? 'bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]' 
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }
                  `}>
                    {mode === 'daily' ? '📅 Daily' : mode === 'unlimited' ? '♾️ Unlimited' : mode}
                  </span>
                )}
                {themeBadge}
              </div>
            )}
          </div>

          {/* Right Side - Stats and Learning Log */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
            {onStats && (
              <HeaderButton
                onClick={onStats}
                icon="📊"
                label="Stats"
                dataTutorial="stats-button"
              />
            )}

            {onLearningLog && (
              <HeaderButton
                onClick={onLearningLog}
                disabled={!canShowLearningLog}
                icon="📘"
                label="Learn"
                locked={!canShowLearningLog}
                dataTutorial="learning-log-button"
              />
            )}
            
            <Link 
              href="/" 
              className="
                hidden sm:flex items-center px-3 py-2 rounded-xl
                text-sm font-medium
                text-[hsl(var(--muted-foreground))]
                hover:text-[hsl(var(--foreground))]
                hover:bg-[hsl(var(--surface-hover))]
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
              "
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
