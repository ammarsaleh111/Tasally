/**
 * React hook for Groups data fetching and mutations.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GroupSummary {
  id: string;
  name: string;
  ownerIdentityId: string;
  createdAt: string;
  role: string;
  memberCount: number;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviterDisplayName: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  identityId: string;
  displayName: string;
  totalPoints: number;
  totalTimeMs: number;
  gamesPlayed: number;
  wins: number;
}

export function useMyGroups(identityId?: string) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups/mine');
      const json = await res.json();
      if (json.ok) setGroups(json.data.groups);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (identityId) refetch(); }, [identityId, refetch]);

  return { groups, loading, refetch };
}

export function useMyInvites(identityId?: string) {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invites/mine');
      const json = await res.json();
      if (json.ok) setInvites(json.data.invites);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (identityId) refetch(); }, [identityId, refetch]);

  return { invites, loading, refetch };
}

export function useGroupLeaderboard(groupId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!groupId) return;
    try {
      // Don't set loading on refetch to avoid flicker during polling
      const res = await fetch(`/api/groups/${groupId}/leaderboard-total?limit=50`);
      const json = await res.json();
      if (json.ok) setLeaderboard(json.data.leaderboard);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  // 10-second auto-polling for leaderboard refresh
  useEffect(() => {
    if (!groupId) return;
    const interval = setInterval(refetch, 10_000);
    return () => clearInterval(interval);
  }, [groupId, refetch]);

  return { leaderboard, loading, refetch };
}

export async function createGroup(name: string) {
  const res = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function findPlayer(displayName: string) {
  const res = await fetch(`/api/identity/find?displayName=${encodeURIComponent(displayName)}`);
  return res.json();
}

export async function sendInvite(groupId: string, inviteeIdentityId: string) {
  const res = await fetch(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteeIdentityId }),
  });
  return res.json();
}

export async function respondToInvite(inviteId: string, action: 'accept' | 'decline') {
  const res = await fetch(`/api/invites/${inviteId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function submitGroupResult(
  groupId: string,
  data: { gameKey: string; won: boolean; moves?: number | null; timeMs: number }
) {
  const res = await fetch(`/api/groups/${groupId}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/**
 * Leave a group (for non-owners)
 */
export async function leaveGroup(groupId: string) {
  const res = await fetch(`/api/groups/${groupId}/leave`, {
    method: 'POST',
  });
  return res.json();
}

/**
 * Kick a member from a group (owner only)
 */
export async function kickMember(groupId: string, identityId: string) {
  const res = await fetch(`/api/groups/${groupId}/kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityId }),
  });
  return res.json();
}

/**
 * Delete a group (owner only)
 */
export async function deleteGroup(groupId: string) {
  const res = await fetch(`/api/groups/${groupId}`, {
    method: 'DELETE',
  });
  return res.json();
}
