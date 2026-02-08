'use client';

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { useMyInvites, respondToInvite } from '@/hooks/useGroups';
import { useIdentity } from '@/components/IdentityGate';
import { useState } from 'react';

export default function InvitesPage() {
  const { identity } = useIdentity();
  const { invites, loading, refetch } = useMyInvites();
  const [responding, setResponding] = useState(null); // inviteId being responded to

  const handleRespond = async (inviteId, action) => {
    setResponding(inviteId);
    try {
      await respondToInvite(inviteId, action);
      refetch();
    } catch {
      // ignore
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📩 Group Invites</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Accept or decline invitations to join groups
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            Loading invites...
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-12 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-medium text-[hsl(var(--foreground))] mb-1">No pending invites</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              When someone invites you to their group, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const isResponding = responding === invite.id;
              const expiresDate = new Date(invite.expiresAt);
              const daysLeft = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000));

              return (
                <div
                  key={invite.id}
                  className="
                    bg-[hsl(var(--card))] border border-[hsl(var(--border))]
                    rounded-2xl p-5
                  "
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-[hsl(var(--foreground))]">
                        {invite.groupName}
                      </h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Invited by <span className="font-medium">{invite.inviterDisplayName}</span>
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {daysLeft > 0
                          ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                          : 'Expires today'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(invite.id, 'accept')}
                        disabled={isResponding}
                        className="
                          px-5 py-2.5 rounded-xl font-semibold text-sm
                          bg-emerald-500 text-white
                          hover:bg-emerald-600 active:scale-[0.98]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                        "
                      >
                        {isResponding ? '...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => handleRespond(invite.id, 'decline')}
                        disabled={isResponding}
                        className="
                          px-5 py-2.5 rounded-xl font-semibold text-sm
                          bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                          border border-[hsl(var(--border))]
                          hover:bg-[hsl(var(--surface-hover))]
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                        "
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
