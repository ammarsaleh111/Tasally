'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BadgeCard from '@/components/BadgeCard';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import { buildBadgeViewModel } from '@/utils/badgesUtils';
import { getProfile } from '@/utils/profileManager';

const BadgesDrawer = ({ isOpen, onClose }) => {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const profile = getProfile();
    queueMicrotask(() => {
      setBadges(buildBadgeViewModel(profile));
    });
  }, [isOpen]);

  /* Auto-dismiss after 4 seconds */
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => onClose(), 1000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const recentEarned = useMemo(
    () =>
      badges
        .filter((badge) => badge.earned)
        .sort((a, b) => new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime())
        .slice(0, 3),
    [badges]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="
          absolute bottom-0 left-0 right-0
          md:top-0 md:right-0 md:left-auto md:h-full md:w-[360px]
          bg-card border border-border shadow-2xl
          rounded-t-3xl md:rounded-none md:rounded-l-3xl
          animate-in slide-in-from-bottom md:slide-in-from-right duration-300
        "
      >
        <div className="h-1.5 w-12 bg-muted-foreground/30 rounded-full mx-auto mt-3 md:hidden" />
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Badges</p>
            <h3 className="text-lg font-semibold text-foreground">Your progress</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition"
            aria-label="Close badges drawer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] overflow-y-auto max-h-[85vh] md:max-h-full">
          <div className="mt-4">
            <BadgesProgressWidget variant="compact" />
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">Recent badges</h4>
            {recentEarned.length ? (
              <div className="flex flex-col gap-2">
                {recentEarned.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} compact showProgress={false} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Play a game to start earning badges.</p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/badges"
              className="w-full text-center px-4 py-2 rounded-full bg-[hsl(var(--badge-new))] text-foreground font-semibold hover:opacity-90 transition"
            >
              View all badges
            </Link>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition"
            >
              Back to game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgesDrawer;
