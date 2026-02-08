'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { GROUP_UNLIMITED_GAMES } from '@/lib/groups/constants';

/**
 * /groups/[id]/play/[gameKey]
 *
 * DEPRECATED: This route is kept for backwards compatibility.
 * New approach: Navigate directly to /games/:gameKey?mode=unlimited&groupId=X
 *
 * This page just redirects to the game with proper context params.
 */
export default function GroupPlayPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;
  const gameKey = params.gameKey;

  const game = GROUP_UNLIMITED_GAMES.find((g) => g.key === gameKey);

  useEffect(() => {
    if (!game) return;

    // Build game URL with context params (no sessionStorage needed)
    const searchParams = new URLSearchParams({
      mode: 'unlimited',
      groupId,
    });
    const gameUrl = `/games/${gameKey}?${searchParams.toString()}`;
    router.replace(gameUrl);
  }, [game, gameKey, groupId, router]);

  if (!game) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <SiteHeader />
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-lg font-medium">Game not available in groups</p>
          <Link href={`/groups/${groupId}`} className="text-[hsl(var(--accent))] mt-4 inline-block hover:underline">
            ← Back to Group
          </Link>
        </div>
      </div>
    );
  }

  // Valid game — show loading state while the effect redirects
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4 animate-bounce">{game.icon}</p>
        <p className="text-lg font-medium">Loading {game.label}...</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Unlimited mode • Group play</p>
      </div>
    </div>
  );
}
