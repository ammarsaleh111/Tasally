'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Unified GameHeader - Consistent header for ALL games
 * 
 * Features:
 * - Same position, style, animation across all games
 * - Standard buttons: How to Play (?), Stats (📊), Learning Log (📘)
 * - Learning Log button only visible after game ends
 * 
 * @param {string} title - Game title
 * @param {function} onHowToPlay - Handler for How to Play modal
 * @param {function} onStats - Handler for Stats modal
 * @param {function} onLearningLog - Handler for Learning Log modal
 * @param {boolean} gameComplete - Whether the game has ended
 * @param {boolean} showLearningLog - Override to show Learning Log button
 */
const GameHeader = ({ 
  title, 
  onHowToPlay, 
  onStats, 
  onLearningLog,
  gameComplete = false,
  showLearningLog = false,
}) => {
  // Learning Log is available after game ends or when explicitly shown
  const canShowLearningLog = gameComplete || showLearningLog;

  return (
    <header className="w-full border-b border-border-default pb-6 mb-6 pt-6 bg-background/80 backdrop-blur sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Navigation and How to Play */}
          <div className="flex items-center gap-3 flex-1">
            <Link 
              href="/games" 
              className="text-sm text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>←</span>
              <span className="hidden sm:inline">Games</span>
            </Link>
            
            {onHowToPlay && (
              <button
                onClick={onHowToPlay}
                className="game-header-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200"
                title="How to Play"
              >
                <span className="text-base">❓</span>
                <span className="hidden sm:inline">How to Play</span>
              </button>
            )}
          </div>

          {/* Center - Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-serif text-foreground text-center">
            {title}
          </h1>

          {/* Right Side - Stats and Learning Log */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {onStats && (
              <button
                onClick={onStats}
                className="game-header-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200"
                title="Statistics"
              >
                <span className="text-base">📊</span>
                <span className="hidden sm:inline">Stats</span>
              </button>
            )}
            
            {onLearningLog && (
              <button
                onClick={onLearningLog}
                disabled={!canShowLearningLog}
                className={`game-header-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  canShowLearningLog
                    ? 'text-text-muted hover:text-foreground hover:bg-surface-hover'
                    : 'text-text-muted/40 cursor-not-allowed'
                }`}
                title={canShowLearningLog ? 'Learning Log' : 'Available after game ends'}
              >
                <span className="text-base">📘</span>
                <span className="hidden sm:inline">Learning Log</span>
                {!canShowLearningLog && (
                  <span className="text-xs">🔒</span>
                )}
              </button>
            )}
            
            <Link 
              href="/" 
              className="text-sm text-text-muted hover:text-foreground transition-colors hidden sm:block"
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
