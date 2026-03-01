'use client';

/**
 * Global Error Boundary (Root Level)
 * 
 * This catches errors in the ROOT LAYOUT itself.
 * It must render its own <html> and <body> tags.
 * 
 * Note: This is a fallback for catastrophic failures.
 * It cannot use theme providers since they may have failed.
 */

import { useEffect, useState } from 'react';

// Generate client-side error ID
function generateErrorId(): string {
  return `fatal_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [errorId] = useState(() => generateErrorId());
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[Global Error]', errorId, error);
  }, [error, errorId]);

  const handleReload = () => {
    window.location.href = '/';
  };

  // Inline styles since theme providers may have failed
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: '#0a0a0a',
      color: '#fafafa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
      maxWidth: '28rem',
      width: '100%',
      padding: '2rem',
      borderRadius: '1rem',
      backgroundColor: '#171717',
      border: '1px solid #262626',
      textAlign: 'center' as const,
    },
    emoji: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#ef4444',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#fafafa',
      marginBottom: '0.5rem',
    },
    description: {
      color: '#a3a3a3',
      marginBottom: '1.5rem',
      lineHeight: 1.6,
    },
    errorBox: {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      backgroundColor: '#1f1f1f',
      color: '#a3a3a3',
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      marginBottom: '1.5rem',
    },
    devError: {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444',
      fontSize: '0.75rem',
      textAlign: 'left' as const,
      overflow: 'auto',
      maxHeight: '8rem',
      marginBottom: '1.5rem',
    },
    buttonGroup: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const,
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      fontWeight: 600,
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
    },
    secondaryButton: {
      backgroundColor: '#262626',
      color: '#fafafa',
      border: '1px solid #404040',
    },
    footer: {
      marginTop: '1.5rem',
      fontSize: '0.75rem',
      color: '#737373',
    },
  };

  return (
    <html lang="en">
      <head>
        <title>Something Went Wrong — Tasally</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </head>
      <body style={styles.container}>
        <main style={styles.card} role="main" aria-labelledby="error-heading">
          <div style={styles.emoji} role="img" aria-label="Broken heart">
            💔
          </div>
          
          <div style={styles.title}>
            Critical Error
          </div>
          
          <h1 id="error-heading" style={styles.subtitle}>
            Something went very wrong
          </h1>
          
          <p style={styles.description}>
            We encountered a serious problem and couldn&apos;t recover automatically.
            Your game progress should still be saved.
          </p>

          <div style={styles.errorBox}>
            Error ID: {errorId}
          </div>

          {isDev && error?.message && (
            <div style={styles.devError}>
              <strong>Dev Error:</strong>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {error.message}
              </pre>
              {error.digest && (
                <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>
                  Digest: {error.digest}
                </div>
              )}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={reset}
              aria-label="Try to recover"
            >
              🔄 Try Again
            </button>
            
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleReload}
              aria-label="Go to home page"
            >
              🏠 Start Fresh
            </button>
          </div>

          <p style={styles.footer}>
            Tasally — Daily Puzzle & Brain Games
          </p>
        </main>
      </body>
    </html>
  );
}
