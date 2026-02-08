'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import InvitePlayerModal from '@/components/groups/InvitePlayerModal';
import GroupGameCards from '@/components/groups/GroupGameCards';
import GroupLeaderboard from '@/components/groups/GroupLeaderboard';
import { useIdentity } from '@/components/IdentityGate';
import { useGroupLeaderboard, leaveGroup, kickMember, deleteGroup } from '@/hooks/useGroups';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;
  const { identity } = useIdentity();
  const { leaderboard, loading: lbLoading, refetch: refetchLb } = useGroupLeaderboard(groupId);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'leaderboard' | 'members'
  
  // Management state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kickingId, setKickingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`);
      const json = await res.json();
      if (json.ok) {
        setGroup(json.data.group);
        setMembers(json.data.members);
        setIsMember(json.data.isMember);
        setMyRole(json.data.myRole);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Action handlers
  const handleLeave = async () => {
    setActionLoading(true);
    try {
      const result = await leaveGroup(groupId);
      if (result.ok) {
        router.push('/groups');
      } else {
        alert(result.error?.message || 'Failed to leave group');
      }
    } finally {
      setActionLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const result = await deleteGroup(groupId);
      if (result.ok) {
        router.push('/groups');
      } else {
        alert(result.error?.message || 'Failed to delete group');
      }
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleKick = async (targetId) => {
    setActionLoading(true);
    try {
      const result = await kickMember(groupId, targetId);
      if (result.ok) {
        fetchGroup(); // Refresh members list
      } else {
        alert(result.error?.message || 'Failed to kick member');
      }
    } finally {
      setActionLoading(false);
      setKickingId(null);
    }
  };

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <SiteHeader />
        <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">Loading group...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <SiteHeader />
        <div className="text-center py-20">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-lg font-medium">Group not found</p>
          <Link href="/groups" className="text-[hsl(var(--accent))] mt-4 inline-block hover:underline">
            ← Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />

      {showInvite && (
        <InvitePlayerModal
          groupId={groupId}
          onClose={() => setShowInvite(false)}
          onInvited={fetchGroup}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Group Header */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))]">
                {group.name}
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                {' · '}
                Created {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
            {isMember && myRole === 'owner' && (
              <button
                onClick={() => setShowInvite(true)}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5
                  bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                  rounded-xl font-semibold text-sm
                  hover:opacity-90 active:scale-[0.98]
                  transition-all duration-200 self-start
                "
              >
                ➕ Invite Member
              </button>
            )}
          </div>
          
          {/* Management Actions */}
          {isMember && (
            <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex flex-wrap gap-2">
              {myRole === 'owner' ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="
                    px-4 py-2 text-sm font-medium
                    bg-red-500/10 text-red-500 border border-red-500/30
                    rounded-lg hover:bg-red-500/20 transition-colors
                  "
                >
                  🗑️ Delete Group
                </button>
              ) : (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="
                    px-4 py-2 text-sm font-medium
                    bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))]
                    border border-[hsl(var(--border))]
                    rounded-lg hover:bg-[hsl(var(--muted))] transition-colors
                  "
                >
                  🚪 Leave Group
                </button>
              )}
            </div>
          )}
        </div>

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2">Leave Group?</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                You will lose your leaderboard progress in this group.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-[hsl(var(--muted))] rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Leaving...' : 'Leave'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2 text-red-500">⚠️ Delete Group?</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                This will permanently delete &quot;{group.name}&quot; and all member data. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-[hsl(var(--muted))] rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1">
          {[
            { key: 'games', label: '🎮 Games', show: isMember },
            { key: 'leaderboard', label: '🏆 Leaderboard', show: true },
            { key: 'members', label: '👥 Members', show: true },
          ].filter(t => t.show).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold
                transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'games' && isMember && (
          <section>
            <h2 className="text-lg font-bold mb-4">Unlimited Games</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Play any game below — your score will count towards the group leaderboard!
            </p>
            <GroupGameCards groupId={groupId} groupName={group?.name} />
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Total Leaderboard</h2>
                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                  Auto-refresh 10s
                </span>
              </div>
              <button
                onClick={refetchLb}
                className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                ↻ Refresh
              </button>
            </div>
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4">
              <GroupLeaderboard
                leaderboard={leaderboard}
                loading={lbLoading}
                currentIdentityId={identity?.id}
              />
            </div>
          </section>
        )}

        {activeTab === 'members' && (
          <section>
            <h2 className="text-lg font-bold mb-4">Members ({members.length})</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.identityId}
                  className="
                    flex items-center justify-between
                    bg-[hsl(var(--card))] border border-[hsl(var(--border))]
                    rounded-xl p-4
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center text-sm">
                      {member.role === 'owner' ? '👑' : '👤'}
                    </div>
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {member.displayName}
                        {member.identityId === identity?.id && (
                          <span className="text-xs ml-1 text-[hsl(var(--muted-foreground))]">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                    {/* Kick button - owner only, not for self */}
                    {myRole === 'owner' && member.identityId !== identity?.id && (
                      kickingId === member.identityId ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setKickingId(null)}
                            className="px-2 py-1 text-xs bg-[hsl(var(--muted))] rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleKick(member.identityId)}
                            disabled={actionLoading}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded disabled:opacity-50"
                          >
                            {actionLoading ? '...' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setKickingId(member.identityId)}
                          className="
                            px-2 py-1 text-xs
                            text-red-500 bg-red-500/10 border border-red-500/30
                            rounded hover:bg-red-500/20 transition-colors
                          "
                          title="Remove from group"
                        >
                          Kick
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="text-center mt-12">
          <Link
            href="/groups"
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors inline-flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Groups
          </Link>
        </div>
      </main>
    </div>
  );
}
