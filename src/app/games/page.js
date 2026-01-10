'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllStats } from '@/utils/profileManager';

export default function GamesPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const allStats = getAllStats();
    setStats(allStats);
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
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-8 animate-fade-in-up">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => {
            const gameStats = stats?.[game.id];
            const streak = gameStats?.currentStreak || 0;
            
            return (
              <Link
                key={game.id}
                href={game.href}
                className="group bg-card border-2 border-card-border rounded-2xl p-8 hover:bg-surface-hover hover:border-border-active transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{game.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground">
                      {game.name}
                    </h2>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 font-bold text-sm mt-1">
                        🔥 {streak} day streak
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-text-muted text-lg">
                  {game.description}
                </p>
                <div className="mt-4 text-wordle-correct font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  Play Now
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
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
