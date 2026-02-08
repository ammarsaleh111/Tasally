/**
 * GameContextHeader
 *
 * Displays the current game context (Global or Group) with a return button.
 * Use this in unlimited mode games to show context and provide navigation.
 */

'use client';

import React from 'react';
import { useGameContext } from '@/hooks/useGameContext';

// Simple arrow left icon
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
    />
  </svg>
);

interface GameContextHeaderProps {
  /** Game title to display */
  gameTitle?: string;
  /** Whether to show the return button */
  showReturn?: boolean;
  /** Custom class name for the container */
  className?: string;
}

export default function GameContextHeader({
  gameTitle,
  showReturn = true,
  className = '',
}: GameContextHeaderProps) {
  const { context, returnToHub, isGroupGame, groupName, ready } = useGameContext();

  if (!ready) {
    return null;
  }

  const badgeClass = isGroupGame
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : 'bg-green-500/20 text-green-400 border-green-500/30';
  const badgeIcon = isGroupGame ? '👥' : '🌍';
  const badgeLabel = isGroupGame ? groupName || 'Group' : 'Global';
  const returnLabel = isGroupGame ? 'Back to Group' : 'Back to Games';

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left: Return button */}
      {showReturn && (
        <button
          onClick={returnToHub}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{returnLabel}</span>
        </button>
      )}

      {/* Center: Game title (optional) */}
      {gameTitle && (
        <h1 className="text-lg font-bold text-white">{gameTitle}</h1>
      )}

      {/* Right: Context badge */}
      <span
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${badgeClass}`}
      >
        <span>{badgeIcon}</span>
        <span className="font-medium">{badgeLabel}</span>
        <span className="text-xs opacity-70">• Unlimited</span>
      </span>
    </div>
  );
}
