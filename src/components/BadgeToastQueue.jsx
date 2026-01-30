'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getBadgeById } from '@/utils/badgesEngine';

const normalizeBadges = (unlocks = []) =>
  unlocks
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return getBadgeById(item);
      if (item.id) return getBadgeById(item.id) || item;
      return null;
    })
    .filter(Boolean);

const BadgeToast = ({ badge, onClose, onView }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timerIn = setTimeout(() => setVisible(true), 10);
    const timerOut = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(badge.id), 250);
    }, 4200);
    return () => {
      clearTimeout(timerIn);
      clearTimeout(timerOut);
    };
  }, [badge.id, onClose]);

  return (
    <div
      className={`
        badge-toast-pop
        rounded-2xl border border-border bg-card shadow-xl
        px-4 py-3 flex items-center gap-3
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="text-3xl badge-sparkle" role="img" aria-label={`${badge.name} badge`}>
        {badge.icon}
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Badge Unlocked!</p>
        <p className="text-sm font-semibold text-foreground">{badge.name}</p>
      </div>
      <button
        onClick={() => onView?.(badge)}
        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[hsl(var(--badge-new))] text-foreground hover:opacity-90 transition"
      >
        View
      </button>
    </div>
  );
};

const BadgeToastQueue = ({ unlocks = [], onConsume, onView }) => {
  const [queue, setQueue] = useState([]);

  const incoming = useMemo(() => normalizeBadges(unlocks), [unlocks]);

  useEffect(() => {
    if (!incoming.length) return;
    queueMicrotask(() => {
      setQueue((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const next = [...prev];
        incoming.forEach((badge) => {
          if (!existingIds.has(badge.id)) next.push(badge);
        });
        return next;
      });
      if (onConsume) onConsume();
    });
  }, [incoming, onConsume]);

  const handleDismiss = (badgeId) => {
    setQueue((prev) => prev.filter((item) => item.id !== badgeId));
  };

  if (!queue.length) return null;

  return (
    <div
      className="
        fixed z-[95]
        bottom-[calc(env(safe-area-inset-bottom)+1rem)]
        left-1/2 -translate-x-1/2
        sm:left-auto sm:right-4 sm:translate-x-0
        flex flex-col gap-3
        w-[min(92vw,360px)]
      "
    >
      {queue.map((badge) => (
        <BadgeToast
          key={badge.id}
          badge={badge}
          onClose={handleDismiss}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default BadgeToastQueue;
