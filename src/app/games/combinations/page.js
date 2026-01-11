'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getTodaysPuzzle,
  getRandomPuzzle,
  loadGameState,
  saveGameState,
  initializeGame,
  toggleFragment,
  clearSelection,
  submitWord,
  buildWord,
  calculateWordScore,
  generateShareText,
} from './combinationsLogic';
import FragmentSelector from '@/components/FragmentSelector';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import GameHeader from '@/components/GameHeader';
import HowToPlay from '@/components/HowToPlay';
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';

export default function CombinationsPage() {
  const [mode, setMode] = useState('daily'); // 'daily' | 'unlimited'
  const [puzzle, setPuzzle] = useState(() => getTodaysPuzzle());
  const [gameState, setGameState] = useState(() => {
    const currentPuzzle = getTodaysPuzzle();
    const savedState = loadGameState();
    if (savedState && savedState.date === currentPuzzle.date) {
      return savedState;
    }
    return initializeGame(currentPuzzle);
  });
  const [toast, setToast] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [justSubmittedWord, setJustSubmittedWord] = useState(null);

  // Load stats on mount
  useEffect(() => {
    const gameStats = getGameStats('combinations');
    setStats(gameStats);
    trackGameStart('combinations');
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (gameState && mode === 'daily') {
      saveGameState(gameState);
    }
  }, [gameState, mode]);

  // Handle game won
  useEffect(() => {
    if (gameState.gameStatus === 'won' && mode === 'daily') {
      const result = {
        date: getTodayString(),
        win: true,
        score: gameState.score,
        wordsFound: gameState.wordsFound.length,
        bonusWordsFound: gameState.bonusWordsFound.length,
        maxComboLength: gameState.maxComboLength,
        puzzleId: `combinations-${puzzle.date}`,
      };
      
      const achievements = recordGameResult('combinations', result);
      trackGameEnd('combinations', result);
      const updatedStats = getGameStats('combinations');
      setStats(updatedStats);
      
      if (achievements && achievements.length > 0) {
        setNewAchievements(achievements);
        setCurrentAchievementIndex(0);
      }
      
      setTimeout(() => setShowResultModal(true), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus]);

  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleToastExit = useCallback(() => {
    setToast(null);
  }, []);

  const handleFragmentClick = useCallback((index) => {
    setGameState(prev => toggleFragment(prev, index));
  }, []);

  const handleClearSelection = useCallback(() => {
    setGameState(prev => clearSelection(prev));
  }, []);

  const handleSubmitWord = useCallback(() => {
    const newState = submitWord(gameState, puzzle);
    
    if (newState.error) {
      showToast(`❌ ${newState.error}`, 'error');
    } else if (newState.lastWord) {
      const isBonus = puzzle.bonusWords.map(w => w.toLowerCase()).includes(newState.lastWord);
      if (isBonus) {
        showToast(`⭐ ${newState.lastWord.toUpperCase()} +${newState.lastWordScore} (Bonus!)`, 'success');
      } else {
        showToast(`✓ ${newState.lastWord.toUpperCase()} +${newState.lastWordScore}`, 'success');
      }
      setJustSubmittedWord(newState.lastWord);
      setTimeout(() => setJustSubmittedWord(null), 1500);
    }
    
    setGameState(newState);
  }, [gameState, puzzle, showToast]);

  const handleNewGame = useCallback(() => {
    if (mode === 'daily') {
      const todaysPuzzle = getTodaysPuzzle();
      setPuzzle(todaysPuzzle);
      setGameState(initializeGame(todaysPuzzle));
    } else {
      const randomPuzzle = getRandomPuzzle();
      setPuzzle(randomPuzzle);
      setGameState(initializeGame(randomPuzzle));
    }
    setShowResultModal(false);
  }, [mode]);

  const handleModeSwitch = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'daily') {
      const todaysPuzzle = getTodaysPuzzle();
      const savedState = loadGameState();
      if (savedState && savedState.date === todaysPuzzle.date) {
        setGameState(savedState);
      } else {
        setGameState(initializeGame(todaysPuzzle));
      }
      setPuzzle(todaysPuzzle);
    } else {
      const randomPuzzle = getRandomPuzzle();
      setPuzzle(randomPuzzle);
      setGameState(initializeGame(randomPuzzle));
    }
    setShowResultModal(false);
  }, []);

  const handleAchievementDismiss = useCallback(() => {
    if (currentAchievementIndex < newAchievements.length - 1) {
      setCurrentAchievementIndex(prev => prev + 1);
    } else {
      setNewAchievements([]);
      setCurrentAchievementIndex(0);
    }
  }, [currentAchievementIndex, newAchievements.length]);

  // Build current word preview
  const currentWord = buildWord(gameState.fragments, gameState.currentSelection);
  const previewScore = gameState.currentSelection.length > 0 
    ? calculateWordScore(gameState.currentSelection.length) 
    : 0;

  // Progress percentage
  const progressPercent = Math.min(100, (gameState.score / puzzle.targetScore) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader
        title="Combinations"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
      />

      <main className="flex-1 flex flex-col items-center px-4 py-6">
        {/* Mode selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleModeSwitch('daily')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'daily'
                ? 'bg-wordle-correct text-white'
                : 'bg-surface-secondary text-foreground hover:bg-surface-hover'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => handleModeSwitch('unlimited')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'unlimited'
                ? 'bg-wordle-correct text-white'
                : 'bg-surface-secondary text-foreground hover:bg-surface-hover'
            }`}
          >
            Unlimited
          </button>
        </div>

        {/* Score display */}
        <div className="w-full max-w-md mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-foreground">
              Score: {gameState.score}
            </span>
            <span className="text-lg font-bold text-text-muted">
              Target: {puzzle.targetScore}
            </span>
          </div>
          <div className="w-full h-4 bg-surface-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                gameState.gameStatus === 'won' ? 'bg-wordle-correct' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {gameState.gameStatus === 'won' && (
            <div className="text-center mt-2 text-wordle-correct font-bold">
              🎉 Target Reached! Keep playing for bonus points!
            </div>
          )}
        </div>

        {/* Current word preview */}
        <div className="mb-6 min-h-20 flex flex-col items-center justify-center">
          {currentWord && (
            <div className="text-center animate-fade-in">
              <div className="text-3xl font-bold text-foreground mb-1">
                {currentWord.toUpperCase()}
              </div>
              <div className="text-text-muted">
                +{previewScore} points
              </div>
            </div>
          )}
          {!currentWord && (
            <div className="text-text-muted text-center">
              Select fragments to build a word
            </div>
          )}
        </div>

        {/* Fragment selector */}
        <div className="mb-6">
          <FragmentSelector
            fragments={puzzle.fragments}
            selectedIndices={gameState.currentSelection}
            onFragmentClick={handleFragmentClick}
            disabled={false}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleClearSelection}
            disabled={gameState.currentSelection.length === 0}
            className="px-6 py-3 bg-surface-secondary text-foreground rounded-lg font-bold hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            onClick={handleSubmitWord}
            disabled={gameState.currentSelection.length < 2}
            className="px-6 py-3 bg-wordle-correct text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Word
          </button>
        </div>

        {/* Words found */}
        <div className="w-full max-w-md">
          <h3 className="text-lg font-bold text-foreground mb-3">
            Words Found ({gameState.wordsFound.length})
          </h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {gameState.wordsFound.map((word, idx) => {
              const isBonus = puzzle.bonusWords.map(w => w.toLowerCase()).includes(word);
              const isJustAdded = word === justSubmittedWord;
              return (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    isBonus
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-surface-secondary text-foreground'
                  } ${isJustAdded ? 'animate-pulse scale-110' : ''}`}
                >
                  {word.toUpperCase()}
                  {isBonus && ' ⭐'}
                </span>
              );
            })}
            {gameState.wordsFound.length === 0 && (
              <span className="text-text-muted text-sm">No words found yet</span>
            )}
          </div>
        </div>

        {/* Bonus words hint */}
        {puzzle.bonusWords.length > 0 && (
          <div className="mt-4 text-center text-sm text-text-muted">
            {gameState.bonusWordsFound.length} / {puzzle.bonusWords.length} bonus words found
          </div>
        )}

        {/* Stats summary */}
        {gameState.maxComboLength > 0 && (
          <div className="mt-4 text-center text-sm text-text-muted">
            Best combo: {gameState.maxComboLength} fragments 🔥
          </div>
        )}

        {/* New game button for unlimited mode */}
        {mode === 'unlimited' && (
          <button
            onClick={handleNewGame}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            New Puzzle
          </button>
        )}
      </main>

      {/* Result Modal */}
      {showResultModal && gameState.gameStatus === 'won' && (
        <Modal onClose={() => setShowResultModal(false)}>
          <div className="text-center p-6">
            <h2 className="text-3xl font-bold mb-4">🎉 Target Reached!</h2>
            
            <div className="mb-6 space-y-2">
              <p className="text-lg">
                Final Score: <span className="font-bold text-wordle-correct">{gameState.score}</span>
              </p>
              <p className="text-lg">
                Words Found: <span className="font-bold">{gameState.wordsFound.length}</span>
              </p>
              {gameState.bonusWordsFound.length > 0 && (
                <p className="text-lg">
                  Bonus Words: <span className="font-bold text-yellow-500">{gameState.bonusWordsFound.length}</span>
                </p>
              )}
              {gameState.maxComboLength >= 3 && (
                <p className="text-lg">
                  Best Combo: <span className="font-bold">{gameState.maxComboLength} fragments 🔥</span>
                </p>
              )}
            </div>

            {mode === 'daily' && (
              <div className="mb-6">
                <ShareResults
                  gameName="combinations"
                  result={{
                    score: gameState.score,
                    wordsFound: gameState.wordsFound.length,
                    bonusWordsFound: gameState.bonusWordsFound.length,
                    maxComboLength: gameState.maxComboLength,
                  }}
                  puzzleNumber={puzzle.date}
                />
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {mode === 'unlimited' && (
                <button
                  onClick={handleNewGame}
                  className="px-6 py-3 bg-wordle-correct text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  Play Again
                </button>
              )}
              <button
                onClick={() => setShowResultModal(false)}
                className="px-6 py-3 bg-surface-secondary text-foreground rounded-lg font-bold hover:bg-surface-hover transition-colors"
              >
                Keep Playing
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <HowToPlay
          gameName="Combinations"
          onClose={() => setShowHowToPlay(false)}
        >
          <div className="space-y-4 text-text-muted">
            <p>Combine word fragments to build valid English words and reach the target score!</p>
            
            <h3 className="font-bold text-foreground">How to Play:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Tap fragments to select them in order</li>
              <li>Selected fragments combine to form a word</li>
              <li>Press Submit to score the word</li>
              <li>Reach the target score to win!</li>
            </ul>

            <h3 className="font-bold text-foreground">Scoring:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>2 fragments: 10 + 15 = 25 points</li>
              <li>3 fragments: 10 + 15 + 22 = 47 points</li>
              <li>Longer chains = More points!</li>
              <li>Bonus words: +25 extra points ⭐</li>
            </ul>

            <h3 className="font-bold text-foreground">Tips:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Look for common word patterns</li>
              <li>Try different fragment combinations</li>
              <li>Hunt for bonus words for extra points</li>
            </ul>
          </div>
        </HowToPlay>
      )}

      {/* Statistics Modal */}
      {showStats && stats && (
        <StatisticsModal
          gameName="Combinations"
          stats={stats}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Achievement Notification */}
      {newAchievements.length > 0 && newAchievements[currentAchievementIndex] && (
        <AchievementNotification
          achievement={newAchievements[currentAchievementIndex]}
          onDismiss={handleAchievementDismiss}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onExited={handleToastExit}
        />
      )}

      {/* Daily Reminder */}
      <DailyReminder />

      {/* Back link */}
      <div className="text-center py-4">
        <Link
          href="/games"
          className="text-text-muted hover:text-foreground transition-colors"
        >
          ← Back to Games
        </Link>
      </div>
    </div>
  );
}
