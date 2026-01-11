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
import { ACHIEVEMENTS } from '@/utils/achievementsEngine';
import { requestNotificationPermission, initNotifications } from '@/utils/notificationManager';
import AchievementBadge from '@/components/AchievementBadge';
import SiteHeader from '@/components/SiteHeader';

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
  const [activeTab, setActiveTab] = useState('overview'); // overview, stats, achievements, settings

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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {profile.name ? `${profile.name}'s Profile` : 'Your Profile'}
              </h1>
              <p className="text-blue-100">
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
            color="bg-blue-50 border-blue-200" 
          />
          <StatCard 
            icon="🏆" 
            value={totalWins} 
            label="Total Wins" 
            color="bg-green-50 border-green-200" 
          />
          <StatCard 
            icon="🔥" 
            value={bestCurrentStreak} 
            label="Best Current Streak" 
            color="bg-orange-50 border-orange-200" 
          />
          <StatCard 
            icon="⭐" 
            value={totalAchievements} 
            label={`Achievements (${achievementProgress}%)`} 
            color="bg-yellow-50 border-yellow-200" 
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border-default">
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
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'stats' && <StatsTab stats={stats} />}
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
      </div>
    </div>
  );
}

// Quick Stat Card Component
const StatCard = ({ icon, value, label, color }) => (
  <div className={`${color} border-2 rounded-xl p-6 text-center`}>
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

// Tab Button Component
const TabButton = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-bold transition-colors relative ${
      active
        ? 'border-b-4 border-blue-500 text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
      <GameSummaryCard gameName="Wordle" stats={stats.wordle} icon="📝" color="from-green-400 to-emerald-500" />
      <GameSummaryCard gameName="Connections" stats={stats.connections} icon="🔗" color="from-blue-400 to-cyan-500" />
      <GameSummaryCard gameName="Crossword" stats={stats.crossword} icon="🧩" color="from-purple-400 to-pink-500" />
      <GameSummaryCard gameName="Waffle" stats={stats.waffle} icon="🧇" color="from-amber-400 to-orange-500" />
      <GameSummaryCard gameName="Combinations" stats={stats.combinations} icon="🧩" color="from-teal-400 to-cyan-500" />
      <GameSummaryCard gameName="Numbers" stats={stats.numbers} icon="🔢" color="from-orange-400 to-red-500" />
      <GameSummaryCard gameName="Trivia" stats={stats.trivia} icon="🎓" color="from-yellow-400 to-amber-500" />
      <GameSummaryCard gameName="Strands" stats={stats.strands} icon="🧵" color="from-indigo-400 to-blue-500" />
      {stats.spelling && (
        <GameSummaryCard gameName="Spelling" stats={stats.spelling} icon="🐝" color="from-yellow-400 to-orange-500" />
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
      <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white hover:opacity-90 transition-opacity cursor-pointer shadow-lg`}>
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
        <div key={gameName} className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100">
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
    <div className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
      {value}
    </div>
    <div className="text-xs text-gray-500 uppercase">{label}</div>
  </div>
);

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
    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

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
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100">
        <h3 className="text-lg font-bold text-foreground mb-4">Player Identity</h3>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-foreground">Display Name</div>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm text-blue-500 hover:text-blue-700"
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
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <div className="text-sm text-gray-500">
                {newName.length}/50 characters
              </div>
              {nameError && (
                <div className="p-2 bg-red-100 text-red-800 rounded text-sm">
                  {nameError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewName(profile?.name || '');
                    setNameError('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-blue-600">
              {profile?.name || 'Anonymous'}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            👤 <strong>Your name</strong> is displayed in your profile and visible to others in the admin dashboard.
          </p>
        </div>
      </div>
    
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100">
        <h3 className="text-lg font-bold text-foreground mb-4">Notifications</h3>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="font-bold text-foreground">Daily Reminders</div>
          <div className="text-sm text-gray-500">
            Get notified when new puzzles are available
          </div>
        </div>
        <button
          onClick={onReminderToggle}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            settings.remindersEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              settings.remindersEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Note:</strong> Browser notifications require permission. 
          Enable them in your browser settings if you haven&apos;t already.
        </p>
      </div>
    </div>

    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100">
      <h3 className="text-lg font-bold text-foreground mb-4">About</h3>
      <div className="space-y-2 text-sm text-gray-600">
        <p><strong>Platform:</strong> Ammar Times</p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Storage:</strong> Local (Browser Storage)</p>
      </div>
    </div>
  </div>
);
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
