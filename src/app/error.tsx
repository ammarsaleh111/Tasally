'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Global Error Boundary Page
 * 
 * Catches runtime errors in the app (except root layout).
 * Shows user-friendly message without leaking error details in production.
 */

// Generate client-side error ID for reference
function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [errorId] = useState(() => generateErrorId());
  const [copied, setCopied] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  // Log error to console (server will have full trace)
  useEffect(() => {
    console.error('[Error Boundary]', errorId, error);
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

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <main 
      className="min-h-[80vh] flex items-center justify-center p-4"
      role="main"
      aria-labelledby="error-heading"
    >
      <Card variant="elevated" padding="lg" className="max-w-lg w-full text-center">
        {/* Error illustration */}
        <div 
          className="mb-6 select-none"
          aria-hidden="true"
        >
          <div 
            className="text-6xl mb-2"
            role="img" 
            aria-label="Warning"
          >
            ⚠️
          </div>
          <div 
            className="text-4xl font-bold"
            style={{ color: 'hsl(var(--destructive, 0 84% 60%))' }}
          >
            Something went wrong
          </div>
        </div>

        {/* User-friendly message */}
        <h1 
          id="error-heading"
          className="text-xl font-semibold mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          We hit a snag!
        </h1>
        
        <p 
          className="mb-4 text-base"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Don&apos;t worry, your progress is safe. Try one of the options below to get back on track.
        </p>

        {/* Error ID (for support) */}
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

        {/* Dev-only: show error message */}
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

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={reset}
            aria-label="Try again"
          >
            🔄 Try Again
          </Button>
          
          <Button
            variant="secondary"
            size="md"
            onClick={handleReload}
            aria-label="Reload the page"
          >
            ↻ Reload Page
          </Button>
          
          <Link 
            href="/" 
            aria-label="Go to home page"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border"
            style={{ 
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))'
            }}
          >
            🏠 Home
          </Link>
        </div>

        {/* Help text */}
        <p 
          className="mt-6 text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          If this keeps happening, please share the Error ID with support.
        </p>
      </Card>
    </main>
  );
}
