'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import {
  getLearningLog,
  getWordsByGame,
  searchWords,
  toggleFavorite,
  isFavorite,
  fetchDefinition,
  getLearningLogStats,
  getWordsByDate,
  WORD_GAMES,
} from '@/utils/learningLogEngine';

/**
 * LearningLogModal - Modal to view and manage learned words
 * 
 * Features:
 * - Today's Words tab (words from current day)
 * - Favorites tab (starred words that persist)
 * - All Words tab
 * - Auto-fetch definitions
 * - Search and filter
 */
const LearningLogModal = ({ isOpen, onClose, gameName }) => {
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'favorites', 'all'
  const [gameFilter, setGameFilter] = useState(gameName || 'all');
  const [favorites, setFavorites] = useState(new Set());
  const [loadingDefinitions, setLoadingDefinitions] = useState(new Set());
  const [stats, setStats] = useState(null);

  // Get today's date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filter words based on tab, search, and game
  const filterWords = useCallback((wordList, query, game, tab, favSet) => {
    let filtered = [...wordList];
    
    // Apply tab filter
    if (tab === 'today') {
      const today = getTodayDateString();
      filtered = filtered.filter(w => w.dateAdded.startsWith(today));
    } else if (tab === 'favorites') {
      filtered = filtered.filter(w => favSet.has(w.word));
    }
    
    // Apply game filter
    if (game !== 'all') {
      filtered = filtered.filter(w => w.games.includes(game));
    }
    
    // Apply search filter
    if (query.trim()) {
      const normalizedQuery = query.toUpperCase().trim();
      filtered = filtered.filter(w => 
        w.word.includes(normalizedQuery) ||
        (w.definition && w.definition.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Sort: favorites first (if not on favorites tab), then by date (newest first)
    filtered.sort((a, b) => {
      if (tab !== 'favorites') {
        const aFav = favSet.has(a.word);
        const bFav = favSet.has(b.word);
        if (aFav !== bFav) return bFav - aFav;
      }
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
    
    setFilteredWords(filtered);
  }, []);

  const loadWords = useCallback(() => {
    const log = getLearningLog();
    setWords(log.words);
    setFavorites(new Set(log.favorites));
    setStats(getLearningLogStats());
    filterWords(log.words, searchQuery, gameFilter, activeTab, new Set(log.favorites));
  }, [searchQuery, gameFilter, activeTab, filterWords]);

  // Load words on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWords();
    }
  }, [isOpen, loadWords]);

  // Re-filter when search, filter, or tab change
  useEffect(() => {
    filterWords(words, searchQuery, gameFilter, activeTab, favorites);
  }, [words, searchQuery, gameFilter, activeTab, favorites, filterWords]);

  // Auto-fetch definitions for words without them (up to 3 at a time)
  useEffect(() => {
    if (!isOpen || filteredWords.length === 0) return;
    
    const wordsNeedingDefinitions = filteredWords
      .filter(w => !w.definition && !w.definitionFetched && !loadingDefinitions.has(w.word))
      .slice(0, 3);
    
    if (wordsNeedingDefinitions.length === 0) return;
    
    wordsNeedingDefinitions.forEach(async (wordEntry) => {
      setLoadingDefinitions(prev => new Set([...prev, wordEntry.word]));
      try {
        await fetchDefinition(wordEntry.word);
        loadWords(); // Reload to get updated definition
      } catch (error) {
        console.error('Error auto-fetching definition:', error);
      } finally {
        setLoadingDefinitions(prev => {
          const next = new Set(prev);
          next.delete(wordEntry.word);
          return next;
        });
      }
    });
  }, [isOpen, filteredWords, loadingDefinitions, loadWords]);

  // Handle favorite toggle
  const handleToggleFavorite = (word) => {
    const newFavoriteStatus = toggleFavorite(word);
    setFavorites(prev => {
      const next = new Set(prev);
      if (newFavoriteStatus) {
        next.add(word);
      } else {
        next.delete(word);
      }
      return next;
    });
  };

  // Handle manual definition fetch
  const handleFetchDefinition = async (word) => {
    if (loadingDefinitions.has(word)) return;
    
    setLoadingDefinitions(prev => new Set([...prev, word]));
    try {
      await fetchDefinition(word);
      loadWords();
    } catch (error) {
      console.error('Error fetching definition:', error);
    } finally {
      setLoadingDefinitions(prev => {
        const next = new Set(prev);
        next.delete(word);
        return next;
      });
    }
  };

  // Count words for each tab
  const todayCount = words.filter(w => w.dateAdded.startsWith(getTodayDateString())).length;
  const favoritesCount = favorites.size;
  const allCount = words.length;

  // Game display names
  const gameNames = {
    wordle: 'Wordle',
    connections: 'Connections',
    strands: 'Strands',
    crossword: 'Crossword',
    waffle: 'Waffle',
    combinations: 'Combinations',
    spelling: 'Spelling Bee',
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="📘 Learning Log"
      wide
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-surface rounded-lg">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-wordle-correct text-white shadow-sm'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
          >
            📅 Today ({todayCount})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'favorites'
                ? 'bg-wordle-present text-black shadow-sm'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
          >
            ⭐ Favorites ({favoritesCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-connections-purple text-white shadow-sm'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
          >
            📚 All ({allCount})
          </button>
        </div>

        {/* Search and Game Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wordle-correct/50 bg-card text-foreground"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              🔍
            </span>
          </div>

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="px-4 py-2 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wordle-correct/50 bg-card text-foreground"
          >
            <option value="all">All Games</option>
            {WORD_GAMES.map(game => (
              <option key={game} value={game}>{gameNames[game] || game}</option>
            ))}
          </select>
        </div>

        {/* Word List */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {filteredWords.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              {activeTab === 'today' && todayCount === 0 ? (
                <>
                  <div className="text-4xl mb-2">📅</div>
                  <p className="font-semibold">No words learned today yet!</p>
                  <p className="text-sm">Complete puzzles to add words to your daily log.</p>
                </>
              ) : activeTab === 'favorites' && favoritesCount === 0 ? (
                <>
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="font-semibold">No favorites yet!</p>
                  <p className="text-sm">Star words you want to remember forever.</p>
                </>
              ) : words.length === 0 ? (
                <>
                  <div className="text-4xl mb-2">📚</div>
                  <p className="font-semibold">No words learned yet!</p>
                  <p className="text-sm">Complete puzzles to add words to your log.</p>
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
              <WordCard
                key={wordEntry.word}
                wordEntry={wordEntry}
                isFavorited={favorites.has(wordEntry.word)}
                onToggleFavorite={() => handleToggleFavorite(wordEntry.word)}
                onFetchDefinition={() => handleFetchDefinition(wordEntry.word)}
                isLoadingDefinition={loadingDefinitions.has(wordEntry.word)}
                gameNames={gameNames}
              />
            ))
          )}
        </div>

        {/* Info for favorites tab */}
        {activeTab === 'favorites' && favoritesCount > 0 && (
          <div className="text-center text-xs text-text-muted bg-wordle-present/10 rounded-lg p-2">
            ⭐ Favorites are saved permanently and won&apos;t be cleared
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-wordle-correct text-white rounded-lg hover:opacity-90 transition-all font-bold"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

/**
 * WordCard - Individual word entry in the learning log
 */
const WordCard = ({ 
  wordEntry, 
  isFavorited, 
  onToggleFavorite, 
  onFetchDefinition, 
  isLoadingDefinition,
  gameNames,
}) => {
  return (
    <div className="border border-card-border rounded-lg p-3 bg-card hover:border-wordle-correct/50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        {/* Word and favorite */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleFavorite}
            className="text-xl hover:scale-110 transition-transform flex-shrink-0"
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '⭐' : '☆'}
          </button>
          <div className="min-w-0">
            <span className="font-bold text-lg text-foreground">{wordEntry.word}</span>
            {wordEntry.partOfSpeech && (
              <span className="ml-2 text-xs text-text-muted italic">
                ({wordEntry.partOfSpeech})
              </span>
            )}
          </div>
        </div>

        {/* Game badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {wordEntry.games.slice(0, 2).map(game => (
            <span
              key={game}
              className="text-xs px-2 py-0.5 rounded-full bg-connections-blue/20 text-connections-blue"
              title={gameNames[game] || game}
            >
              {(gameNames[game] || game).slice(0, 3)}
            </span>
          ))}
          {wordEntry.games.length > 2 && (
            <span className="text-xs text-text-muted">
              +{wordEntry.games.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Definition section */}
      {wordEntry.definition ? (
        <div className="mt-2 text-sm text-text-muted leading-relaxed">
          {wordEntry.definition}
        </div>
      ) : isLoadingDefinition ? (
        <div className="mt-2 text-xs text-wordle-present animate-pulse">
          ⏳ Loading definition...
        </div>
      ) : (
        <button
          onClick={onFetchDefinition}
          className="mt-2 text-xs text-wordle-correct hover:underline"
        >
          📖 Get definition
        </button>
      )}

      {/* Date - smaller on same line */}
      <div className="mt-2 text-xs text-text-muted">
        {new Date(wordEntry.dateAdded).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: wordEntry.dateAdded.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined
        })}
      </div>
    </div>
  );
};

export default LearningLogModal;
