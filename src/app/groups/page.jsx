'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import { useIdentity } from '@/components/IdentityGate';
import { useMyGroups, useMyInvites, createGroup } from '@/hooks/useGroups';

export default function GroupsPage() {
  const { identity } = useIdentity();
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useMyGroups();
  const { invites, loading: invitesLoading } = useMyInvites();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = async (name) => {
    const result = await createGroup(name);
    if (result.ok) {
      setShowCreateModal(false);
      refetchGroups();
    }
    return result;
  };

  const pendingInviteCount = invites.length;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">👥 Groups</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Compete with friends in unlimited puzzle games
          </p>
          {identity && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Playing as <span className="font-semibold text-[hsl(var(--accent))]">{identity.displayName}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!identity}
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
              rounded-xl font-semibold text-sm
              hover:opacity-90 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            ➕ Create Group
          </button>
          <Link
            href="/groups/invites"
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
              border border-[hsl(var(--border))]
              rounded-xl font-semibold text-sm
              hover:bg-[hsl(var(--surface-hover))]
              transition-all duration-200 relative
            "
          >
            📩 Invites
            {pendingInviteCount > 0 && (
              <span className="
                absolute -top-2 -right-2
                bg-[hsl(var(--destructive))] text-white
                text-xs font-bold
                w-5 h-5 rounded-full
                flex items-center justify-center
              ">
                {pendingInviteCount}
              </span>
            )}
          </Link>
        </div>

        {/* My Groups List */}
        <section>
          <h2 className="text-xl font-bold mb-4">My Groups</h2>

          {groupsLoading ? (
            <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl">
              <p className="text-4xl mb-3">🎮</p>
              <p className="text-lg font-medium text-[hsl(var(--foreground))] mb-1">No groups yet</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Create a group or accept an invite to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="
                    group
                    bg-[hsl(var(--card))] border border-[hsl(var(--border))]
                    rounded-2xl p-5
                    hover:shadow-lg hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--accent))] transition-colors">
                      {group.name}
                    </h3>
                    <span className="
                      text-xs font-medium px-2 py-1 rounded-full
                      bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]
                    ">
                      {group.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1">
                      👥 {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </span>
                    <span>
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-[hsl(var(--accent))] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    View group
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link
            href="/games"
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors inline-flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Games
          </Link>
        </div>
      </main>
    </div>
  );
}
