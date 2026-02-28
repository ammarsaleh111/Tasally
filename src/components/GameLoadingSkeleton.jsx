'use client';

/**
 * Lightweight loading skeleton shown instantly during page transitions.
 * Used by loading.jsx files in each route segment.
 */
export default function GameLoadingSkeleton({ title = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Pulsing game icon */}
      <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse mb-6" />

      {/* Title placeholder */}
      <div className="text-lg font-semibold text-muted-foreground animate-pulse mb-8">
        {title}
      </div>

      {/* Simple spinner */}
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full border-2 border-muted"
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
      </div>
    </div>
  );
}

export function GamesHubSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="h-10 w-48 bg-muted rounded-lg animate-pulse mb-2" />
      <div className="h-5 w-72 bg-muted/60 rounded-lg animate-pulse mb-8" />

      {/* Game cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 h-40 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="h-6 w-24 bg-muted rounded mb-3" />
            <div className="h-4 w-full bg-muted/50 rounded mb-2" />
            <div className="h-4 w-3/4 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="h-8 w-40 bg-muted rounded-lg animate-pulse mb-6" />

      {/* Content blocks */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-5 w-1/3 bg-muted rounded mb-3" />
            <div className="h-4 w-full bg-muted/50 rounded mb-2" />
            <div className="h-4 w-2/3 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
