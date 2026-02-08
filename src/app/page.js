'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import PuzzleLoader from '@/components/PuzzleLoader';
import { useSimplePuzzleLoader } from '@/hooks/usePuzzleLoader';
import { getAllStats, getUnlockedAchievements, getAchievementCount } from '@/utils/profileManager';
import { BADGES } from '@/utils/badgesEngine';
import { getActiveTheme } from '@/utils/themeEngine';
import { useTutorial } from '@/hooks/useTutorial';
import { GLOBAL_TUTORIAL } from '@/data/tutorials';
import {
  useSeasonIdentity,
  SeasonPageHeader,
  SeasonCard,
  SeasonDivider,
  SeasonIcon
} from '@/components/SeasonIdentity';

// Motion variants (NO TS)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function Home() {
  const isLoading = useSimplePuzzleLoader();
  const { openManual: openGlobalTutorial } = useTutorial(GLOBAL_TUTORIAL.id, { auto: false });

  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [countdown, setCountdown] = useState('00:00:00');
  const [activeTheme, setActiveTheme] = useState(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    // REAL DATA (same as your version)
    const allStats = getAllStats();
    const unlockedBadges = getUnlockedAchievements();
    const theme = getActiveTheme();

    queueMicrotask(() => {
      setStats(allStats);
      setBadges(unlockedBadges);
      setActiveTheme(theme);
    });
  }, []);

  // Countdown to next puzzle (midnight Cairo time)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Get current time in Cairo
      const cairoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
      // Set to midnight tomorrow in Cairo
      const tomorrow = new Date(cairoTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      // Calculate difference
      const diff = tomorrow.getTime() - cairoTime.getTime();

      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // REAL stats calculations (same logic as your version)
  const computed = useMemo(() => {
    const statsValues = stats ? Object.values(stats) : [];
    const totalGames = statsValues.reduce((sum, game) => sum + (game?.gamesPlayed || 0), 0);
    const bestStreak = statsValues.reduce((mx, game) => Math.max(mx, game?.currentStreak || 0), 0);
    const totalBadges = getAchievementCount();
    const badgeProgress =
      BADGES.length > 0 ? Math.round((totalBadges / BADGES.length) * 100) : 0;

    return { totalGames, bestStreak, totalBadges, badgeProgress };
  }, [stats]);

  if (!mounted) return null;

  if (isLoading) {
    return <PuzzleLoader isLoading={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden">
      {/* HERO (same direction as your old page) */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Lovable-style animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[hsl(var(--accent)/0.16)] via-[hsl(var(--accent)/0.05)] to-transparent blur-3xl"
            animate={{ scale: [1, 1.12, 1], x: [0, 35, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[460px] h-[460px] rounded-full bg-gradient-to-tl from-[hsl(var(--info)/0.14)] via-[hsl(var(--info)/0.04)] to-transparent blur-3xl"
            animate={{ scale: [1.1, 1, 1.1], x: [0, -28, 0], y: [0, 22, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Ammar Times FIRST (real header) */}
          <motion.div variants={itemVariants}>
            <SeasonPageHeader
              title="Ammar Times"
              subtitle="Your daily dose of mental exercise. Challenge your mind with 9 unique puzzle games."
              showBadge={true}
            />
          </motion.div>

          {/* REAL active theme badge */}
          {activeTheme && (
            <motion.div variants={scaleVariants} className="mt-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-card/85 backdrop-blur-md border border-[hsl(var(--border))] shadow-lg"
                style={{
                  backgroundColor: (activeTheme.banner?.backgroundColor || '#ffffff') + '20',
                  color: activeTheme.banner?.backgroundColor || 'hsl(var(--foreground))'
                }}
              >
                <span className="text-lg">{activeTheme.emoji}</span>
                <span>{activeTheme.name} Event Active!</span>
              </div>
            </motion.div>
          )}

          {/* Countdown (real) */}
          <motion.div variants={scaleVariants} className="mt-8">
            <SeasonCard
              className="inline-flex items-center gap-3 sm:gap-4 px-6 py-4 rounded-2xl bg-[hsl(var(--card))]/75 backdrop-blur-xl border border-[hsl(var(--border))] shadow-xl"
              hover={false}
              glow={true}
            >
              <SeasonIcon index={0} />
              <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
                Next puzzles in
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-[hsl(var(--foreground))]">
                {countdown}
              </span>
              <SeasonIcon index={1} />
            </SeasonCard>
          </motion.div>

          {/* Buttons (same direction/behavior as your old version) */}
          <motion.div variants={itemVariants} className="mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/games"
                className="
                  group inline-flex items-center gap-2 px-8 py-4
                  bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
                  rounded-2xl font-bold text-lg
                  shadow-lg shadow-[hsl(var(--accent))]/20
                  hover:shadow-xl hover:shadow-[hsl(var(--accent))]/30
                  hover:-translate-y-0.5 hover:scale-[1.01]
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2
                "
              >
                <span className="text-xl">🎮</span>
                <span>Play Now</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-1 transition-transform group-hover:translate-x-1"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/profile"
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  text-[hsl(var(--muted-foreground))]
                  hover:text-[hsl(var(--foreground))]
                  font-medium transition-colors duration-200
                "
              >
                <span className="text-xl">👤</span>
                <span>View Profile</span>
              </Link>

              <button
                type="button"
                onClick={openGlobalTutorial}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  text-[hsl(var(--muted-foreground))]
                  hover:text-[hsl(var(--foreground))]
                  font-medium transition-colors duration-200
                "
              >
                <span className="text-xl">?</span>
                <span>How it works</span>
              </button>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(var(--background))] to-transparent pointer-events-none" />
      </section>

    

      {/* Quick Stats (REAL) */}
      {stats && (
        <motion.section
          className="py-12 px-4 border-t border-[hsl(var(--border))]"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
              <SeasonIcon index={2} />
              Your Progress
              <SeasonIcon index={3} />
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SeasonalStatCard
                icon="🎮"
                value={computed.totalGames}
                label="Games Played"
                colorClass="bg-[hsl(var(--info))]/10"
                textColor="text-[hsl(var(--info))]"
              />
              <SeasonalStatCard
                icon="🔥"
                value={computed.bestStreak}
                label="Best Streak"
                colorClass="bg-[hsl(var(--warning))]/10"
                textColor="text-[hsl(var(--warning))]"
              />
              <SeasonalStatCard
                icon="⭐"
                value={computed.totalBadges}
                label="Badges"
                colorClass="bg-[hsl(var(--accent))]/10"
                textColor="text-[hsl(var(--accent))]"
              />
              <SeasonalStatCard
                icon="📈"
                value={`${computed.badgeProgress}%`}
                label="Completion"
                colorClass="bg-[hsl(var(--success))]/10"
                textColor="text-[hsl(var(--success))]"
              />
            </div>
          </div>
        </motion.section>
      )}

      {/* Recent Badges (REAL) */}
      {badges.length > 0 && (
        <motion.section
          className="py-8 px-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/50"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-2">
                <SeasonIcon index={4} />
                Recent Badges
              </h2>
              <Link href="/badges" className="text-sm text-[hsl(var(--accent))] hover:underline">
                View All →
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {badges.slice(0, 5).map((badge, index) => {
                const meta = BADGES.find((a) => a.id === badge.id);
                return (
                  <motion.div
                    key={`${badge.id}-${index}`}
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{ duration: 0.18 }}
                    className="flex-shrink-0"
                  >
                    <SeasonCard className="flex items-center gap-2 px-4 py-2" hover={true}>
                      <span className="text-xl">{meta?.icon || '🏆'}</span>
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {meta?.name || 'Badge'}
                      </span>
                    </SeasonCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

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

function SeasonalStatCard({ icon, value, label, colorClass, textColor }) {
  const { pack } = useSeasonIdentity();

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="group">
      <SeasonCard className={`${colorClass} p-4 text-center`} hover={true} glow={false}>
        <p className="text-2xl mb-1">{icon}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</p>
        {pack && <div className="absolute bottom-1 right-1 text-xs opacity-40">{pack.microIcons[0]}</div>}
      </SeasonCard>
    </motion.div>
  );
}
