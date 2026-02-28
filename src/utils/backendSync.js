const API_HEADERS = {
  'Content-Type': 'application/json',
};

export async function syncProfile(profile) {
  if (typeof window === 'undefined' || !profile) return;
  try {
    await fetch('/api/players', {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({
        userId: profile.userId,
        name: profile.name || 'Anonymous',
        createdAt: profile.createdAt,
        updatedAt: new Date().toISOString(),
        games: profile.games,
      }),
    });
  } catch (error) {
    console.warn('[syncProfile] Failed to sync profile', error);
  }
}

export async function syncActivityEvent(userId, name, event) {
  if (typeof window === 'undefined' || !userId || !event) return;
  try {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ userId, name: name || 'Anonymous', event }),
    });
    // Silently ignore 429 rate limits
    if (response && !response.ok && response.status !== 429) {
      console.warn('[syncActivity] Unexpected status:', response.status);
    }
  } catch {
    // Silently ignore network errors (server restart, connection refused, etc.)
  }
}
