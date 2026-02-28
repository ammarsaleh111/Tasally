import { NextResponse } from 'next/server';
import { getActivityStore, saveActivityStore } from '@/lib/serverData';
import { sanitizeName, sanitizeString, isRateLimited } from '@/utils/inputSanitizer';

// Rate limiting
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW = 60000;
const MAX_PAYLOAD_SIZE = 5000;

function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 'unknown';
  return `activity:${ip}`;
}

export async function GET(request) {
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ ok: true, throttled: true, sessions: [] });
  }

  const store = await getActivityStore();
  
  // Sanitize output before sending
  const safeSessions = (store.sessions || []).map(session => ({
    userId: sanitizeString(session.userId, 100),
    name: sanitizeName(session.name) || 'Anonymous',
    lastSeen: session.lastSeen,
    currentPage: sanitizeString(session.currentPage, 100),
    currentGame: session.currentGame ? sanitizeString(session.currentGame, 50) : null,
    // Don't send full activity logs to reduce data leakage
  }));

  return NextResponse.json({ sessions: safeSessions });
}

export async function POST(request) {
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ ok: true, throttled: true, dropped: true });
  }

  try {
    // Validate payload size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId, name, event } = payload || {};

    // Validate required fields
    const sanitizedUserId = sanitizeString(userId, 100);
    if (!sanitizedUserId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!event || typeof event !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid event' }, { status: 400 });
    }

    // Sanitize name
    const sanitizedName = name ? sanitizeName(name) : 'Anonymous';
    const safeName = sanitizedName || 'Anonymous';

    // Sanitize event fields
    const sanitizedEvent = {
      page: event.page ? sanitizeString(event.page, 100) : 'unknown',
      game: event.game ? sanitizeString(event.game, 50) : null,
      timestamp: event.timestamp || new Date().toISOString(),
      // Add other event fields as needed, but sanitize everything
    };

    // Validate timestamp
    try {
      const date = new Date(sanitizedEvent.timestamp);
      if (isNaN(date.getTime())) {
        sanitizedEvent.timestamp = new Date().toISOString();
      }
    } catch (e) {
      sanitizedEvent.timestamp = new Date().toISOString();
    }

    const store = await getActivityStore();
    let sessions = store.sessions || [];

    let userSession = sessions.find(session => session.userId === sanitizedUserId);
    if (!userSession) {
      userSession = {
        userId: sanitizedUserId,
        name: safeName,
        lastSeen: new Date().toISOString(),
        currentPage: sanitizedEvent.page,
        currentGame: sanitizedEvent.game,
        activities: [],
      };
      sessions.push(userSession);
    }

    userSession.name = safeName;
    userSession.lastSeen = sanitizedEvent.timestamp;
    userSession.currentPage = sanitizedEvent.page;
    userSession.currentGame = sanitizedEvent.game;

    userSession.activities = userSession.activities || [];
    userSession.activities.push(sanitizedEvent);
    
    // Limit activities per user to prevent memory abuse
    if (userSession.activities.length > 200) {
      userSession.activities = userSession.activities.slice(-200);
    }

    // Limit total sessions to prevent memory abuse
    sessions = sessions
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, 500);

    store.sessions = sessions;
    await saveActivityStore(store);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Don't leak error details
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
