'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import {
  getTodaysWords,
  getSavedWords,
  searchWords,
  toggleFavorite,
  isFavorite,
  fetchDefinition,
  getLearningLogStats,
  WORD_GAMES,
  performDailyCleanup,
} from '@/utils/learningLogEngine';

/**
 * LearningLogModal - Daily, Intentional Learning Log
 * 
 * Features:
 * - Today tab: Temporary words that expire at end of day
 * - Saved tab: Permanent favorites that persist
 * - Clear distinction between temporary and permanent
 * - Favoriting is explicit and intentional
 */
const LearningLogModal = ({ isOpen, onClose, gameName }) => {
  const [todaysWords, setTodaysWords] = useState([]);
  const [savedWords, setSavedWords] = useState([]);
  const [filteredToday, setFilteredToday] = useState([]);
  const [filteredSaved, setFilteredSaved] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'saved'
  const [gameFilter, setGameFilter] = useState(gameName || 'all');
  const [loadingDefinitions, setLoadingDefinitions] = useState(new Set());
  const [stats, setStats] = useState(null);

  // Get today's date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filter words based on search and game
  const filterWords = useCallback((wordList, query, game) => {
    let filtered = [...wordList];

    // Apply game filter
    if (game !== 'all') {
      filtered = filtered.filter(w => w.game === game);
    }

    // Apply search filter
    if (query.trim()) {
      const normalizedQuery = query.toUpperCase().trim();
      filtered = filtered.filter(w =>
        w.word.includes(normalizedQuery) ||
        (w.definition && w.definition.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    return filtered;
  }, []);

  const loadWords = useCallback(() => {
    performDailyCleanup();
    
    const today = getTodaysWords();
    const saved = getSavedWords();
    
    setTodaysWords(today);
    setSavedWords(saved);
    setStats(getLearningLogStats());
    
    setFilteredToday(filterWords(today, searchQuery, gameFilter));
    setFilteredSaved(filterWords(saved, searchQuery, gameFilter));
  }, [searchQuery, gameFilter, filterWords]);

  // Load words on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWords();
    }
  }, [isOpen, loadWords]);

  // Re-filter when search or filter change
  useEffect(() => {
    setFilteredToday(filterWords(todaysWords, searchQuery, gameFilter));
    setFilteredSaved(filterWords(savedWords, searchQuery, gameFilter));
  }, [todaysWords, savedWords, searchQuery, gameFilter, filterWords]);

  // Auto-fetch definitions for words without them (up to 3 at a time)
  useEffect(() => {
    if (!isOpen) return;

    const allWords = activeTab === 'today' ? filteredToday : filteredSaved;
    const wordsNeedingDefinitions = allWords
      .filter(w => !w.definition && !loadingDefinitions.has(w.word))
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
  }, [isOpen, filteredToday, filteredSaved, activeTab, loadingDefinitions, loadWords]);

  // Handle favorite toggle
  const handleToggleFavorite = (word) => {
    toggleFavorite(word);
    loadWords(); // Reload to move between sections
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
      title="📚 Learning Log"
      wide
    >
      <div className="space-y-4">
        {/* Tab Navigation - Two tabs only: Today and Saved */}
        <div className="flex gap-1 p-1 bg-surface rounded-lg">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-wordle-correct text-white shadow-sm'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
          >
            📅 Today ({todaysWords.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-wordle-present text-black shadow-sm'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
          >
            ⭐ Saved Words ({savedWords.length})
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
          {activeTab === 'today' ? (
            // Today's words - temporary section
            filteredToday.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <div className="text-4xl mb-2">📅</div>
                <p className="font-semibold">No words today yet!</p>
                <p className="text-sm">Complete puzzles to add words to your daily workspace.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-600 mb-2">
                  💡 These words will disappear at the end of the day unless you save them with ⭐
                </div>
                {filteredToday.map((wordEntry) => (
                  <WordCard
                    key={wordEntry.word}
                    wordEntry={wordEntry}
                    isFavorited={isFavorite(wordEntry.word)}
                    onToggleFavorite={() => handleToggleFavorite(wordEntry.word)}
                    onFetchDefinition={() => handleFetchDefinition(wordEntry.word)}
                    isLoadingDefinition={loadingDefinitions.has(wordEntry.word)}
                    gameNames={gameNames}
                    isTemporary={true}
                  />
                ))}
              </>
            )
          ) : (
            // Saved words - permanent section
            filteredSaved.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <div className="text-4xl mb-2">⭐</div>
                <p className="font-semibold">No saved words yet!</p>
                <p className="text-sm">Star words in Today&apos;s section to keep them forever.</p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-700 mb-2">
                  ⭐ These are your permanent vocabulary words. They&apos;ll never disappear!
                </div>
                {filteredSaved.map((wordEntry) => (
                  <WordCard
                    key={wordEntry.word}
                    wordEntry={wordEntry}
                    isFavorited={isFavorite(wordEntry.word)}
                    onToggleFavorite={() => handleToggleFavorite(wordEntry.word)}
                    onFetchDefinition={() => handleFetchDefinition(wordEntry.word)}
                    isLoadingDefinition={loadingDefinitions.has(wordEntry.word)}
                    gameNames={gameNames}
                    isTemporary={false}
                  />
                ))}
              </>
            )
          )}
        </div>

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
  isTemporary,
}) => {
  return (
    <div className={`border rounded-lg p-3 transition-all ${
      isTemporary
        ? 'border-blue-300/50 bg-blue-50/30 hover:border-blue-400/70'
        : 'border-yellow-300/50 bg-yellow-50/30 hover:border-yellow-400/70'
    }`}>
      <div className="flex items-center justify-between gap-2">
        {/* Word and favorite */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleFavorite}
            className={`text-xl hover:scale-110 transition-transform flex-shrink-0 ${
              isFavorited ? 'animate-pulse' : ''
            }`}
            title={isFavorited ? 'Unsave word' : 'Save word to permanent collection'}
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

        {/* Game badge */}
        <div className="flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-connections-blue/20 text-connections-blue">
            {(gameNames[wordEntry.game] || wordEntry.game).slice(0, 3)}
          </span>
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

      {/* Date and status */}
      <div className="mt-2 text-xs text-text-muted flex items-center justify-between">
        <span>
          {new Date(wordEntry.dateAdded).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: wordEntry.dateAdded.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined
          })}
        </span>
        {isTemporary && !isFavorited && (
          <span className="text-xs text-blue-600">⏰ Expires end of day</span>
        )}
      </div>
    </div>
  );
};

export default LearningLogModal;

