'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllStats } from '@/utils/profileManager';
import { getActiveTheme } from '@/utils/themeEngine';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import SiteHeader from '@/components/SiteHeader';
import { 
  useSeasonIdentity, 
  SeasonPageHeader, 
  SeasonCard,
  SeasonTexturedCard,
  SeasonDivider,
  SeasonIcon,
  SeasonOrnament
} from '@/components/SeasonIdentity';

export default function GamesPage() {
  const [stats, setStats] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);

  useEffect(() => {
    queueMicrotask(() => {
      setStats(getAllStats());
      setActiveTheme(getActiveTheme());
    });
  }, []);

  const games = [
    {
      id: 'wordle',
      name: 'Wordle',
      description: 'Guess the word in 6 tries',
      icon: '📝',
      href: '/games/wordle',
      color: 'hsl(142 43% 54%)', // Green
    },
    {
      id: 'connections',
      name: 'Connections',
      description: 'Group words by common themes',
      icon: '🔗',
      href: '/games/connections',
      color: 'hsl(290 35% 60%)', // Purple
    },
    {
      id: 'crossword',
      name: 'Mini Crossword',
      description: 'Solve the daily 5×5 crossword',
      icon: '🔤',
      href: '/games/crossword',
      color: 'hsl(217 91% 60%)', // Blue
    },
    {
      id: 'waffle',
      name: 'Waffle',
      description: 'Swap letters to solve the grid',
      icon: '🧇',
      href: '/games/waffle',
      color: 'hsl(38 92% 50%)', // Orange
    },
    {
      id: 'combinations',
      name: 'Combinations',
      description: 'Combine fragments to build words',
      icon: '🧩',
      href: '/games/combinations',
      color: 'hsl(262 83% 58%)', // Violet
    },
    {
      id: 'numbers',
      name: 'Numbers',
      description: 'Use 6 numbers to reach the target',
      icon: '🔢',
      href: '/games/numbers',
      color: 'hsl(0 72% 51%)', // Red
    },
    {
      id: 'trivia',
      name: 'Trivia',
      description: 'Test your knowledge with 10 questions',
      icon: '🧠',
      href: '/games/trivia',
      color: 'hsl(45 93% 47%)', // Yellow
    },
    {
      id: 'strands',
      name: 'Strands',
      description: 'Find themed words & the spangram',
      icon: '🧵',
      href: '/games/strands',
      color: 'hsl(217 80% 55%)', // Blue
    },
    {
      id: 'spelling',
      name: 'Spelling Bee',
      description: 'Create words using honeycomb letters',
      icon: '🐝',
      href: '/games/spelling',
      color: 'hsl(48 96% 53%)', // Honey
    }
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <SiteHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Seasonal Page Header */}
        <div className="text-center mb-10">
          <SeasonPageHeader 
            title="Games Hub"
            subtitle="Daily puzzles to challenge your mind"
            showBadge={true}
          />
          
          {/* Legacy Theme Badge (for event-specific) */}
          {activeTheme && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-4"
              style={{ 
                backgroundColor: activeTheme.banner?.backgroundColor + '20',
                color: activeTheme.banner?.backgroundColor 
              }}
            >
              <span>{activeTheme.emoji}</span>
              <span>{activeTheme.name} Event Active!</span>
            </div>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              href="/profile"
              className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                rounded-xl font-semibold text-sm
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-200
              "
            >
              👤 View Profile & Badges
            </Link>
            <Link
              href="/groups"
              className="
                inline-flex items-center gap-2 px-5 py-2.5
                bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
                border border-[hsl(var(--border))]
                rounded-xl font-semibold text-sm
                hover:bg-[hsl(var(--surface-hover))]
                transition-all duration-200
              "
            >
              👥 Groups
            </Link>
          </div>
        </div>

        {/* Seasonal Divider */}
        <SeasonDivider variant="icons" className="mb-8" />

        {/* Games Grid with Seasonal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {games.map((game, index) => {
            const gameStats = stats?.[game.id];
            const streak = gameStats?.currentStreak || 0;
            const hasStreak = streak > 0;
            const gameTheme = activeTheme?.games?.[game.id];
            
            return (
              <SeasonGameCard
                key={game.id}
                game={game}
                gameTheme={gameTheme}
                activeTheme={activeTheme}
                hasStreak={hasStreak}
                streak={streak}
                index={index}
                offlineReady={true}
              />
            );
          })}
        </div>

        {/* Seasonal Divider before footer */}
        <SeasonDivider variant="gradient" className="mt-12 mb-6" />

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/"
            className="
              text-[hsl(var(--muted-foreground))] 
              hover:text-[hsl(var(--foreground))] 
              transition-colors inline-flex items-center gap-2
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <SeasonIcon index={0} />
            Back to Home
            <SeasonIcon index={1} />
          </Link>
        </div>
      </main>
    </div>
  );
}

// Season-aware Game Card Component
function SeasonGameCard({ game, gameTheme, activeTheme, hasStreak, streak, index, offlineReady }) {
  const { pack } = useSeasonIdentity();
  const { isOnline } = useNetworkStatus();
  
  return (
    <Link href={game.href} prefetch={false}>
      <SeasonTexturedCard className="group p-5 md:p-6 h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        {/* Season ornament on every 3rd card */}
        {pack && index % 3 === 0 && (
          <div className="absolute top-2 left-2 text-lg opacity-40">{pack.microIcons[0]}</div>
        )}
        
        {/* Theme indicator */}
        {gameTheme && (
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: activeTheme?.banner?.backgroundColor + '30',
              color: activeTheme?.banner?.backgroundColor 
            }}
          >
            {activeTheme?.emoji} Themed
          </div>
        )}
        
        {/* Icon */}
        <div className="text-center mb-4">
          <span 
            className="
              text-5xl md:text-6xl inline-block 
              group-hover:scale-110 
              transition-transform duration-300
            "
          >
            {game.icon}
          </span>
        </div>
        
        {/* Title & Streak */}
        <div className="text-center mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-[hsl(var(--foreground))] mb-1 flex items-center justify-center gap-2">
            {pack && <span className="text-sm opacity-50">{pack.microIcons[1]}</span>}
            {game.name}
            {pack && <span className="text-sm opacity-50">{pack.microIcons[2]}</span>}
          </h2>
          {hasStreak && (
            <span 
              className="
                inline-flex items-center gap-1 
                text-xs font-semibold
                px-2.5 py-1 rounded-full
                bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]
              "
            >
              🔥 {streak} day streak
            </span>
          )}
          {offlineReady && !isOnline && (
            <span 
              className="
                inline-flex items-center gap-1 
                text-xs font-medium
                px-2 py-0.5 rounded-full
                bg-emerald-500/15 text-emerald-600
                dark:text-emerald-400
              "
            >
              ✓ Offline ready
            </span>
          )}
        </div>
        
        {/* Description */}
        <p className="text-[hsl(var(--muted-foreground))] text-center text-sm mb-4 flex-1">
          {game.description}
        </p>
        
        {/* Play Button */}
        <div className="text-center">
          <span 
            className="
              inline-flex items-center gap-2 
              text-[hsl(var(--accent))] font-semibold
              group-hover:gap-3 
              transition-all duration-200
            "
            style={{ color: game.color }}
          >
            Play Now
            <svg 
              width="18" height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="group-hover:translate-x-1 transition-transform"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
        
        {/* Season decoration in bottom corner */}
        {pack && (
          <div className="absolute bottom-2 right-2 text-sm opacity-30">{pack.emoji}</div>
        )}
      </SeasonTexturedCard>
    </Link>
  );
}
