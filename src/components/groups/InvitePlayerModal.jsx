'use client';

import { useState } from 'react';
import { findPlayer, sendInvite } from '@/hooks/useGroups';

/**
 * Modal for inviting a player to a group.
 * User types exact display name → find → confirm → invite.
 */
export default function InvitePlayerModal({ groupId, onClose, onInvited }) {
  const [searchName, setSearchName] = useState('');
  const [foundPlayer, setFoundPlayer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchName.trim();
    if (!trimmed) return;

    setError('');
    setFoundPlayer(null);
    setSuccess('');
    setSearching(true);
    try {
      const result = await findPlayer(trimmed);
      if (result.ok) {
        setFoundPlayer(result.data);
      } else {
        setError(result.error?.code === 'NOT_FOUND'
          ? 'Player not found. Make sure you typed the exact display name.'
          : result.error?.message || 'Search failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!foundPlayer) return;
    setSending(true);
    setError('');
    try {
      const result = await sendInvite(groupId, foundPlayer.identityId);
      if (result.ok) {
        setSuccess(`Invite sent to ${foundPlayer.displayName}!`);
        setFoundPlayer(null);
        setSearchName('');
        onInvited?.();
      } else {
        setError(result.error?.message || 'Failed to send invite');
      }
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Invite Player
          </h2>
          <button
            onClick={onClose}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          Type the exact display name of the player you want to invite.
        </p>

        <form onSubmit={handleSearch} className="space-y-3 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Exact display name..."
              autoFocus
              className="
                flex-1 px-4 py-3 rounded-xl
                bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
                border border-[hsl(var(--border))]
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
                placeholder:text-[hsl(var(--muted-foreground))]
                font-mono
              "
            />
            <button
              type="submit"
              disabled={searching || !searchName.trim()}
              className="
                px-5 py-3 rounded-xl font-semibold
                bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--surface-hover))]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {searching ? '...' : 'Find'}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-sm text-[hsl(var(--destructive))] font-medium mb-3">{error}</p>
        )}

        {success && (
          <p className="text-sm text-emerald-500 font-medium mb-3">✓ {success}</p>
        )}

        {foundPlayer && (
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">
                    {foundPlayer.displayName}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Player found
                  </p>
                </div>
              </div>
              <button
                onClick={handleInvite}
                disabled={sending}
                className="
                  px-4 py-2 rounded-lg font-semibold text-sm
                  bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                  hover:opacity-90 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {sending ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="
            w-full py-2.5 rounded-xl font-medium text-sm
            text-[hsl(var(--muted-foreground))]
            hover:text-[hsl(var(--foreground))]
            transition-colors
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}
