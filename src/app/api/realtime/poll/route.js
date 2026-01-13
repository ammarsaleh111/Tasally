/**
 * Real-Time Polling Fallback API Route
 * For browsers that don't support SSE
 */

export async function GET(request) {
  // This is a fallback endpoint that returns current metrics
  // The SSE stream is preferred but this works for older browsers
  
  try {
    // Fetch current state from the activity API
    const activityRes = await fetch(new URL('/api/activity', request.url).toString());
    const activityData = activityRes.ok ? await activityRes.json() : { sessions: [], events: [] };
    
    // Fetch player data
    const playersRes = await fetch(new URL('/api/players', request.url).toString());
    const playersData = playersRes.ok ? await playersRes.json() : { players: [] };
    
    // Calculate metrics
    const now = Date.now();
    const activeSessions = (activityData.sessions || [])
      .filter(s => now - (s.lastSeen || s.timestamp) < 5 * 60 * 1000);
    
    const recentEvents = (activityData.events || [])
      .filter(e => now - e.timestamp < 30 * 60 * 1000)
      .slice(0, 50);
    
    // Game distribution
    const gameDistribution = {};
    recentEvents.forEach(e => {
      if (e.game) {
        gameDistribution[e.game] = (gameDistribution[e.game] || 0) + 1;
      }
    });
    
    return Response.json({
      metrics: {
        activePlayers: activeSessions.length,
        activeGames: Object.keys(gameDistribution).length,
        gameDistribution,
        sessions: activeSessions.map(s => ({
          id: s.sessionId?.substring(0, 8) + '...',
          name: s.playerName || 'Anonymous',
          currentGame: s.currentGame,
          lastSeen: s.lastSeen,
        })),
        liveGames: recentEvents
          .filter(e => e.eventType === 'progress' || e.eventType === 'start')
          .slice(0, 10)
          .map(e => ({
            player: e.playerName || 'Anonymous',
            game: e.game,
            progress: e.details?.progress || 0,
            timestamp: e.timestamp,
          })),
      },
      players: playersData.players || [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Poll] Error:', error);
    return Response.json({ 
      error: 'Failed to fetch data',
      metrics: { activePlayers: 0, activeGames: 0 },
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
