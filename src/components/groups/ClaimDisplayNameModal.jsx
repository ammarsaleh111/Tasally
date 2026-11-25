'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Modal for claiming a display name (first-time identity).
 * Supports Arabic + English + Unicode names.
 */
export default function ClaimDisplayNameModal({ onClaim, error: externalError }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const error = localError || externalError;

  // Count code points for Unicode-safe length check
  const codePointLength = [...name.trim()].length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = name.trim();
    
    if (codePointLength < 3) {
      setLocalError('At least 3 characters required');
      return;
    }
    if (codePointLength > 20) {
      setLocalError('Maximum 20 characters');
      return;
    }
    
    // Unicode-safe character validation
    if (!/^[\p{L}\p{N}_\- ]+$/u.test(trimmed)) {
      setLocalError('Only letters, numbers, spaces, underscores, and hyphens allowed');
      return;
    }
    if (/^[_\- ]|[_\- ]$/.test(trimmed)) {
      setLocalError('Cannot start or end with space, underscore, or hyphen');
      return;
    }
    
    setLocalError('');
    setLoading(true);
    try {
      await onClaim(trimmed);
    } catch {
      setLocalError('Could not claim your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Detect RTL for Arabic input
  const isRTL = /[\u0600-\u06FF]/.test(name);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="claim-name-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-card-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <h2 id="claim-name-title" className="text-xl font-bold mb-2">
        Choose Your Display Name
      </h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
        This unique name is how other players will find and invite you. Supports Arabic and English.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            aria-label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: أحمد علي"
            maxLength={30}
            autoFocus
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`
              w-full px-4 py-3 rounded-xl
              bg-[hsl(var(--input))] text-[hsl(var(--foreground))]
              border border-[hsl(var(--border))]
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
              placeholder:text-[hsl(var(--muted-foreground))]
              text-lg ${isRTL ? 'font-[var(--font-arabic)]' : 'font-mono'}
            `}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            3–20 characters • Letters, numbers, spaces, underscores, hyphens
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive font-medium">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-xl font-semibold text-base
            bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
            hover:opacity-90 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? 'Claiming...' : 'Claim Name'}
        </button>
      </form>
    </dialog>
  );
}
