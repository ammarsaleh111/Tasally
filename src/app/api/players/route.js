import { NextResponse } from 'next/server';
import { getAllPlayers, savePlayers, getActivityStore, saveActivityStore } from '@/lib/serverData';
import { sanitizeName, sanitizeString, isRateLimited } from '@/utils/inputSanitizer';

// Rate limiting: 30 requests per minute per IP
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60000;

// Max payload size (in characters)
const MAX_PAYLOAD_SIZE = 10000;

function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 'unknown';
  return `players:${ip}`;
}

export async function GET(request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const nameCheck = searchParams.get('checkName');
  
  const players = await getAllPlayers();
  
  if (nameCheck) {
    // Sanitize the name being checked
    const sanitizedName = sanitizeName(nameCheck);
    
    if (!sanitizedName || sanitizedName.length < 1 || sanitizedName.length > 50) {
      return NextResponse.json({ available: false, error: 'invalid-name' });
    }

    // Case-insensitive check for duplicate name
    const exists = players.some(p => 
      sanitizeName(p.name).toLowerCase() === sanitizedName.toLowerCase()
    );
    
    return NextResponse.json({ available: !exists });
  }

  // Don't expose all player data to unauthorized requests
  // Only return sanitized, minimal info
  const safePlayerData = players.map(p => ({
    userId: sanitizeString(p.userId, 100),
    name: sanitizeName(p.name),
  }));

  return NextResponse.json({ players: safePlayerData });
}

export async function POST(request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    // Parse request with size validation
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

    const { userId, name, createdAt, updatedAt, games } = payload || {};

    // Validate and sanitize userId
    const sanitizedUserId = sanitizeString(userId, 100);
    if (!sanitizedUserId) {
      return NextResponse.json({ error: 'Missing or invalid userId' }, { status: 400 });
    }

    // Validate and sanitize name
    const sanitizedName = sanitizeName(name);
    if (!sanitizedName || sanitizedName.length < 1 || sanitizedName.length > 50) {
      return NextResponse.json({ error: 'Invalid name format' }, { status: 400 });
    }

    // Validate dates if provided
    let safeCreatedAt = new Date().toISOString();
    let safeUpdatedAt = new Date().toISOString();

    if (createdAt) {
      try {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
          safeCreatedAt = date.toISOString();
        }
      } catch (e) {
        // Use default
      }
    }

    if (updatedAt) {
      try {
        const date = new Date(updatedAt);
        if (!isNaN(date.getTime())) {
          safeUpdatedAt = date.toISOString();
        }
      } catch (e) {
        // Use default
      }
    }

    // Sanitize games object
    let safeGames = {};
    if (games && typeof games === 'object' && !Array.isArray(games)) {
      // Only allow specific game keys and validate structure
      const allowedGames = ['wordle', 'connections', 'crossword', 'numbers', 'trivia', 'spelling', 'strands'];
      for (const gameKey of allowedGames) {
        if (games[gameKey]) {
          // Basic validation - games data should be objects
          if (typeof games[gameKey] === 'object') {
            safeGames[gameKey] = games[gameKey];
          }
        }
      }
    }

    const players = await getAllPlayers();
    const existingIndex = players.findIndex(player => player.userId === sanitizedUserId);

    const playerRecord = {
      userId: sanitizedUserId,
      name: sanitizedName,
      createdAt: safeCreatedAt,
      updatedAt: safeUpdatedAt,
      games: safeGames,
    };

    if (existingIndex >= 0) {
      players[existingIndex] = {
        ...players[existingIndex],
        ...playerRecord,
      };
    } else {
      players.push(playerRecord);
    }

    await savePlayers(players);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Don't leak error details
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  if (isRateLimited(clientId, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Sanitize userId
    const sanitizedUserId = sanitizeString(userId, 100);
    if (!sanitizedUserId) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // Get current players
    const players = await getAllPlayers();
    const playerIndex = players.findIndex(p => p.userId === sanitizedUserId);

    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Remove player from players array
    const deletedPlayer = players.splice(playerIndex, 1)[0];
    await savePlayers(players);

    // Also remove from activity store
    try {
      const activityStore = await getActivityStore();
      if (activityStore.sessions) {
        activityStore.sessions = activityStore.sessions.filter(
          s => s.userId !== sanitizedUserId
        );
        await saveActivityStore(activityStore);
      }
    } catch (error) {
      console.warn('[DELETE] Failed to clean up activity data', error.message);
    }

    return NextResponse.json({ 
      ok: true, 
      deletedUser: {
        userId: deletedPlayer.userId,
        name: deletedPlayer.name,
      }
    });
  } catch (error) {
    console.error('[DELETE] Error deleting player:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
