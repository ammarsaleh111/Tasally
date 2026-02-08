'use client';

import { useState } from 'react';
import { useIdentity } from '@/components/IdentityGate';

/**
 * Rename display name form for settings page.
 * Enforces 7-day cooldown. Supports Arabic.
 */
export default function RenameDisplayNameForm() {
  const { identity, displayName, rename } = useIdentity();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate cooldown
  const lastRenamedAt = identity?.lastRenamedAt ? new Date(identity.lastRenamedAt) : null;
  const cooldownMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const canRename = !lastRenamedAt || (now - lastRenamedAt.getTime()) >= cooldownMs;
  const remainingDays = lastRenamedAt
    ? Math.ceil((cooldownMs - (now - lastRenamedAt.getTime())) / (24 * 60 * 60 * 1000))
    : 0;

  const codePointLength = [...name.trim()].length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canRename) {
      setError(`You can rename again in ${remainingDays} days`);
      return;
    }

    const trimmed = name.trim();
    if (codePointLength < 3) {
      setError('At least 3 characters required');
      return;
    }
    if (codePointLength > 20) {
      setError('Maximum 20 characters');
      return;
    }
    if (!/^[\p{L}\p{N}_\- ]+$/u.test(trimmed)) {
      setError('Only letters, numbers, spaces, underscores, and hyphens allowed');
      return;
    }
    if (/^[_\- ]|[_\- ]$/.test(trimmed)) {
      setError('Cannot start or end with space, underscore, or hyphen');
      return;
    }

    setLoading(true);
    try {
      const result = await rename(trimmed);
      if (result.success) {
        setSuccess('Display name updated!');
        setName('');
      } else {
        setError(result.error || 'Failed to rename');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // RTL detection for Arabic
  const isRTL = /[\u0600-\u06FF]/.test(name);

  return (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-2">
        Display Name
      </h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
        Current: <span className="font-semibold" dir={/[\u0600-\u06FF]/.test(displayName || '') ? 'rtl' : 'ltr'}>{displayName}</span>
      </p>

      {!canRename && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          ⏳ You can rename again in {remainingDays} day{remainingDays !== 1 ? 's' : ''}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New display name"
            maxLength={30}
            disabled={!canRename}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`
              w-full px-4 py-3 rounded-xl
              bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
              border border-[hsl(var(--border))]
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
              placeholder:text-[hsl(var(--muted-foreground))]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isRTL ? 'font-[var(--font-arabic)]' : ''}
            `}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            3–20 characters • Supports Arabic and English
          </p>
        </div>

        {error && (
          <p className="text-sm text-[hsl(var(--destructive))] font-medium">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-500 font-medium">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading || !canRename || codePointLength < 3}
          className="
            px-6 py-2.5 rounded-xl font-semibold text-sm
            bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
            hover:opacity-90 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? 'Saving...' : 'Update Name'}
        </button>
      </form>
    </div>
  );
}
