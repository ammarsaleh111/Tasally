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
    await fetch('/api/activity', {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ userId, name: name || 'Anonymous', event }),
    });
  } catch (error) {
    console.warn('[syncActivity] Failed to sync activity', error);
  }
}
