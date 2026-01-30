'use client';

import React, { useMemo } from 'react';
import BadgeCard from '@/components/BadgeCard';
import { getBadgeById } from '@/utils/badgesEngine';

const BadgeEarnedRecap = ({ badges = [] }) => {
  const earnedBadges = useMemo(
    () =>
      badges
        .map((badge) => (badge?.id ? getBadgeById(badge.id) || badge : getBadgeById(badge)))
        .filter(Boolean),
    [badges]
  );

  if (!earnedBadges.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">Badges Earned</h4>
        <span className="text-xs text-muted-foreground">{earnedBadges.length} new</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {earnedBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={{ ...badge, earned: true }}
            compact
            showProgress={false}
            className="min-w-[160px]"
          />
        ))}
      </div>
    </div>
  );
};

export default BadgeEarnedRecap;
