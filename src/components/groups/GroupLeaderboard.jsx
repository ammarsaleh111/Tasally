'use client';

/**
 * Group Total Leaderboard table component.
 */
export default function GroupLeaderboard({ leaderboard, loading, currentIdentityId }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        Loading leaderboard...
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        <p className="text-lg mb-1">🏆</p>
        <p>No games played yet. Be the first!</p>
      </div>
    );
  }

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[hsl(var(--border))]">
            <th className="text-left py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))]">Rank</th>
            <th className="text-left py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))]">Player</th>
            <th className="text-right py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))]">Points</th>
            <th className="text-right py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Games</th>
            <th className="text-right py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))] hidden sm:table-cell">Wins</th>
            <th className="text-right py-3 px-2 font-semibold text-[hsl(var(--muted-foreground))] hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => {
            const isMe = entry.identityId === currentIdentityId;
            return (
              <tr
                key={entry.identityId}
                className={`
                  border-b border-[hsl(var(--border))]/50
                  ${isMe ? 'bg-[hsl(var(--accent))]/10' : 'hover:bg-[hsl(var(--surface-hover))]/50'}
                  transition-colors
                `}
              >
                <td className="py-3 px-2 font-semibold">
                  <span className={entry.rank <= 3 ? 'text-lg' : 'text-[hsl(var(--muted-foreground))]'}>
                    {getRankBadge(entry.rank)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`font-medium ${isMe ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--foreground))]'}`}>
                    {entry.displayName}
                    {isMe && <span className="text-xs ml-1 opacity-60">(you)</span>}
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-bold text-[hsl(var(--foreground))]">
                  {entry.totalPoints.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
                  {entry.gamesPlayed}
                </td>
                <td className="py-3 px-2 text-right text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
                  {entry.wins}
                </td>
                <td className="py-3 px-2 text-right text-[hsl(var(--muted-foreground))] hidden md:table-cell">
                  {formatTime(entry.totalTimeMs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
