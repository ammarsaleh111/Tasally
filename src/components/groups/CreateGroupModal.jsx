'use client';

import { useState } from 'react';

/**
 * Modal for creating a new group.
 */
export default function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Group name must be at least 2 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await onCreate(trimmed);
      if (!result.ok) {
        setError(result.error?.message || 'Failed to create group');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Create Group
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-1 block">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Puzzle Squad"
              maxLength={40}
              autoFocus
              className="
                w-full px-4 py-3 rounded-xl
                bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
                border border-[hsl(var(--border))]
                focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
                placeholder:text-[hsl(var(--muted-foreground))]
              "
            />
          </div>
          {error && (
            <p className="text-sm text-[hsl(var(--destructive))] font-medium">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-3 rounded-xl font-semibold
                bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                border border-[hsl(var(--border))]
                hover:bg-[hsl(var(--surface-hover))]
                transition-all duration-200
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="
                flex-1 py-3 rounded-xl font-semibold
                bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                hover:opacity-90 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
