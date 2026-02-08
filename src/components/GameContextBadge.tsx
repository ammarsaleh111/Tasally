/**
 * Game Context Badge Component
 *
 * Displays the current game context (Global vs Group) in the game header.
 * Helps users understand where their results will be submitted.
 */

'use client';

import { GameContext, formatContextBadge } from '@/lib/gameContext';

interface GameContextBadgeProps {
  context: GameContext;
  size?: 'sm' | 'md';
}

export default function GameContextBadge({ context, size = 'md' }: GameContextBadgeProps) {
  const { label, color, icon } = formatContextBadge(context);

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-3 py-1 gap-1.5';

  return (
    <div
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses}
      `}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
