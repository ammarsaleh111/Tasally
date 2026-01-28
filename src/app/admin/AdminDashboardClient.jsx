'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import DisplayName from '@/components/DisplayName';
import { calculateWinRateDecimal } from '@/utils/statsCalculator';
import { subscribeToRealtime, disconnectRealtime, getRealtimeStatus } from '@/utils/realtimeManager';

export default function AdminDashboardClient() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Real-time state
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Delete user state
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Handle real-time metrics updates
  const handleRealtimeMetrics = useCallback((payload) => {
    setLiveMetrics(payload);
    setLastUpdated(new Date());
    setRefreshCount(count => count + 1);
    setConnectionStatus('connected');
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial data load (for player history)
    const loadInitialData = async () => {
      try {
        const [playersRes, activityRes] = await Promise.all([
          fetch('/api/players').then(res => res.json()),
          fetch('/api/activity').then(res => res.json()),
        ]);

        if (!mounted) return;

        setPlayers(playersRes.players || []);
        setSessions(activityRes.sessions || []);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load admin data', error);
      }
    };

    loadInitialData();
    
    // Subscribe to real-time metrics updates via SSE
    const unsubscribe = subscribeToRealtime('metrics', handleRealtimeMetrics);
    
    // Fallback: poll every 30 seconds if SSE fails
    const fallbackInterval = setInterval(() => {
      const status = getRealtimeStatus();
      if (!status.connected && !status.polling) {
        loadInitialData();
      }
      setConnectionStatus(status.connected ? 'connected' : status.polling ? 'polling' : 'disconnected');
    }, 30000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [handleRealtimeMetrics]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/admin/login', { method: 'DELETE' });
      router.replace('/admin/login');
    } catch (error) {
      console.error('Failed to log out admin', error);
      setIsLoggingOut(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    // Show confirmation dialog
    setDeleteConfirm({ userId, userName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingUserId(deleteConfirm.userId);
      
      const response = await fetch(`/api/players?userId=${encodeURIComponent(deleteConfirm.userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      const result = await response.json();
      
      // Remove user from ALL local state (players, sessions, and live metrics)
      const userIdToDelete = deleteConfirm.userId;
      
      setPlayers(prev => prev.filter(p => p.userId !== userIdToDelete));
      setSessions(prev => prev.filter(s => s.userId !== userIdToDelete));
      
      // Also clear from live metrics if present
      if (liveMetrics) {
        setLiveMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sessions: prev.sessions?.filter(s => s.userId !== userIdToDelete) || [],
          };
        });
      }
      
      // Force a data refresh to ensure consistency
      setTimeout(async () => {
        try {
          const [playersRes, activityRes] = await Promise.all([
            fetch('/api/players').then(res => res.json()),
            fetch('/api/activity').then(res => res.json()),
          ]);
          
          setPlayers(playersRes.players || []);
          setSessions(activityRes.sessions || []);
        } catch (error) {
          console.error('Failed to refresh data after deletion', error);
        }
      }, 500);
      
      // Close confirmation dialog
      setDeleteConfirm(null);
      setDeletingUserId(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
      setDeletingUserId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const gameAggregates = useMemo(() => aggregateGameStats(players), [players]);
  const activeSessions = useMemo(() => filterActiveSessions(sessions, 5), [sessions]);
  const activitySummary = useMemo(() => summarizeActivity(sessions), [sessions]);
  const topPerformers = useMemo(() => {
    const performers = getTopPerformers(sessions);
    // Filter out any performers whose userId doesn't exist in players anymore
    const validPlayerIds = new Set(players.map(p => p.userId));
    return performers.filter(performer => validPlayerIds.has(performer.userId));
  }, [sessions, players]);

  // Use live metrics if available, otherwise fall back to computed values
  const liveActivePlayers = liveMetrics?.activePlayers ?? activeSessions.length;
  const liveActiveGames = liveMetrics?.activeGames ?? Object.keys(activitySummary.gamesPlaying).length;
  const liveGameDistribution = liveMetrics?.gameDistribution ?? activitySummary.gamesPlaying;
  const liveSessions = liveMetrics?.sessions ?? activeSessions.map(s => ({
    id: s.sessionId?.substring(0, 8) + '...',
    name: s.name,
    currentGame: s.currentGame,
    lastSeen: new Date(s.lastSeen).getTime(),
  }));
  const liveGames = liveMetrics?.liveGames ?? [];

  const totalPlayers = players.length;
  const totalGames = gameAggregates.totalGames;
  // Use centralized win rate calculation - ensures it never exceeds 100%
  const overallWinRate = calculateWinRateDecimal(gameAggregates.totalWins, totalGames);

  if (!lastUpdated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto mb-4"></div>
            <p className="text-text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-wordle-absent rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-wordle-absent">⚠️ Delete User Account</h2>
            <p className="text-foreground mb-2">
              Are you sure you want to permanently delete this user?
            </p>
            <div className="bg-surface-hover rounded-lg p-4 mb-6">
              <DisplayName
                name={deleteConfirm.userName || 'Anonymous'}
                className="font-bold text-foreground"
              />
              <p className="text-xs text-text-muted font-mono mt-1">{deleteConfirm.userId}</p>
            </div>
            <p className="text-sm text-wordle-absent mb-6">
              This will permanently delete:
              <br />• Player profile and name
              <br />• All game statistics and progress
              <br />• Activity history and sessions
              <br /><br />
              <strong>This action cannot be undone!</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={!!deletingUserId}
                className="flex-1 px-4 py-2 bg-card border border-card-border hover:bg-surface-hover text-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!deletingUserId}
                className="flex-1 px-4 py-2 bg-wordle-absent hover:bg-red-700 text-button-text rounded-lg transition-colors disabled:opacity-50 font-bold"
              >
                {deletingUserId ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-text-muted">
                Last updated: {lastUpdated?.toLocaleTimeString()} (refresh #{refreshCount})
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                connectionStatus === 'connected' 
                  ? 'bg-wordle-correct text-button-text' 
                  : connectionStatus === 'polling'
                  ? 'bg-wordle-present text-button-text'
                  : 'bg-wordle-absent text-button-text'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-white animate-pulse' : 'bg-white/50'
                }`}></span>
                {connectionStatus === 'connected' ? '🔴 LIVE' : connectionStatus === 'polling' ? 'Polling' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/themes"
              className="px-6 py-2 bg-info/10 text-info border border-info/30 hover:bg-info/20 rounded-lg transition-colors font-medium"
            >
              🎨 Themes
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-6 py-2 bg-wordle-absent hover:bg-surface-hover text-button-text rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>
            <Link
              href="/games"
              className="px-6 py-2 bg-card hover:bg-surface-hover text-foreground border border-card-border rounded-lg transition-colors"
            >
              ← Back to Games
            </Link>
          </div>
        </div>

        {renderContent({
          activeSessions: liveSessions,
          liveActivePlayers,
          liveActiveGames,
          liveGameDistribution,
          liveGames,
          totalGames,
          overallWinRate,
          totalPlayers,
          activitySummary,
          gameAggregates,
          topPerformers,
          players,
          sessions,
          onDeleteUser: handleDeleteUser,
          deletingUserId,
        })}
      </div>
    </div>
  );
}

function renderContent({
  activeSessions,
  liveActivePlayers,
  liveActiveGames,
  liveGameDistribution,
  liveGames,
  totalGames,
  overallWinRate,
  totalPlayers,
  activitySummary,
  gameAggregates,
  topPerformers,
  players,
  sessions,
  onDeleteUser,
  deletingUserId,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Players (Live)"
          value={liveActivePlayers}
          icon="👥"
          color="bg-card border-card-border"
          live={true}
        />
        <MetricCard
          label="Active Games (Live)"
          value={liveActiveGames}
          icon="🎮"
          color="bg-card border-card-border"
          live={true}
        />
        <MetricCard
          label="Overall Win Rate"
          value={`${overallWinRate}%`}
          icon="🏆"
          color="bg-card border-card-border"
        />
        <MetricCard
          label="Total Players (All Time)"
          value={totalPlayers}
          icon="📊"
          color="bg-card border-card-border"
        />
      </div>

      {/* Live Games Section */}
      {liveGames && liveGames.length > 0 && (
        <div className="bg-card border-2 border-wordle-correct rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-wordle-correct rounded-full animate-pulse"></span>
            Games In Progress (Real-Time)
          </h2>
          <div className="space-y-3">
            {liveGames.map((game, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {game.game === 'wordle' ? '📝' : 
                     game.game === 'connections' ? '🔗' :
                     game.game === 'crossword' ? '✏️' :
                     game.game === 'trivia' ? '❓' :
                     game.game === 'numbers' ? '🔢' : '🎮'}
                  </div>
                  <div>
                    <DisplayName
                      name={game.player}
                      className="font-bold"
                    />
                    <div className="text-sm text-text-muted capitalize">Playing {game.game}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {game.progress ? `${Math.round(game.progress * 100)}%` : `${game.attempts || 0} attempts`}
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatTimeAgo(game.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(liveGameDistribution || {}).length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Games Being Played Right Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(liveGameDistribution).map(([game, count]) => (
              <div key={game} className="bg-surface-hover rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-button-primary">{count}</div>
                <div className="text-sm text-text-muted capitalize mt-2">{game}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Game Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-3 px-4 font-bold">Game</th>
                <th className="text-right py-3 px-4 font-bold">Played</th>
                <th className="text-right py-3 px-4 font-bold">Won</th>
                <th className="text-right py-3 px-4 font-bold">Win %</th>
                <th className="text-right py-3 px-4 font-bold">Best Streak</th>
                <th className="text-right py-3 px-4 font-bold">Best Time</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gameAggregates.gameBreakdown).map(([gameName, data]) => (
                <tr key={gameName} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 font-medium capitalize">{gameName}</td>
                  <td className="text-right py-3 px-4">{data.played}</td>
                  <td className="text-right py-3 px-4">{data.won}</td>
                  <td className="text-right py-3 px-4">
                    <span className="inline-block px-3 py-1 bg-wordle-correct text-button-text rounded-full text-sm font-bold">
                      {calculateWinRateDecimal(data.won, data.played)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    {data.streak > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        🔥 {data.streak}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    {data.bestTime ? `${data.bestTime}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {topPerformers.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Top Performers (Recent)</h2>
          <div className="space-y-3">
            {topPerformers.map((player, index) => (
              <div key={player.userId} className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-text-muted">#{index + 1}</div>
                  <div>
                    <DisplayName
                      name={player.name || 'Anonymous'}
                      className="font-bold"
                    />
                    <div className="text-sm text-text-muted">Playing: {player.currentGame}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">🏆 {player.recentWins}</div>
                  <div className="text-xs text-text-muted">recent wins</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">All Registered Users ({totalPlayers})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-3 px-4 font-bold">#</th>
                <th className="text-left py-3 px-4 font-bold">Player Name</th>
                <th className="text-left py-3 px-4 font-bold">User ID</th>
                <th className="text-left py-3 px-4 font-bold">Last Seen</th>
                <th className="text-right py-3 px-4 font-bold">Activities</th>
                <th className="text-right py-3 px-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((user, index) => {
                const activityRecord = sessions.find(session => session.userId === user.userId);
                const lastSeen = activityRecord?.lastSeen || user.updatedAt;
                const totalActivities = activityRecord?.activities?.length || 0;
                const timeAgo = formatRelativeTime(lastSeen);
                const isDeleting = deletingUserId === user.userId;

                return (
                  <tr key={user.userId} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 text-text-muted">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">
                      <DisplayName name={user.name || 'Anonymous'} />
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted font-mono">{user.userId.slice(0, 20)}...</td>
                    <td className="py-3 px-4 text-text-muted">{timeAgo}</td>
                    <td className="text-right py-3 px-4">{totalActivities}</td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => onDeleteUser(user.userId, user.name)}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-wordle-absent hover:bg-red-700 text-button-text text-xs rounded transition-colors disabled:opacity-50"
                        title="Delete user account and all data"
                      >
                        {isDeleting ? '⏳' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPlayers === 0 && (
            <div className="text-center py-8 text-text-muted">
              No registered users yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Active Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-3 px-4 font-bold">Player Name</th>
                <th className="text-left py-3 px-4 font-bold">Current Activity</th>
                <th className="text-left py-3 px-4 font-bold">Last Seen</th>
                <th className="text-right py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session, index) => {
                const lastActivity = session.activities?.[session.activities.length - 1];
                const timeAgo = formatRelativeTime(session.lastSeen, true);
                const sessionKey = session.sessionId
                  ? session.sessionId
                  : `${session.userId ?? 'guest'}-${session.lastSeen ?? index}`;

                return (
                  <tr key={sessionKey} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <DisplayName name={session.name || 'Anonymous'} />
                    </td>
                    <td className="py-3 px-4">
                      {lastActivity?.game ? (
                        <span className="inline-block px-3 py-1 bg-button-primary text-button-text rounded-full text-xs">
                          Playing {lastActivity.game}
                        </span>
                      ) : lastActivity?.page ? (
                        <span className="inline-block px-3 py-1 bg-card border border-card-border text-foreground rounded-full text-xs">
                          {lastActivity.page}
                        </span>
                      ) : (
                        <span className="text-text-muted">No recent activity</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {timeAgo}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-wordle-correct rounded-full animate-pulse"></span>
                        Online
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {activeSessions.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No active players in the last 5 minutes
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, icon, color, live = false }) {
  return (
    <div className={`${color} border rounded-xl p-6 ${live ? 'relative overflow-hidden' : ''}`}>
      {live && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-wordle-correct/20 text-wordle-correct text-xs rounded-full">
            <span className="w-1.5 h-1.5 bg-wordle-correct rounded-full animate-pulse"></span>
            LIVE
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-text-muted mt-1">{label}</div>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function aggregateGameStats(players) {
  const breakdown = {};
  let totalGames = 0;
  let totalWins = 0;

  players.forEach(player => {
    const games = player.games || {};
    Object.entries(games).forEach(([gameName, stats]) => {
      if (!breakdown[gameName]) {
        breakdown[gameName] = {
          played: 0,
          won: 0,
          streak: 0,
          bestTime: null,
        };
      }

      const played = stats?.gamesPlayed || 0;
      const won = stats?.gamesWon || 0;

      breakdown[gameName].played += played;
      breakdown[gameName].won += won;
      breakdown[gameName].streak = Math.max(breakdown[gameName].streak, stats?.longestStreak || 0);

      if (typeof stats?.bestTime === 'number') {
        const currentBest = breakdown[gameName].bestTime;
        if (currentBest === null || stats.bestTime < currentBest) {
          breakdown[gameName].bestTime = stats.bestTime;
        }
      }

      totalGames += played;
      totalWins += won;
    });
  });

  return { totalGames, totalWins, gameBreakdown: breakdown };
}

function filterActiveSessions(sessions, minutes = 5) {
  const cutoff = Date.now() - minutes * 60 * 1000;
  return sessions.filter(session => new Date(session.lastSeen).getTime() >= cutoff);
}

function summarizeActivity(sessions) {
  const gamesPlaying = {};

  sessions.forEach(session => {
    const lastActivity = session.activities?.[session.activities.length - 1];
    const currentGame = lastActivity?.game || session.currentGame;
    if (currentGame) {
      gamesPlaying[currentGame] = (gamesPlaying[currentGame] || 0) + 1;
    }
  });

  return { gamesPlaying };
}

function getTopPerformers(sessions) {
  return sessions
    .map(session => {
      const wins = session.activities?.filter(event => event.type === 'game_end' && event.win).length || 0;
      const lastGame = session.activities?.findLast?.(event => event.game) || session.activities?.[session.activities.length - 1];
      return {
        userId: session.userId,
        name: session.name,
        recentWins: wins,
        currentGame: lastGame?.game || 'Idle',
      };
    })
    .sort((a, b) => b.recentWins - a.recentWins)
    .slice(0, 5);
}

function formatRelativeTime(timestamp, short = false) {
  if (!timestamp) return 'N/A';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return short ? `${days}d ago` : `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return short ? `${hours}h ago` : `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return short ? `${minutes}m ago` : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return 'Just now';
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
