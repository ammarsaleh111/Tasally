'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Games Route Error Boundary
 * 
 * Catches errors in /games/* routes.
 * Provides game-specific recovery and navigation options.
 */

function generateErrorId(): string {
  return `game_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

interface GamesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GamesError({ error, reset }: GamesErrorProps) {
  const [errorId] = useState(() => generateErrorId());
  const [copied, setCopied] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[Games Error]', errorId, error);
  }, [error, errorId]);

  const copyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <main 
      className="min-h-[80vh] flex items-center justify-center p-4"
      role="main"
      aria-labelledby="error-heading"
    >
      <Card variant="elevated" padding="lg" className="max-w-lg w-full text-center">
        {/* Game-specific icon */}
        <div className="mb-6 select-none" aria-hidden="true">
          <div className="text-6xl mb-2" role="img" aria-label="Game controller">
            🎮
          </div>
          <div 
            className="text-3xl font-bold"
            style={{ color: 'hsl(var(--accent))' }}
          >
            Game Hiccup!
          </div>
        </div>

        <h1 
          id="error-heading"
          className="text-xl font-semibold mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Oops, something went wrong
        </h1>
        
        <p 
          className="mb-4 text-base"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Don&apos;t worry — your progress is automatically saved! 
          Try refreshing or pick another puzzle to play.
        </p>

        {/* Error ID */}
        <div 
          className="mb-6 p-3 rounded-lg text-sm font-mono"
          style={{ 
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            color: 'hsl(var(--muted-foreground))'
          }}
        >
          <span>Error ID: </span>
          <button
            onClick={copyErrorId}
            className="underline hover:no-underline cursor-pointer"
            title="Click to copy"
          >
            {errorId}
          </button>
          {copied && <span className="ml-2 text-green-500">Copied!</span>}
        </div>

        {/* Dev error details */}
        {isDev && error?.message && (
          <div 
            className="mb-6 p-3 rounded-lg text-left text-sm overflow-auto max-h-32"
            style={{ 
              backgroundColor: 'hsl(var(--destructive) / 0.1)',
              color: 'hsl(var(--destructive, 0 84% 60%))',
              border: '1px solid hsl(var(--destructive) / 0.3)'
            }}
          >
            <strong>Dev Error:</strong>
            <pre className="mt-1 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={reset}>
            🔄 Try Again
          </Button>
          
          <Link 
            href="/games"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ 
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--secondary-foreground))'
            }}
          >
            🎯 All Games
          </Link>
          
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border"
            style={{ 
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))'
            }}
          >
            🏠 Home
          </Link>
        </div>

        {/* Popular games quick links */}
        <div 
          className="mt-6 pt-6"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          <p 
            className="text-sm mb-3"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Or jump to a game:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link 
              href="/games/wordle"
              className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'hsl(var(--accent) / 0.1)',
                color: 'hsl(var(--accent))'
              }}
            >
              Wordle
            </Link>
            <Link 
              href="/games/connections"
              className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'hsl(var(--accent) / 0.1)',
                color: 'hsl(var(--accent))'
              }}
            >
              Connections
            </Link>
            <Link 
              href="/games/crossword"
              className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'hsl(var(--accent) / 0.1)',
                color: 'hsl(var(--accent))'
              }}
            >
              Crossword
            </Link>
            <Link 
              href="/games/trivia"
              className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'hsl(var(--accent) / 0.1)',
                color: 'hsl(var(--accent))'
              }}
            >
              Trivia
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
