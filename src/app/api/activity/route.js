import { NextResponse } from 'next/server';
import { getActivityStore, saveActivityStore } from '@/lib/serverData';

export async function GET() {
  const store = await getActivityStore();
  return NextResponse.json(store);
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { userId, name, event } = payload || {};

    if (!userId || !event) {
      return NextResponse.json({ error: 'Missing userId or event' }, { status: 400 });
    }

    const store = await getActivityStore();
    let sessions = store.sessions || [];

    let userSession = sessions.find(session => session.userId === userId);
    if (!userSession) {
      userSession = {
        userId,
        name: name || 'Anonymous',
        lastSeen: new Date().toISOString(),
        currentPage: event.page || 'unknown',
        currentGame: event.game || null,
        activities: [],
      };
      sessions.push(userSession);
    }

    userSession.name = name || userSession.name;
    userSession.lastSeen = event.timestamp || new Date().toISOString();
    userSession.currentPage = event.page || userSession.currentPage;
    userSession.currentGame = event.game || userSession.currentGame;

    userSession.activities = userSession.activities || [];
    userSession.activities.push(event);
    if (userSession.activities.length > 200) {
      userSession.activities = userSession.activities.slice(-200);
    }

    sessions = sessions
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, 500);

    store.sessions = sessions;
    await saveActivityStore(store);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /activity] Error', error);
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 });
  }
}
