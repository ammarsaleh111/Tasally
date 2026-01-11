'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllStats } from '@/utils/profileManager';

export default function GamesPage() {
  const [stats, setStats] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setStats(getAllStats());
  }, []);

  const games = [
    {
      id: 'wordle',
      name: 'Wordle',
      description: 'Guess the word in 6 tries',
      icon: '📝',
      href: '/games/wordle'
    },
    {
      id: 'connections',
      name: 'Connections',
      description: 'Group words that share a connection',
      icon: '🔗',
      href: '/games/connections'
    },
    {
      id: 'crossword',
      name: 'Mini Crossword',
      description: 'Solve the daily 5×5 crossword puzzle',
      icon: '🔤',
      href: '/games/crossword'
    },
    {
      id: 'numbers',
      name: 'Numbers',
      description: 'Use 6 numbers to reach the target',
      icon: '🔢',
      href: '/games/numbers'
    },
    {
      id: 'trivia',
      name: 'Trivia',
      description: 'Test your knowledge with 10 daily questions',
      icon: '🧠',
      href: '/games/trivia'
    },
    {
      id: 'strands',
      name: 'Strands',
      description: 'Find themed words & the spangram',
      icon: '🧵',
      href: '/games/strands'
    },
    {
      id: 'spelling',
      name: 'Spelling Bee',
      description: 'Create words using the honeycomb letters',
      icon: '🐝',
      href: '/games/spelling'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-8 animate-fade-in-up">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Ammar Times Games
          </h1>
          <p className="text-xl text-text-muted mb-6">
            Daily puzzles to challenge your mind
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            👤 View Your Profile & Achievements
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const gameStats = stats?.[game.id];
            const streak = gameStats?.currentStreak || 0;
            const showStreak = isClient && streak > 0;
            
            return (
              <Link
                key={game.id}
                href={game.href}
                className="group relative bg-card border-2 border-card-border rounded-2xl p-6 hover:bg-surface-hover hover:border-border-active transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col"
              >
                {/* Icon */}
                <div className="text-center mb-4">
                  <span className="text-6xl inline-block group-hover:scale-110 transition-transform duration-300">{game.icon}</span>
                </div>
                
                {/* Title & Streak */}
                <div className="text-center mb-3">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {game.name}
                  </h2>
                  {showStreak && (
                    <div className="inline-flex items-center gap-1 text-orange-500 font-bold text-sm px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                      🔥 {streak} day streak
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-text-muted text-center text-base mb-4 flex-1">
                  {game.description}
                </p>
                
                {/* Play Button */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-wordle-correct font-semibold text-lg group-hover:gap-3 transition-all">
                    Play Now
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );

          })}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/"
            className="text-text-muted hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
