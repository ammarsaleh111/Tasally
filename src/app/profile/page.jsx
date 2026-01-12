'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getProfile, 
  getAllStats, 
  getUnlockedAchievements,
  getAchievementCount,
  updateSettings,
  saveProfile
} from '@/utils/profileManager';
import { 
  getLearningLog, 
  getWordsByGame, 
  searchWords, 
  toggleFavorite,
  fetchDefinition,
  getLearningLogStats,
  WORD_GAMES 
} from '@/utils/learningLogEngine';
import { ACHIEVEMENTS } from '@/utils/achievementsEngine';
import { requestNotificationPermission, initNotifications } from '@/utils/notificationManager';
import AchievementBadge from '@/components/AchievementBadge';
import SiteHeader from '@/components/SiteHeader';
import FeedbackForm from '@/components/FeedbackForm';

// Helper function to format time (seconds to MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, stats, achievements, settings, feedback
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      const userProfile = getProfile();
      const allStats = getAllStats();
      const achievements = getUnlockedAchievements();
      
      setProfile(userProfile);
      setStats(allStats);
      setUnlockedAchievements(achievements);
    };
    
    loadProfile();
  }, []);

  const handleReminderToggle = async () => {
    const newValue = !profile.settings.remindersEnabled;
    
    if (newValue) {
      // Request permission when enabling
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ remindersEnabled: true });
        setProfile({ ...profile, settings: { ...profile.settings, remindersEnabled: true } });
        initNotifications(true);
      } else {
        alert('Please enable notifications in your browser settings to receive daily reminders.');
      }
    } else {
      // Disable reminders
      updateSettings({ remindersEnabled: false });
      setProfile({ ...profile, settings: { ...profile.settings, remindersEnabled: false } });
    }
  };

  if (!profile || !stats) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statsValues = Object.values(stats || {});
  const totalGames = statsValues.reduce((sum, game) => sum + (game?.gamesPlayed || 0), 0);
  const totalWins = statsValues.reduce((sum, game) => sum + (game?.gamesWon || 0), 0);
  const bestCurrentStreak = statsValues.reduce((max, game) => {
    const streak = game?.currentStreak || 0;
    return Math.max(max, streak);
  }, 0);
  const totalAchievements = getAchievementCount();
  const achievementProgress = Math.round((totalAchievements / ACHIEVEMENTS.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-wordle-correct to-connections-purple rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {profile.name ? `${profile.name}'s Profile` : 'Your Profile'}
              </h1>
              <p className="text-white/80">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{totalGames}</div>
              <div className="text-sm opacity-90">Total Games</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon="🎮" 
            value={totalGames} 
            label="Total Games" 
            colorClass="bg-connections-blue/10 border-connections-blue/30" 
            textColor="text-connections-blue"
          />
          <StatCard 
            icon="🏆" 
            value={totalWins} 
            label="Total Wins" 
            colorClass="bg-wordle-correct/10 border-wordle-correct/30" 
            textColor="text-wordle-correct"
          />
          <StatCard 
            icon="🔥" 
            value={bestCurrentStreak} 
            label="Best Current Streak" 
            colorClass="bg-connections-orange/10 border-connections-orange/30" 
            textColor="text-connections-orange"
          />
          <StatCard 
            icon="⭐" 
            value={totalAchievements} 
            label={`Achievements (${achievementProgress}%)`} 
            colorClass="bg-wordle-present/10 border-wordle-present/30" 
            textColor="text-wordle-present"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border-default overflow-x-auto">
          <TabButton 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <TabButton 
            label="Stats" 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
          />
          <TabButton 
            label="📘 Learning Log" 
            active={activeTab === 'learning'} 
            onClick={() => setActiveTab('learning')} 
          />
          <TabButton 
            label="Achievements" 
            active={activeTab === 'achievements'} 
            onClick={() => setActiveTab('achievements')} 
            badge={totalAchievements}
          />
          <TabButton 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
          <TabButton 
            label="💬 Send Feedback" 
            active={activeTab === 'feedback'} 
            onClick={() => setActiveTab('feedback')} 
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'learning' && <LearningLogTab />}
        {activeTab === 'achievements' && (
          <AchievementsTab 
            unlockedAchievements={unlockedAchievements} 
            totalAchievements={ACHIEVEMENTS.length}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            settings={profile.settings} 
            onReminderToggle={handleReminderToggle} 
          />
        )}
        {activeTab === 'feedback' && <FeedbackTab />}
      </div>
    </div>
  );
}

// Quick Stat Card Component
const StatCard = ({ icon, value, label, colorClass, textColor }) => (
  <div className={`${colorClass} border-2 rounded-xl p-6 text-center transition-all hover:scale-105`}>
    <div className="text-4xl mb-2">{icon}</div>
    <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    <div className="text-sm text-text-muted mt-1">{label}</div>
  </div>
);

// Tab Button Component
const TabButton = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-bold transition-all relative whitespace-nowrap ${
      active
        ? 'border-b-4 border-wordle-correct text-wordle-correct'
        : 'text-text-muted hover:text-foreground hover:bg-surface-hover'
    }`}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-wordle-present text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
        {badge}
      </span>
    )}
  </button>
);

// Overview Tab
const OverviewTab = ({ stats }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-foreground mb-4">Game Overview</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <GameSummaryCard gameName="Wordle" stats={stats.wordle} icon="📝" color="from-wordle-correct to-wordle-correct/80" />
      <GameSummaryCard gameName="Connections" stats={stats.connections} icon="🔗" color="from-connections-blue to-connections-purple" />
      <GameSummaryCard gameName="Crossword" stats={stats.crossword} icon="🧩" color="from-connections-purple to-connections-blue" />
      <GameSummaryCard gameName="Waffle" stats={stats.waffle} icon="🧇" color="from-connections-orange to-wordle-present" />
      <GameSummaryCard gameName="Combinations" stats={stats.combinations} icon="🧩" color="from-connections-blue to-wordle-correct" />
      <GameSummaryCard gameName="Numbers" stats={stats.numbers} icon="🔢" color="from-connections-orange to-connections-orange/80" />
      <GameSummaryCard gameName="Trivia" stats={stats.trivia} icon="🎓" color="from-wordle-present to-wordle-correct" />
      <GameSummaryCard gameName="Strands" stats={stats.strands} icon="🧵" color="from-connections-purple to-wordle-present" />
      {stats.spelling && (
        <GameSummaryCard gameName="Spelling" stats={stats.spelling} icon="🐝" color="from-wordle-present to-connections-orange" />
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
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <Link href={`/games/${gameName.toLowerCase()}`}>
      <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white hover:opacity-90 hover:scale-105 transition-all cursor-pointer shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-5xl">{icon}</div>
          <div className="text-right">
            <div className="text-3xl font-bold">{played}</div>
            <div className="text-sm opacity-90">Played</div>
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">{gameName}</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="font-bold text-lg">{winRate}%</div>
            <div className="opacity-75">Win Rate</div>
          </div>
          <div>
            <div className="font-bold text-lg">{streak}</div>
            <div className="opacity-75">Streak</div>
          </div>
          <div>
            <div className="font-bold text-lg">{longest}</div>
            <div className="opacity-75">Best</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Stats Tab
const StatsTab = ({ stats }) => (
  <div className="space-y-8">
    <h2 className="text-2xl font-bold text-foreground mb-4">Detailed Statistics</h2>
    
    {Object.entries(stats).map(([gameName, gameStats]) => {
      const played = gameStats?.gamesPlayed ?? 0;
      const wins = gameStats?.gamesWon ?? 0;
      const currentStreak = gameStats?.currentStreak ?? 0;
      const longestStreak = gameStats?.longestStreak ?? gameStats?.maxStreak ?? 0;
      const winRate = played > 0 ? `${Math.round((wins / played) * 100)}%` : '0%';
      const bestTime = gameStats?.bestTime ?? null;
      const averageAttempts = gameStats?.averageAttempts ?? 0;
      const perfectGames = gameStats?.perfectGames ?? 0;

      return (
        <div key={gameName} className="bg-card rounded-xl p-6 shadow-md border border-card-border hover:border-wordle-correct/50 transition-all">
          <h3 className="text-xl font-bold text-foreground mb-4 capitalize">{gameName}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Played" value={played} />
            <StatItem label="Won" value={wins} />
            <StatItem label="Win Rate" value={winRate} />
            <StatItem label="Current Streak" value={currentStreak} highlight />
            <StatItem label="Longest Streak" value={longestStreak} />
            {bestTime !== null && (
              <StatItem label="Best Time" value={formatTime(bestTime)} />
            )}
            {averageAttempts > 0 && (
              <StatItem label="Avg Attempts" value={averageAttempts} />
            )}
            {perfectGames > 0 && (
              <StatItem label="Perfect Games" value={perfectGames} />
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const StatItem = ({ label, value, highlight = false }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${highlight ? 'text-wordle-correct' : 'text-foreground'}`}>
      {value}
    </div>
    <div className="text-xs text-text-muted uppercase">{label}</div>
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
    const log = getLearningLog();
    setWords(log.words);
    setFavorites(new Set(log.favorites));
    setStats(getLearningLogStats());
  };

  useEffect(() => {
    let filtered = [...words];
    
    if (gameFilter !== 'all') {
      filtered = filtered.filter(w => w.games.includes(gameFilter));
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
    const newStatus = toggleFavorite(word);
    setFavorites(prev => {
      const next = new Set(prev);
      if (newStatus) next.add(word);
      else next.delete(word);
      return next;
    });
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">📘 Learning Log</h2>
      
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-connections-blue/10 border border-connections-blue/30 rounded-xl p-4 text-center hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-connections-blue">{stats.totalWords}</div>
            <div className="text-sm text-text-muted">Words Learned</div>
          </div>
          <div className="bg-wordle-present/10 border border-wordle-present/30 rounded-xl p-4 text-center hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-wordle-present">{stats.favorites}</div>
            <div className="text-sm text-text-muted">Favorites</div>
          </div>
          {Object.entries(stats.byGame).slice(0, 2).map(([game, count]) => (
            <div key={game} className="bg-wordle-correct/10 border border-wordle-correct/30 rounded-xl p-4 text-center hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-wordle-correct">{count}</div>
              <div className="text-sm text-text-muted">{gameNames[game] || game}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wordle-correct/50 bg-card text-foreground"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
        </div>
        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="px-4 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wordle-correct/50 bg-card text-foreground"
        >
          <option value="all">All Games</option>
          {WORD_GAMES.map(g => (
            <option key={g} value={g}>{gameNames[g] || g}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${
            showFavoritesOnly ? 'bg-wordle-present text-black shadow-md' : 'bg-surface text-foreground border border-card-border hover:bg-surface-hover'
          }`}
        >
          ⭐ {showFavoritesOnly ? 'All' : 'Favorites'}
        </button>
      </div>

      {/* Word List */}
      <div className="space-y-3">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            {words.length === 0 ? (
              <>
                <div className="text-6xl mb-4">📚</div>
                <p className="text-lg font-semibold text-foreground">No words learned yet!</p>
                <p>Complete puzzles to build your vocabulary.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p>No words match your search.</p>
              </>
            )}
          </div>
        ) : (
          filteredWords.map((wordEntry) => (
            <div 
              key={wordEntry.word}
              className="bg-card border border-card-border rounded-xl p-4 hover:border-wordle-correct/50 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleFavorite(wordEntry.word)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {favorites.has(wordEntry.word) ? '⭐' : '☆'}
                  </button>
                  <div>
                    <span className="font-bold text-xl text-foreground">{wordEntry.word}</span>
                    {wordEntry.partOfSpeech && (
                      <span className="ml-2 text-sm text-text-muted italic">({wordEntry.partOfSpeech})</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {wordEntry.games.map(g => (
                    <span key={g} className="text-xs px-2 py-1 rounded-full bg-connections-blue/20 text-connections-blue">
                      {(gameNames[g] || g).slice(0, 4)}
                    </span>
                  ))}
                </div>
              </div>
              {wordEntry.definition ? (
                <p className="mt-2 text-text-muted">{wordEntry.definition}</p>
              ) : (
                <button
                  onClick={() => handleFetchDefinition(wordEntry.word)}
                  disabled={loadingDefinition === wordEntry.word}
                  className="mt-2 text-sm text-wordle-correct hover:underline disabled:opacity-50"
                >
                  {loadingDefinition === wordEntry.word ? '⏳ Loading...' : '📖 Get definition'}
                </button>
              )}
              <div className="mt-2 text-xs text-text-muted">
                Learned: {new Date(wordEntry.dateAdded).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Achievements Tab
const AchievementsTab = ({ unlockedAchievements, totalAchievements }) => {
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  
  const filteredAchievements = ACHIEVEMENTS.filter(achievement => {
    if (filter === 'unlocked') {
      return unlockedAchievements.some(a => a.id === achievement.id);
    }
    if (filter === 'locked') {
      return !unlockedAchievements.some(a => a.id === achievement.id);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Achievements ({unlockedAchievements.length}/{totalAchievements})
        </h2>
        
        <div className="flex gap-2">
          <FilterButton label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterButton label="Unlocked" active={filter === 'unlocked'} onClick={() => setFilter('unlocked')} />
          <FilterButton label="Locked" active={filter === 'locked'} onClick={() => setFilter('locked')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => {
          const unlockedData = unlockedAchievements.find(a => a.id === achievement.id);
          return (
            <AchievementBadge
              key={achievement.id}
              achievementId={achievement.id}
              unlocked={!!unlockedData}
              unlockedAt={unlockedData?.unlockedAt}
            />
          );
        })}
      </div>
    </div>
  );
};

const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-bold transition-all ${
      active
        ? 'bg-wordle-correct text-black shadow-md'
        : 'bg-surface text-foreground border border-card-border hover:bg-surface-hover'
    }`}
  >
    {label}
  </button>
);

// Feedback Tab
const FeedbackTab = () => {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">💬 Send Feedback</h2>
      
      <div className="bg-card rounded-xl p-6 shadow-md border border-card-border">
        <p className="text-text-muted mb-6">
          We value your feedback! Share your thoughts, report bugs, or suggest features to help us improve Ammar Times.
        </p>
        
        {/* Embedded Feedback Form */}
        <div className="max-w-2xl">
          <FeedbackForm 
            isOpen={showForm} 
            onClose={() => {}} 
            isFloating={false} 
          />
        </div>
      </div>
      
      <div className="bg-connections-blue/10 border border-connections-blue/30 rounded-xl p-6">
        <h3 className="font-bold text-connections-blue mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-text-muted space-y-2">
          <li>• Be specific about issues - include which game and what happened</li>
          <li>• Feature requests are always welcome!</li>
          <li>• We read every message and appreciate your time</li>
        </ul>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab = ({ settings, onReminderToggle }) => {
  const [profile, setProfile] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const userProfile = getProfile();
    setProfile(userProfile);
    setNewName(userProfile.name || '');
  }, []);

  const handleSaveName = () => {
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      setNameError('Name cannot be empty');
      return;
    }
    
    if (trimmedName.length > 50) {
      setNameError('Name must be 50 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmedName)) {
      setNameError('Name can only contain letters, numbers, spaces, hyphens, and apostrophes');
      return;
    }

    // Save name
    const updatedProfile = getProfile();
    updatedProfile.name = trimmedName;
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setEditingName(false);
    setNameError('');
    
    // Reload page to update name everywhere
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
      
      {/* Player Name Section */}
      <div className="bg-card rounded-xl p-6 shadow-md border border-card-border">
        <h3 className="text-lg font-bold text-foreground mb-4">Player Identity</h3>
        
        <div className="p-4 bg-surface rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-foreground">Display Name</div>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm text-wordle-correct hover:opacity-80"
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
                maxLength={50}
                className="w-full px-4 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wordle-correct/50 bg-card text-foreground"
              />
              <div className="text-sm text-text-muted">
                {newName.length}/50 characters
              </div>
              {nameError && (
                <div className="p-2 bg-connections-orange/20 text-connections-orange rounded text-sm border border-connections-orange/30">
                  {nameError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-wordle-correct text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(profile?.name || '');
                    setNameError('');
                  }}
                  className="px-4 py-2 bg-surface text-foreground border border-card-border rounded-lg hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-connections-blue">
              {profile?.name || 'Anonymous'}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-connections-purple/10 border border-connections-purple/30 rounded-lg">
          <p className="text-sm text-connections-purple">
            👤 <strong>Your name</strong> is displayed in your profile and visible to others in the admin dashboard.
          </p>
        </div>
      </div>
    
      <div className="bg-card rounded-xl p-6 shadow-md border border-card-border">
        <h3 className="text-lg font-bold text-foreground mb-4">Notifications</h3>
      
      <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
        <div>
          <div className="font-bold text-foreground">Daily Reminders</div>
          <div className="text-sm text-text-muted">
            Get notified when new puzzles are available
          </div>
        </div>
        <button
          onClick={onReminderToggle}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            settings.remindersEnabled ? 'bg-wordle-correct' : 'bg-card-border'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-card border-2 border-card-border shadow-md transition-transform ${
              settings.remindersEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-4 p-4 bg-connections-blue/10 border border-connections-blue/30 rounded-lg">
        <p className="text-sm text-connections-blue">
          💡 <strong>Note:</strong> Browser notifications require permission. 
          Enable them in your browser settings if you haven&apos;t already.
        </p>
      </div>
    </div>

    <div className="bg-card rounded-xl p-6 shadow-md border border-card-border">
      <h3 className="text-lg font-bold text-foreground mb-4">About</h3>
      <div className="space-y-2 text-sm text-text-muted">
        <p><strong>Platform:</strong> Ammar Times</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Storage:</strong> Local (Browser Storage)</p>
      </div>
    </div>
  </div>
);
// Feedback Tab
const FeedbackTab = () => {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-4">💬 Send Feedback</h2>
      
      <div className="bg-card rounded-xl p-6 shadow-md border border-card-border">
        <p className="text-text-muted mb-6">
          We value your feedback! Share your thoughts, report bugs, or suggest features to help us improve Ammar Times.
        </p>
        
        {/* Embedded Feedback Form */}
        <div className="max-w-2xl">
          <FeedbackForm 
            isOpen={showForm} 
            onClose={() => {}} 
            isFloating={false} 
          />
        </div>
      </div>
      
      <div className="bg-connections-blue/10 border border-connections-blue/30 rounded-xl p-6">
        <h3 className="font-bold text-connections-blue mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-text-muted space-y-2">
          <li>• Be specific about issues - include which game and what happened</li>
          <li>• Feature requests are always welcome!</li>
          <li>• We read every message and appreciate your time</li>
        </ul>
      </div>
    </div>
  );
};

// Helper function
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
}
