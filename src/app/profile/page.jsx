'use client';

import React, { useState, useEffect } from 'react';
import { useAppSession, logout } from '@/utils/sessionManager';
import Link from 'next/link';
import { 
  getProfile, 
  getAllStats, 
  getAchievementCount,
  updateSettings,
  saveProfile,
  setAvatar,
  getAvatarId,
  ensureAvatarField
} from '@/utils/profileManager';
import { calculateWinRate } from '@/utils/statsCalculator';
import { 
  getTodaysWords,
  getSavedWords,
  getAllWords,
  getWordsByGame, 
  searchWords, 
  toggleFavorite,
  fetchDefinition,
  getLearningLogStats,
  isFavorite,
  WORD_GAMES 
} from '@/utils/learningLogEngine';
import { requestNotificationPermission, initNotifications } from '@/utils/notificationManager';
import { BADGES } from '@/utils/badgesEngine';
import { buildBadgeViewModel } from '@/utils/badgesUtils';
import BadgeCard from '@/components/BadgeCard';
import BadgesCollection from '@/components/BadgesCollection';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import SiteHeader from '@/components/SiteHeader';
import FeedbackForm from '@/components/FeedbackForm';
import Avatar3D from '@/components/Avatar3D';
import AvatarPicker from '@/components/AvatarPicker';
import DisplayName from '@/components/DisplayName';
import { validateName, MAX_INPUT_LENGTHS } from '@/utils/inputSanitizer';
import { 
  useSeasonIdentity, 
  SeasonPageHeader, 
  SeasonCard, 
  SeasonTexturedCard,
  SeasonDivider,
  SeasonIcon 
} from '@/components/SeasonIdentity';

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds) => {
  const numSeconds = Number(seconds);
  if (!Number.isFinite(numSeconds) || numSeconds < 0) {
    return '0:00';
  }
  const mins = Math.floor(numSeconds / 60);
  const secs = Math.floor(numSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ProfilePage() {
  const session = useAppSession();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [badgeViewModel, setBadgeViewModel] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatarId, setCurrentAvatarId] = useState(null);

  useEffect(() => {
    const loadProfile = () => {
      ensureAvatarField();
      
      const userProfile = getProfile();
      const allStats = getAllStats();
      const badgeModels = buildBadgeViewModel(userProfile);
      
      setProfile(userProfile);
      setStats(allStats);
      setBadgeViewModel(badgeModels);
      setCurrentAvatarId(getAvatarId());
    };
    
    loadProfile();
  }, []);

  const handleAvatarChange = (newAvatarId) => {
    setAvatar(newAvatarId);
    setCurrentAvatarId(newAvatarId);
    setProfile(prev => ({ ...prev, avatarId: newAvatarId }));
  };

  const handleReminderToggle = async () => {
    const newValue = !profile.settings.remindersEnabled;
    
    if (newValue) {
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ remindersEnabled: true });
        setProfile({ ...profile, settings: { ...profile.settings, remindersEnabled: true } });
        initNotifications(true);
      } else {
        alert('Please enable notifications in your browser settings to receive daily reminders.');
      }
    } else {
      updateSettings({ remindersEnabled: false });
      setProfile({ ...profile, settings: { ...profile.settings, remindersEnabled: false } });
    }
  };

  if (!profile || !stats) {
    const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-info border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const statsValues = Object.values(stats || {});
  const totalGames = statsValues.reduce((sum, game) => sum + (game?.gamesPlayed || 0), 0);
  const totalWins = statsValues.reduce((sum, game) => sum + (game?.gamesWon || 0), 0);
  const overallWinRate = calculateWinRate(totalWins, totalGames);
  const bestCurrentStreak = statsValues.reduce((max, game) => {
    const streak = game?.currentStreak || 0;
    return Math.max(max, streak);
  }, 0);
  const totalBadges = BADGES.length;
  const earnedBadges = getAchievementCount();
  const badgeProgress = totalBadges ? Math.round((earnedBadges / totalBadges) * 100) : 0;
  const earnedBadgesList = badgeViewModel.filter((badge) => badge.earned);
  const previewBadges = earnedBadgesList.slice(0, 6);

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <SiteHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Seasonal Page Header */}
        <div className="text-center mb-6">
          <SeasonPageHeader 
            title="Your Profile"
            subtitle="Track your progress, badges, and game stats"
            showBadge={true}
          />
        </div>
        
        {/* Profile Header with 3D Avatar - Seasonal Card */}
        <SeasonTexturedCard className="p-6 mb-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar3D
                avatarId={currentAvatarId}
                size="lg"
                onClick={() => setShowAvatarPicker(true)}
                showEditBadge={true}
                className="transition-transform duration-300 hover:scale-105 cursor-pointer"
              />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground transition-colors flex items-center justify-center gap-2">
                  <SeasonIcon index={0} />
                  {profile.name ? (
                    <>
                      Hi, <DisplayName name={profile.name} className="inline-flex" />!
                    </>
                  ) : (
                    'Welcome!'
                  )}
                  <SeasonIcon index={1} />
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click avatar to customize
                </p>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="flex-1 flex flex-col items-center sm:items-end gap-2">
              <div className="text-center sm:text-right">
                <p className="text-4xl font-bold text-foreground">{totalGames}</p>
                <p className="text-sm text-muted-foreground">Total Games</p>
              </div>
              <div className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-semibold transition-colors duration-200">
                {overallWinRate}% Win Rate
              </div>
            </div>
          </div>
        </SeasonTexturedCard>
        
        {/* Avatar Picker Modal */}
        <AvatarPicker 
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          currentAvatarId={currentAvatarId}
          onSelect={handleAvatarChange}
        />

        {/* Seasonal Divider */}
        <SeasonDivider variant="icons" className="my-6" />

        {/* Quick Stats Cards with Seasonal Styling */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SeasonalStatCard icon="🎮" value={totalGames} label="Games Played" colorClass="bg-info/10" textColor="text-info" />
          <SeasonalStatCard icon="🏆" value={totalWins} label="Games Won" colorClass="bg-success/10" textColor="text-success" />
          <SeasonalStatCard icon="🔥" value={bestCurrentStreak} label="Best Streak" colorClass="bg-warning/10" textColor="text-warning" />
          <SeasonalStatCard icon="⭐" value={earnedBadges} label="Badges" colorClass="bg-strands-bonus/10" textColor="text-strands-bonus" />
        </div>

        {/* Badges Preview Section */}
        <SeasonTexturedCard className="p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Badges</h2>
              <p className="text-sm text-muted-foreground">
                {earnedBadges}/{totalBadges} earned - {badgeProgress}% complete
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/badges"
                className="px-4 py-2 rounded-full bg-[hsl(var(--badge-new))] text-foreground text-sm font-semibold hover:opacity-90 transition"
              >
                View all
              </Link>
              <button
                onClick={() => setActiveTab('badges')}
                className="px-4 py-2 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-hover transition"
              >
                See progress
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {previewBadges.length ? (
              previewBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} compact showProgress={false} />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Play a game to start earning badges.
              </div>
            )}
          </div>
          <div className="mt-4">
            <BadgesProgressWidget variant="compact" />
          </div>
        </SeasonTexturedCard>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-secondary/50 rounded-xl">
          <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <TabButton label="Learning" active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} />
          <TabButton 
            label="Badges" 
            active={activeTab === 'badges'} 
            onClick={() => setActiveTab('badges')} 
            badge={earnedBadges}
          />
          <TabButton label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <TabButton label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'stats' && <StatsTab stats={stats} />}
          {activeTab === 'learning' && <LearningLogTab />}
          {activeTab === 'badges' && (
            <BadgesTab />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={profile.settings} onReminderToggle={handleReminderToggle} isAuthenticated={session?.role === 'USER'} />
          )}
          {activeTab === 'feedback' && <FeedbackTab />}
        </div>
        
        {/* Seasonal footer divider */}
        <SeasonDivider variant="gradient" className="mt-8" />
      </main>
    </div>
  );
}

// Seasonal Quick Stat Card Component
const SeasonalStatCard = ({ icon, value, label, colorClass, textColor }) => {
  const { pack } = useSeasonIdentity();
  
  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <SeasonCard 
      className={`${colorClass} p-4 text-center`}
      hover={true}
    >
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${textColor} transition-colors`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {pack && (
        <div className="absolute bottom-1 right-1 text-xs opacity-30">{pack.microIcons[0]}</div>
      )}
    </SeasonCard>
  );
};

// Tab Button Component
const TabButton = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
      active 
        ? 'bg-success text-success-foreground shadow-sm' 
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    }`}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
        active ? 'bg-success-foreground/20 text-success-foreground' : 'bg-success/20 text-success'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

// Overview Tab
const OverviewTab = ({ stats }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-foreground mb-4">Game Overview</h2>
    
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <GameSummaryCard gameName="Wordle" stats={stats.wordle} icon="🟩" color="text-wordle-correct" />
      <GameSummaryCard gameName="Connections" stats={stats.connections} icon="🔗" color="text-connections-purple" />
      <GameSummaryCard gameName="Strands" stats={stats.strands} icon="🕸️" color="text-strands-ribbon" />
      <GameSummaryCard gameName="Crossword" stats={stats.crossword} icon="📝" color="text-crossword-active" />
      <GameSummaryCard gameName="Waffle" stats={stats.waffle} icon="🧇" color="text-warning" />
      <GameSummaryCard gameName="Combinations" stats={stats.combinations} icon="🔀" color="text-info" />
      <GameSummaryCard gameName="Letterbox" stats={stats.letterbox} icon="📬" color="text-destructive" />
      <GameSummaryCard gameName="Sudoku" stats={stats.sudoku} icon="🔢" color="text-muted-foreground" />
      {stats.spelling && (
        <GameSummaryCard gameName="Spelling Bee" stats={stats.spelling} icon="🐝" color="text-connections-yellow" />
      )}
    </div>
  </div>
);

// Game Summary Card
const GameSummaryCard = ({ gameName, stats, icon, color }) => {
  if (!stats) return null;

  const wins = stats.gamesWon ?? 0;
  const streak = stats.currentStreak ?? 0;
  const longest = stats.longestStreak ?? stats.maxStreak ?? 0;
  const played = stats.gamesPlayed ?? 0;
  const winRate = calculateWinRate(wins, played);

  // Map game names to their correct paths
  const gamePathMap = {
    'Wordle': '/games/wordle',
    'Connections': '/games/connections',
    'Strands': '/games/strands',
    'Crossword': '/games/crossword',
    'Waffle': '/games/waffle',
    'Combinations': '/games/combinations',
    'Letterbox': '/games/letterbox',
    'Sudoku': '/games/sudoku',
    'Spelling Bee': '/games/spelling'
  };

  const gamePath = gamePathMap[gameName] || `/games/${gameName.toLowerCase().replace(' ', '-')}`;

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <Link href={gamePath}>
      <div className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-border/80 hover:-translate-y-0.5 cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${color} transition-transform duration-200 group-hover:scale-110`}>{icon}</span>
            <div>
              <p className="text-2xl font-bold text-foreground">{played}</p>
              <p className="text-xs text-muted-foreground">Played</p>
            </div>
          </div>
        </div>
        <p className="font-semibold text-foreground mb-2">{gameName}</p>
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <p className="font-bold text-success">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-warning">{streak}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-info">{longest}</p>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Stats Tab
const StatsTab = ({ stats }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-foreground">Detailed Statistics</h2>
    
    {Object.entries(stats || {}).map(([gameName, gameStats]) => {
      if (!gameStats) return null;
      
      const played = Number(gameStats.gamesPlayed) || 0;
      const wins = Number(gameStats.gamesWon) || 0;
      const currentStreak = Number(gameStats.currentStreak) || 0;
      const longestStreak = Number(gameStats.longestStreak ?? gameStats.maxStreak) || 0;
      const winRate = `${calculateWinRate(wins, played)}%`;
      const bestTime = gameStats.bestTime != null ? Number(gameStats.bestTime) : null;
      const perfectGames = Number(gameStats.perfectGames) || 0;
      
      // Safely parse averageAttempts - it might be stored as a string from toFixed()
      const averageAttemptsRaw = gameStats.averageAttempts;
      const averageAttempts = typeof averageAttemptsRaw === 'string' 
        ? parseFloat(averageAttemptsRaw) 
        : Number(averageAttemptsRaw) || 0;

      const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
        <div key={gameName} className="bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:shadow-sm">
          <h3 className="text-lg font-bold text-foreground capitalize mb-4">{gameName}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem label="Games Played" value={played} />
            <StatItem label="Games Won" value={wins} />
            <StatItem label="Win Rate" value={winRate} highlight />
            <StatItem label="Current Streak" value={currentStreak} />
            <StatItem label="Longest Streak" value={longestStreak} />
            {bestTime !== null && Number.isFinite(bestTime) && (
              <StatItem label="Best Time" value={formatTime(bestTime)} />
            )}
            {Number.isFinite(averageAttempts) && averageAttempts > 0 && (
              <StatItem label="Avg Attempts" value={averageAttempts.toFixed(1)} />
            )}
            {perfectGames > 0 && (
              <StatItem label="Perfect Games" value={perfectGames} />
            )}
          </div>
        </div>
      );
    }).filter(Boolean)}
  </div>
);

const StatItem = ({ label, value, highlight = false }) => (
  <div className="text-center p-3 bg-secondary/30 rounded-lg transition-colors duration-200 hover:bg-secondary/50">
    <p className={`text-xl font-bold transition-colors ${
      highlight ? 'text-success' : 'text-foreground'
    }`}>
      {value}
    </p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

// Learning Log Tab
const LearningLogTab = () => {
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loadingDefinition, setLoadingDefinition] = useState(null);
  const [stats, setStats] = useState(null);

  const gameNames = {
    wordle: 'Wordle',
    connections: 'Connections',
    strands: 'Strands',
    crossword: 'Crossword',
    waffle: 'Waffle',
    combinations: 'Combinations',
    spelling: 'Spelling Bee',
  };

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = () => {
    const allWords = getAllWords();
    const savedWords = getSavedWords();
    setWords(allWords);
    setFavorites(new Set(savedWords.map(w => w.word)));
    setStats(getLearningLogStats());
  };

  useEffect(() => {
    let filtered = [...words];
    
    if (gameFilter !== 'all') {
      filtered = filtered.filter(w => w.game === gameFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase().trim();
      filtered = filtered.filter(w => 
        w.word.includes(q) ||
        (w.definition && w.definition.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(w => favorites.has(w.word));
    }
    
    filtered.sort((a, b) => {
      const aFav = favorites.has(a.word);
      const bFav = favorites.has(b.word);
      if (aFav !== bFav) return bFav - aFav;
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    
    setFilteredWords(filtered);
  }, [words, searchQuery, gameFilter, showFavoritesOnly, favorites]);

  const handleToggleFavorite = (word) => {
    toggleFavorite(word);
    loadWords();
  };

  const handleFetchDefinition = async (word) => {
    if (loadingDefinition) return;
    setLoadingDefinition(word);
    try {
      await fetchDefinition(word);
      loadWords();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDefinition(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        📘 Learning Log
      </h2>
      
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-info/10 rounded-xl p-4 text-center transition-all duration-200 hover:bg-info/15">
            <p className="text-2xl font-bold text-info">{stats.totalWords || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Words Learned</p>
          </div>
          <div className="bg-warning/10 rounded-xl p-4 text-center transition-all duration-200 hover:bg-warning/15">
            <p className="text-2xl font-bold text-warning">{stats.favorites || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Favorites</p>
          </div>
          {stats.byGame && Object.entries(stats.byGame).slice(0, 2).map(([game, count]) => (
            <div key={game} className="bg-secondary/50 rounded-xl p-4 text-center transition-all duration-200 hover:bg-secondary/70">
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{gameNames[game] || game}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
        </div>
        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-200 cursor-pointer"
        >
          <option value="all">All Games</option>
          {WORD_GAMES.map(g => (
            <option key={g} value={g}>{gameNames[g] || g}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
            showFavoritesOnly 
              ? 'bg-warning text-warning-foreground shadow-sm' 
              : 'bg-secondary text-foreground border border-border hover:bg-accent'
          }`}
        >
          ⭐ {showFavoritesOnly ? 'All' : 'Favorites'}
        </button>
      </div>

      {/* Word List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            {words.length === 0 ? (
              <>
                <p className="text-5xl mb-4">📚</p>
                <p className="text-lg font-semibold text-foreground">No words learned yet!</p>
                <p className="text-sm text-muted-foreground mt-2">Complete puzzles to build your vocabulary.</p>
              </>
            ) : (
              <>
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-foreground">No words match your search.</p>
              </>
            )}
          </div>
        ) : (
          filteredWords.map((wordEntry) => (
            <div 
              key={`${wordEntry.word}-${wordEntry.game}`} 
              className="bg-card border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-sm hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleFavorite(wordEntry.word)}
                    className="text-2xl transition-transform duration-200 hover:scale-110"
                  >
                    {favorites.has(wordEntry.word) ? '⭐' : '☆'}
                  </button>
                  <div>
                    <span className="font-bold text-lg text-foreground">{wordEntry.word}</span>
                    {wordEntry.partOfSpeech && (
                      <span className="text-sm text-muted-foreground ml-2">({wordEntry.partOfSpeech})</span>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground font-medium">
                  {(gameNames[wordEntry.game] || wordEntry.game).slice(0, 4)}
                </span>
              </div>
              {wordEntry.definition ? (
                <p className="text-sm text-muted-foreground mt-2 ml-11">{wordEntry.definition}</p>
              ) : (
                <button
                  onClick={() => handleFetchDefinition(wordEntry.word)}
                  disabled={loadingDefinition === wordEntry.word}
                  className="mt-2 ml-11 text-sm text-info hover:text-info/80 hover:underline disabled:opacity-50 transition-colors duration-200"
                >
                  {loadingDefinition === wordEntry.word ? '⏳ Loading...' : '📖 Get definition'}
                </button>
              )}
              <p className="text-xs text-muted-foreground/70 mt-2 ml-11">
                Learned: {new Date(wordEntry.dateAdded).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Badges Tab
const BadgesTab = () => (
  <div className="space-y-4">
    <BadgesCollection variant="embedded" />
  </div>
);

// Feedback Tab
const FeedbackTab = () => {
  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        💬 Send Feedback
      </h2>
      
      <div className="bg-card border border-border rounded-xl p-6 transition-all duration-200">
        <p className="text-muted-foreground mb-6">
          We value your feedback! Share your thoughts, report bugs, or suggest features to help us improve Ammar Times.
        </p>
        
        <div className="bg-secondary/30 rounded-xl p-4">
          <FeedbackForm 
            onClose={() => {}} 
            isFloating={false} 
          />
        </div>
      </div>
      
      <div className="bg-info/10 border border-info/20 rounded-xl p-5 transition-all duration-200">
        <h3 className="font-semibold text-foreground mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Be specific about issues - include which game and what happened</li>
          <li>• Feature requests are always welcome!</li>
          <li>• We read every message and appreciate your time</li>
        </ul>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab = ({ settings, onReminderToggle, isAuthenticated }) => {
  const [profile, setProfile] = useState(() => getProfile());
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(() => getProfile()?.name || '');
  const [nameError, setNameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = () => {
    const validation = validateName(newName);
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }

    const updatedProfile = getProfile();
    updatedProfile.name = validation.value;
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setEditingName(false);
    setNameError('');
    
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if (window.indexedDB && indexedDB.databases) {
            const dbs = await indexedDB.databases();
            await Promise.all(
              (dbs || []).map((db) =>
                db?.name
                  ? new Promise((resolve) => {
                      const req = indexedDB.deleteDatabase(db.name);
                      req.onsuccess = () => resolve(null);
                      req.onerror = () => resolve(null);
                      req.onblocked = () => resolve(null);
                    })
                  : Promise.resolve(null)
              )
            );
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (e) {
          // Ignore cache clearing errors
        }
      }

      await logout();
      window.location.href = '/';
    } catch (error) {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Settings</h2>
      
      {/* Player Name Section */}
      <div className="bg-card border border-border rounded-xl p-5 transition-all duration-200">
        <h3 className="font-semibold text-foreground mb-4">Player Identity</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Display Name</p>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm text-info hover:text-info/80 transition-colors duration-200"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          
          {editingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter your name"
                maxLength={MAX_INPUT_LENGTHS.NAME}
                dir="auto"
                className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info/50 transition-all duration-200 name-text"
              />
              <p className="text-xs text-muted-foreground">
                {newName.length}/{MAX_INPUT_LENGTHS.NAME} characters
              </p>
              {nameError && (
                <p className="text-sm text-destructive">
                  {nameError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-success text-success-foreground rounded-xl font-medium transition-all duration-200 hover:bg-success/90"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(profile?.name || '');
                    setNameError('');
                  }}
                  className="px-4 py-2 bg-secondary text-foreground border border-border rounded-xl font-medium transition-all duration-200 hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-lg font-medium text-foreground py-2">
              <DisplayName name={profile?.name || 'Anonymous'} />
            </p>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            👤 Your name is displayed in your profile and visible to others in the admin dashboard.
          </p>
        </div>
      </div>
    
      <div className="bg-card border border-border rounded-xl p-5 transition-all duration-200">
        <h3 className="font-semibold text-foreground mb-4">Notifications</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Daily Reminders</p>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified when new puzzles are available
            </p>
          </div>
          <button 
            onClick={onReminderToggle}
            className={`w-12 h-7 rounded-full transition-all duration-200 relative ${
              settings?.remindersEnabled ? 'bg-success' : 'bg-secondary'
            }`}
          >
            <span className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all duration-200 shadow-sm ${
              settings?.remindersEnabled ? 'left-6' : 'left-1'
            }`} />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Note: Browser notifications require permission. 
            Enable them in your browser settings if you haven&apos;t already.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This permanently deletes your account, progress, badges, and leaderboard rankings.
            </p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteInput('');
                setDeleteError('');
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-wordle-absent text-white hover:opacity-90 transition-opacity"
            >
              Delete Account
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Sign in to delete your account.</span>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-wordle-absent rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-wordle-absent mb-3">Delete Account Permanently?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action is permanent. All your progress, badges, and leaderboard rankings will be deleted and cannot be recovered.
            </p>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type DELETE to confirm
            </label>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-wordle-absent/50"
            />
            {deleteError && (
              <p className="text-sm text-wordle-absent mt-2">{deleteError}</p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-hover transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteInput !== 'DELETE'}
                className="flex-1 px-4 py-2 rounded-lg bg-wordle-absent text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-secondary/30 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">About</h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p>Platform: Ammar Times</p>
          <p>Version: 2.1.0</p>
          <p>Storage: Local (Browser Storage)</p>
        </div>
      </div>
    </div>
  );
};

