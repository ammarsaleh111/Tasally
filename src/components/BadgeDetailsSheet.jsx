'use client';

import React, { useEffect, useMemo } from 'react';
import { buildBadgeViewModel, markBadgesSeen } from '@/utils/badgesUtils';
import { getProfile } from '@/utils/profileManager';

const BadgeDetailsSheet = ({ badge, isOpen, onClose, relatedBadges = [] }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      markBadgesSeen();
    }
  }, [isOpen]);

  const resolvedBadge = useMemo(() => {
    if (!badge) return null;
    if (badge.progress) return badge;
    const profile = getProfile();
    const viewModel = buildBadgeViewModel(profile);
    return viewModel.find((item) => item.id === badge.id) || badge;
  }, [badge]);

  if (!resolvedBadge) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] transition-opacity ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`
          absolute bottom-0 left-0 right-0
          md:top-0 md:right-0 md:left-auto md:h-full md:w-[420px]
          bg-card border border-border shadow-2xl
          rounded-t-3xl md:rounded-none md:rounded-l-3xl
          transition-transform duration-300
          ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
        `}
      >
        <div className="h-1.5 w-12 bg-muted-foreground/30 rounded-full mx-auto mt-3 md:hidden" />
        <div className="flex items-start justify-between px-5 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Badge Details</p>
            <h3 className="text-xl font-bold text-foreground">{resolvedBadge.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition"
            aria-label="Close badge details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] overflow-y-auto max-h-[88vh] md:max-h-full">
          <div className="mt-4 flex items-center gap-4">
            <div className={`text-6xl ${resolvedBadge.earned ? 'badge-sparkle' : 'opacity-60 grayscale'}`} role="img" aria-label={resolvedBadge.name}>
              {resolvedBadge.icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{resolvedBadge.category}</p>
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wide">{resolvedBadge.rarity} rarity</p>
              {resolvedBadge.isNew && (
                <span className="inline-flex mt-2 px-2 py-1 rounded-full text-[10px] font-bold badge-new-ribbon">
                  NEW
                </span>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground">{resolvedBadge.description}</p>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-foreground mb-2">Requirements</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {resolvedBadge.requirementLines?.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--badge-new))]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current progress</span>
              <span className="font-semibold text-foreground">{resolvedBadge.progressText}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-[hsl(var(--badge-new))]"
                style={{ width: `${Math.round((resolvedBadge.progress?.ratio || 0) * 100)}%` }}
              />
            </div>
            {resolvedBadge.earned && resolvedBadge.earnedAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Earned {new Date(resolvedBadge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {relatedBadges.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Related badges</h4>
              <div className="grid grid-cols-2 gap-3">
                {relatedBadges.slice(0, 4).map((related) => (
                  <div
                    key={related.id}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-xs flex items-center gap-2"
                  >
                    <span className="text-lg">{related.icon}</span>
                    <span className="line-clamp-1">{related.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeDetailsSheet;
