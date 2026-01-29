'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import DisplayName from '@/components/DisplayName';
import { calculateWinRateDecimal } from '@/utils/statsCalculator';
import { logout, useAppSession } from '@/utils/sessionManager';

const POLL_INTERVAL_MS = 15000;

export default function AdminDashboardClient() {
  const router = useRouter();
  const session = useAppSession();
  const [metricsPayload, setMetricsPayload] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('polling');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/metrics', { cache: 'no-store' });
      if (response.status === 401 || response.status === 403) {
        router.replace('/admin/login');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load admin metrics');
      }

      const data = await response.json();
      setMetricsPayload(data);
      setLastUpdated(new Date());
      setRefreshCount((count) => count + 1);
      setConnectionStatus('polling');
    } catch (error) {
      console.error('Failed to load admin metrics', error);
      setConnectionStatus('disconnected');
    }
  }, [router]);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  useEffect(() => {
    if (!session) return;
    if (session.role !== 'ADMIN') {
      router.replace('/login?next=/admin');
    }
  }, [session?.role, router]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/admin/login');
    } catch (error) {
      console.error('Failed to log out admin', error);
      setIsLoggingOut(false);
    }
  };

  const handleDeleteUser = (player) => {
    setDeleteConfirm({
      id: player.id,
      displayName: player.displayName,
      type: player.type,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingUserId(deleteConfirm.id);
      const query = deleteConfirm.type === 'GUEST'
        ? `guestId=${encodeURIComponent(deleteConfirm.id)}`
        : `userId=${encodeURIComponent(deleteConfirm.id)}`;

      const response = await fetch(`/api/admin/users?${query}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await loadMetrics();
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

  const derived = useMemo(() => {
    if (!metricsPayload) return null;

    const { metrics, totals, gamePerformance, topPerformers, players } = metricsPayload;

    const overallWinRate = calculateWinRateDecimal(totals.totalWins, totals.totalGames);

    return {
      metrics,
      totals,
      gamePerformance,
      topPerformers,
      players,
      overallWinRate,
    };
  }, [metricsPayload]);

  if (!derived || !lastUpdated) {
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border-2 border-wordle-absent rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-wordle-absent">⚠️ Delete Player</h2>
            <p className="text-foreground mb-2">
              Are you sure you want to permanently delete this player?
            </p>
            <div className="bg-surface-hover rounded-lg p-4 mb-6">
              <DisplayName
                name={deleteConfirm.displayName || 'Anonymous'}
                className="font-bold text-foreground"
              />
              <p className="text-xs text-text-muted font-mono mt-1">{deleteConfirm.id}</p>
              <p className="text-xs text-text-muted mt-1">{deleteConfirm.type}</p>
            </div>
            <p className="text-sm text-wordle-absent mb-6">
              This will permanently delete:
              <br />• Player profile
              <br />• Game results and activity
              <br />• Presence/session data
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
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                  connectionStatus === 'polling'
                    ? 'bg-wordle-present text-button-text'
                    : connectionStatus === 'disconnected'
                    ? 'bg-wordle-absent text-button-text'
                    : 'bg-wordle-correct text-button-text'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'polling' ? 'bg-white/70' : 'bg-white'
                  }`}
                ></span>
                {connectionStatus === 'polling' ? 'Polling (15s)' : connectionStatus === 'disconnected' ? 'Offline' : 'Live'}
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
              {isLoggingOut ? 'Logging out...' : 'Log out'}
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
          metrics: derived.metrics,
          totals: derived.totals,
          overallWinRate: derived.overallWinRate,
          gamePerformance: derived.gamePerformance,
          topPerformers: derived.topPerformers,
          players: derived.players,
          onDeleteUser: handleDeleteUser,
          deletingUserId,
        })}
      </div>
    </div>
  );
}

function renderContent({
  metrics,
  totals,
  overallWinRate,
  gamePerformance,
  topPerformers,
  players,
  onDeleteUser,
  deletingUserId,
}) {
  const liveActivePlayers = metrics?.activePlayers ?? 0;
  const liveActiveGames = metrics?.activeGames ?? 0;
  const liveGameDistribution = metrics?.gameDistribution ?? {};
  const liveGames = metrics?.liveGames ?? [];
  const activeSessions = metrics?.activeSessions ?? [];

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
          value={totals.totalPlayers}
          icon="📊"
          color="bg-card border-card-border"
        />
      </div>

      {liveGames.length > 0 && (
        <div className="bg-card border-2 border-wordle-correct rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-wordle-correct rounded-full animate-pulse"></span>
            Games In Progress (Real-Time)
          </h2>
          <div className="space-y-3">
            {liveGames.map((game, index) => (
              <div key={`${game.game}-${index}`} className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {game.game === 'wordle' ? '📝' : 
                     game.game === 'connections' ? '🔗' :
                     game.game === 'crossword' ? '✏️' :
                     game.game === 'trivia' ? '❓' :
                     game.game === 'numbers' ? '🔢' : '🎮'}
                  </div>
                  <div>
                    <DisplayName name={game.player} className="font-bold" />
                    <div className="text-sm text-text-muted capitalize">Playing {game.game}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">In progress</div>
                  <div className="text-xs text-text-muted">
                    {formatTimeAgo(game.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(liveGameDistribution).length > 0 && (
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
              {gamePerformance.map((data) => (
                <tr key={data.gameKey} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 font-medium capitalize">{data.gameKey}</td>
                  <td className="text-right py-3 px-4">{data.played}</td>
                  <td className="text-right py-3 px-4">{data.won}</td>
                  <td className="text-right py-3 px-4">
                    <span className="inline-block px-3 py-1 bg-wordle-correct text-button-text rounded-full text-sm font-bold">
                      {calculateWinRateDecimal(data.won, data.played)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    {data.bestStreak ? (
                      <span className="inline-flex items-center gap-1">🔥 {data.bestStreak}</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    {data.bestTimeMs !== null && data.bestTimeMs !== undefined
                      ? `${Math.round(data.bestTimeMs / 1000)}s`
                      : '-'}
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
              <div key={player.id} className="flex items-center justify-between p-4 bg-surface-hover rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-text-muted">#{index + 1}</div>
                  <div>
                    <DisplayName name={player.displayName || 'Anonymous'} className="font-bold" />
                    <div className="text-sm text-text-muted">
                      {player.state === 'PLAYING' && player.currentGame
                        ? `Playing: ${player.currentGame}`
                        : 'Idle'}
                    </div>
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
        <h2 className="text-2xl font-bold mb-4">
          All Players ({totals.totalPlayers})
          <span className="text-sm text-text-muted font-normal ml-2">
            {totals.totalRegistered} registered · {totals.totalGuests} guests
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-3 px-4 font-bold">#</th>
                <th className="text-left py-3 px-4 font-bold">Player Name</th>
                <th className="text-left py-3 px-4 font-bold">Player ID</th>
                <th className="text-left py-3 px-4 font-bold">Type</th>
                <th className="text-left py-3 px-4 font-bold">Last Seen</th>
                <th className="text-right py-3 px-4 font-bold">Played</th>
                <th className="text-right py-3 px-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => {
                const timeAgo = formatRelativeTime(player.lastSeenAt);
                const isDeleting = deletingUserId === player.id;

                return (
                  <tr key={player.id} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 text-text-muted">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">
                      <DisplayName name={player.displayName || 'Anonymous'} />
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted font-mono">{player.id.slice(0, 20)}...</td>
                    <td className="py-3 px-4 text-text-muted">{player.type}</td>
                    <td className="py-3 px-4 text-text-muted">{timeAgo}</td>
                    <td className="text-right py-3 px-4">{player.totalPlays}</td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => onDeleteUser(player)}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-wordle-absent hover:bg-red-700 text-button-text text-xs rounded transition-colors disabled:opacity-50"
                        title="Delete player account and data"
                      >
                        {isDeleting ? '⏳' : '🗑️ Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {players.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No players yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Active Players</h2>
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
                const timeAgo = formatRelativeTime(session.lastSeenAt, true);
                const sessionKey = session.id || `${session.displayName}-${index}`;

                return (
                  <tr key={sessionKey} className="border-b border-border-default hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <DisplayName name={session.displayName || 'Anonymous'} />
                    </td>
                    <td className="py-3 px-4">
                      {session.state === 'PLAYING' && session.currentGame ? (
                        <span className="inline-block px-3 py-1 bg-button-primary text-button-text rounded-full text-xs">
                          Playing {session.currentGame}
                        </span>
                      ) : session.currentPage ? (
                        <span className="inline-block px-3 py-1 bg-card border border-card-border text-foreground rounded-full text-xs">
                          {session.currentPage}
                        </span>
                      ) : (
                        <span className="text-text-muted">Idle</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted">{timeAgo}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-wordle-correct rounded-full animate-pulse"></span>
                        {session.state === 'PLAYING' ? 'Playing' : 'Online'}
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
