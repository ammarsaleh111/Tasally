'use client';

import Link from 'next/link';
import { GROUP_UNLIMITED_GAMES } from '@/lib/groups/constants';

/**
 * Grid of unlimited-mode game cards for a group.
 * Shows ONLY the 6 approved unlimited games.
 *
 * ROUTING: Navigates to /games/:gameKey?mode=unlimited&groupId=X&groupName=Y
 * This preserves context in URL params for proper result submission.
 */
export default function GroupGameCards({ groupId, groupName = '' }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
      {GROUP_UNLIMITED_GAMES.map((game) => {
        // Build URL with context params
        const params = new URLSearchParams({
          mode: 'unlimited',
          groupId,
        });
        if (groupName) {
          params.set('groupName', groupName);
        }
        const href = `/games/${game.key}?${params.toString()}`;

        return (
          <Link
            key={game.key}
            href={href}
            className="
              group relative
              bg-[hsl(var(--card))] border border-[hsl(var(--border))]
              rounded-2xl p-4 md:p-5
              hover:shadow-lg hover:-translate-y-0.5
              active:scale-[0.98]
              transition-all duration-200 cursor-pointer
            "
          >
            {/* Icon */}
            <div className="text-center mb-3">
              <span className="text-3xl md:text-4xl inline-block group-hover:scale-110 transition-transform duration-200">
                {game.icon}
              </span>
            </div>

            {/* Label */}
            <h3 className="text-center font-bold text-sm md:text-base text-[hsl(var(--foreground))]">
              {game.label}
            </h3>

            {/* Mode badge */}
            <div className="text-center mt-2">
              <span className="
                inline-block text-xs font-medium px-2 py-0.5 rounded-full
                bg-emerald-500/15 text-emerald-500
              ">
                Unlimited
              </span>
            </div>

            {/* Play arrow on hover */}
            <div className="
              absolute bottom-2 right-2 opacity-0 group-hover:opacity-100
              transition-opacity duration-200
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[hsl(var(--muted-foreground))]">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
