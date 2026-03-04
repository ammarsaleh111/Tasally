/**
 * Backend Sync — Profile & Activity
 * ─────────────────────────────────────────────────────────
 * Now offline-aware: failed requests are queued locally via
 * fetchOrQueue and retried when the device reconnects.
 * ─────────────────────────────────────────────────────────
 */

import { fetchOrQueue } from './fetchOrQueue';

export async function syncProfile(profile) {
  if (typeof window === 'undefined' || !profile) return;

  await fetchOrQueue('/api/players', 'POST', {
    userId: profile.userId,
    name: profile.name || 'Anonymous',
    createdAt: profile.createdAt,
    updatedAt: new Date().toISOString(),
    games: profile.games,
  });
}

export async function syncActivityEvent(userId, name, event) {
  if (typeof window === 'undefined' || !userId || !event) return;

  await fetchOrQueue('/api/activity', 'POST', {
    userId,
    name: name || 'Anonymous',
    event,
  });
}
