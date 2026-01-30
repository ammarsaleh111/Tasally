'use client';

import React from 'react';

const BadgeCard = ({
  badge,
  onSelect,
  compact = false,
  showProgress = true,
  className = '',
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(badge);
  };

  if (!badge) return null;

  const earned = Boolean(badge.earned);
  const isLocked = !earned;
  const showLockedProgress = isLocked && showProgress;
  const progressPercent = badge.progress ? Math.round(badge.progress.ratio * 100) : 0;
  const cardClasses = compact
    ? `
        badge-card
        rounded-xl border
        px-3 py-2
        flex items-center gap-3
        ${earned ? 'badge-card--earned' : 'badge-card--locked'}
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
      `
    : `
      badge-card
      rounded-2xl border
      p-4
      relative
      flex flex-col gap-3
      text-left
      ${earned ? 'badge-card--earned badge-glow' : 'badge-card--locked'}
      transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
    `;

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={`group ${cardClasses} ${className}`}
      aria-label={`${badge.name} badge`}
    >
      {badge.isNew && !compact && (
        <span className="badge-new-ribbon absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
          NEW
        </span>
      )}
      {isLocked && !compact && (
        <span className="absolute top-3 right-3 text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      )}

      <div className={`flex items-center gap-3 ${compact ? '' : 'justify-between'}`}>
        <div
          className={`${compact ? 'text-3xl' : 'text-5xl'} ${badge.earned ? 'badge-sparkle' : 'opacity-60 grayscale'}`}
          role="img"
          aria-label={badge.name}
        >
          {badge.icon}
        </div>
        {!compact && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
              badge.earned ? 'bg-success/15 text-success' : 'bg-muted/60 text-muted-foreground'
            }`}
          >
            {badge.earned ? 'Earned' : 'Locked'}
          </span>
        )}
      </div>

      <div>
        <div className={`font-semibold text-sm ${compact ? 'line-clamp-1' : 'text-base line-clamp-1'}`}>
          {badge.name}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground line-clamp-2">{badge.description}</div>
        )}
      </div>

      {showLockedProgress && (
        <div className="mt-auto">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{badge.progressText}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-[hsl(var(--badge-new))]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!compact && (
        <div className="hidden md:block absolute inset-x-4 -bottom-8 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
          <div className="rounded-lg bg-card text-foreground border border-border px-3 py-2 text-xs shadow-lg">
            {badge.progressText || badge.description}
          </div>
        </div>
      )}
    </button>
  );
};

export default BadgeCard;
