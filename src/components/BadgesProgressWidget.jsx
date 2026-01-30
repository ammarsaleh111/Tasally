'use client';

import React, { useMemo } from 'react';
import { getBadgeCounts, getNextBadge } from '@/utils/badgesUtils';

const BadgesProgressWidget = ({ profile, variant = 'default' }) => {
  const counts = useMemo(() => getBadgeCounts(profile), [profile]);
  const nextBadge = useMemo(() => getNextBadge(profile), [profile]);

  const progressPercent = Math.round((counts.ratio || 0) * 100);

  const getRemainingText = () => {
    if (!nextBadge?.progress) return '';
    const unitMap = {
      gamesWon: 'wins',
      gamesPlayed: 'plays',
      currentStreak: 'days',
      perfectGames: 'perfects',
      totalWords: 'words',
      totalPangrams: 'pangrams',
      queenBeeCount: 'queen bees',
      maxComboLength: 'combo',
      totalBonusWords: 'bonus words',
      exactHits: 'exact hits',
      noHintWins: 'no-hint wins',
      rankGenius: 'genius ranks',
    };

    if (nextBadge.progress.comparison === 'lte') {
      const unit = nextBadge.progress.metric === 'bestTime' ? 's' : 'tries';
      return `Target <= ${nextBadge.progress.target}${unit}`;
    }

    const remaining = Math.max(0, nextBadge.progress.target - nextBadge.progress.current);
    if (!Number.isFinite(remaining)) return '';
    const unit = unitMap[nextBadge.progress.metric] ? ` ${unitMap[nextBadge.progress.metric]}` : '';
    return `${remaining}${unit} away`;
  };

  return (
    <div
      className={`
        rounded-2xl border border-border bg-card
        ${variant === 'compact' ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Badges</p>
          <p className="text-lg font-semibold text-foreground">
            {counts.earned}/{counts.total}
          </p>
        </div>
        <div className="text-sm font-semibold text-muted-foreground">{progressPercent}%</div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(var(--badge-new))]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {nextBadge && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={nextBadge.name}>
            {nextBadge.icon}
          </span>
          <div className="text-sm">
            <p className="text-foreground font-medium line-clamp-1">Next: {nextBadge.name}</p>
            <p className="text-xs text-muted-foreground">{getRemainingText()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesProgressWidget;
