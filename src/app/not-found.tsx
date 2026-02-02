'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Global 404 Not Found Page
 * 
 * Shown when user navigates to a non-existent route.
 * Uses the theme system via CSS variables.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <main 
      className="min-h-[80vh] flex items-center justify-center p-4"
      role="main"
      aria-labelledby="error-heading"
    >
      <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
        {/* Decorative 404 illustration */}
        <div 
          className="mb-6 select-none"
          aria-hidden="true"
        >
          <div className="text-8xl font-bold" style={{ color: 'hsl(var(--accent))' }}>
            404
          </div>
          <div 
            className="text-6xl mt-2"
            role="img" 
            aria-label="Confused face"
          >
            🤔
          </div>
        </div>

        {/* Error message */}
        <h1 
          id="error-heading"
          className="text-2xl font-bold mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Page Not Found
        </h1>
        
        <p 
          className="mb-6 text-base"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Don&apos;t worry, you can still explore our games!
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.back()}
            aria-label="Go back to previous page"
          >
            ← Go Back
          </Button>
          
          <Link 
            href="/" 
            aria-label="Go to home page"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ 
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--secondary-foreground))'
            }}
          >
            🏠 Home
          </Link>
          
          <Link 
            href="/games" 
            aria-label="Browse all games"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border"
            style={{ 
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))'
            }}
          >
            🎮 Games
          </Link>
        </div>

        {/* Subtle branding */}
        <p 
          className="mt-8 text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Ammar Times — Daily Puzzles & Games
        </p>
      </Card>
    </main>
  );
}
