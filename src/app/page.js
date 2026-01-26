'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PuzzleLoader from '@/components/PuzzleLoader';
import { useSimplePuzzleLoader } from '@/hooks/usePuzzleLoader';
import { getAllStats, getUnlockedAchievements, getAchievementCount } from '@/utils/profileManager';
import { ACHIEVEMENTS } from '@/utils/achievementsEngine';
import { getActiveTheme } from '@/utils/themeEngine';
import { 
  useSeasonIdentity, 
  SeasonPageHeader, 
  SeasonCard, 
  SeasonDivider,
  SeasonIcon 
} from '@/components/SeasonIdentity';

export default function Home() {
  const isLoading = useSimplePuzzleLoader();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [activeTheme, setActiveTheme] = useState(null);

  useEffect(() => {
    // Load user data
    const allStats = getAllStats();
    const unlockedAchievements = getUnlockedAchievements();
    const theme = getActiveTheme();
    
    setStats(allStats);
    setAchievements(unlockedAchievements);
    setActiveTheme(theme);
  }, []);

  // Countdown to next puzzle (midnight UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = tomorrow - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overall stats
  const statsValues = stats ? Object.values(stats) : [];
  const totalGames = statsValues.reduce((sum, game) => sum + (game?.gamesPlayed || 0), 0);
  const bestStreak = statsValues.reduce((max, game) => Math.max(max, game?.currentStreak || 0), 0);
  const totalAchievements = getAchievementCount();
  const achievementProgress = Math.round((totalAchievements / ACHIEVEMENTS.length) * 100);

  if (isLoading) {
    return <PuzzleLoader isLoading={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Hero Section with Seasonal Identity */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background gradient - enhanced with seasonal glow */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent))]/10 via-transparent to-[hsl(var(--info))]/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--accent))]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--info))]/5 rounded-full blur-3xl" />
        </div>

        <div className="z-10 text-center max-w-2xl animate-fade-in-up">
          {/* Seasonal Page Header with Badge */}
          <SeasonPageHeader 
            title="Ammar Times"
            subtitle="Your daily dose of mental exercise. Challenge your mind with 9 unique puzzle games."
            showBadge={true}
          />

          {/* Legacy Theme Badge (for event-specific) */}
          {activeTheme && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-4 animate-pulse-subtle"
              style={{ 
                backgroundColor: activeTheme.banner?.backgroundColor + '20',
                color: activeTheme.banner?.backgroundColor 
              }}
            >
              <span>{activeTheme.emoji}</span>
              <span>{activeTheme.name} Event Active!</span>
            </div>
          )}

          {/* Countdown with Seasonal Styling */}
          <SeasonCard className="mt-8 inline-flex items-center gap-3 px-5 py-3" hover={false} glow={true}>
            <SeasonIcon index={0} />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Next puzzles in</span>
            <span className="font-mono text-xl font-bold text-[hsl(var(--accent))]">{countdown}</span>
            <SeasonIcon index={1} />
          </SeasonCard>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link 
              href="/games" 
              className="
                inline-flex items-center gap-2 px-8 py-4 
                bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                rounded-2xl font-bold text-lg 
                shadow-lg shadow-[hsl(var(--accent))]/20
                hover:shadow-xl hover:shadow-[hsl(var(--accent))]/30
                hover:scale-105 active:scale-[0.98]
                transition-all duration-300 ease-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2
              "
            >
              <span>🎮</span>
              <span>Play Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            
            <Link 
              href="/profile" 
              className="
                inline-flex items-center gap-2 px-6 py-3
                text-[hsl(var(--muted-foreground))]
                hover:text-[hsl(var(--foreground))]
                font-medium
                transition-colors duration-200
              "
            >
              <span>👤</span>
              <span>View Profile</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Seasonal Divider before Stats */}
      <SeasonDivider variant="icons" className="my-4" />

      {/* Quick Stats Section */}
      {stats && (
        <section className="py-12 px-4 border-t border-[hsl(var(--border))]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
              <SeasonIcon index={2} />
              Your Progress
              <SeasonIcon index={3} />
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SeasonalStatCard 
                icon="🎮" 
                value={totalGames} 
                label="Games Played"
                colorClass="bg-[hsl(var(--info))]/10"
                textColor="text-[hsl(var(--info))]"
              />
              <SeasonalStatCard 
                icon="🔥" 
                value={bestStreak} 
                label="Best Streak"
                colorClass="bg-[hsl(var(--warning))]/10"
                textColor="text-[hsl(var(--warning))]"
              />
              <SeasonalStatCard 
                icon="⭐" 
                value={totalAchievements} 
                label="Achievements"
                colorClass="bg-[hsl(var(--accent))]/10"
                textColor="text-[hsl(var(--accent))]"
              />
              <SeasonalStatCard 
                icon="📈" 
                value={`${achievementProgress}%`} 
                label="Completion"
                colorClass="bg-[hsl(var(--success))]/10"
                textColor="text-[hsl(var(--success))]"
              />
            </div>
          </div>
        </section>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <section className="py-8 px-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                <SeasonIcon index={4} />
                Recent Achievements
              </h2>
              <Link 
                href="/profile" 
                className="text-sm text-[hsl(var(--accent))] hover:underline"
              >
                View All →
              </Link>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {achievements.slice(0, 5).map((achievement, index) => (
                <SeasonCard 
                  key={index}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2"
                  hover={true}
                >
                  <span className="text-xl">{ACHIEVEMENTS.find(a => a.id === achievement.id)?.icon || '🏆'}</span>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {ACHIEVEMENTS.find(a => a.id === achievement.id)?.name || 'Achievement'}
                  </span>
                </SeasonCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seasonal Divider before Footer */}
      <SeasonDivider variant="gradient" className="my-4" />

      {/* Footer */}
      <footer className="py-6 px-4 text-center border-t border-[hsl(var(--border))]">
        <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
          <SeasonIcon index={5} />
          © 2026 Ammar Times. All rights reserved.
          <SeasonIcon index={6} />
        </p>
      </footer>
    </div>
  );
}

// Seasonal Stat Card Component
function SeasonalStatCard({ icon, value, label, colorClass, textColor }) {
  const { pack } = useSeasonIdentity();
  
  return (
    <SeasonCard 
      className={`${colorClass} p-4 text-center`}
      hover={true}
      glow={false}
    >
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</p>
      {pack && (
        <div className="absolute bottom-1 right-1 text-xs opacity-40">{pack.microIcons[0]}</div>
      )}
    </SeasonCard>
  );
}
