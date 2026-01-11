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
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';
import { addWordsToLog } from '@/utils/learningLogEngine';

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
  const [showLearningLog, setShowLearningLog] = useState(false);
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
      
      // Add all found words to Learning Log
      const allWords = [...gameState.wordsFound, ...gameState.bonusWordsFound];
      if (allWords.length > 0) {
        addWordsToLog(allWords, 'combinations');
      }
      
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
  const gameComplete = gameState.gameStatus === 'won';

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-up">
      <GameHeader
        title="Combinations"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={gameComplete}
      />

      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-2xl mx-auto w-full">
        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleModeSwitch('daily')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
              mode === 'daily'
                ? 'bg-wordle-correct text-white shadow-md'
                : 'bg-surface text-text-muted border border-card-border hover:bg-surface-hover'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => handleModeSwitch('unlimited')}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
              mode === 'unlimited'
                ? 'bg-wordle-correct text-white shadow-md'
                : 'bg-surface text-text-muted border border-card-border hover:bg-surface-hover'
            }`}
          >
            Unlimited
          </button>
        </div>

        {/* Score card */}
        <div className="w-full bg-card rounded-xl p-4 mb-4 border border-card-border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="text-center flex-1">
              <div className="text-xs text-text-muted uppercase tracking-wider">Score</div>
              <div className="text-3xl font-bold text-wordle-correct">{gameState.score}</div>
            </div>
            <div className="w-px h-12 bg-border-default"></div>
            <div className="text-center flex-1">
              <div className="text-xs text-text-muted uppercase tracking-wider">Target</div>
              <div className="text-3xl font-bold text-foreground">{puzzle.targetScore}</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                gameComplete ? 'bg-wordle-correct' : 'bg-gradient-to-r from-wordle-present to-wordle-correct'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {gameComplete && (
            <div className="text-center mt-2 text-wordle-correct font-semibold text-sm animate-pulse">
              🎉 Target Reached! Keep playing for bonus points!
            </div>
          )}
        </div>

        {/* Current word preview */}
        <div className="w-full bg-card rounded-xl p-6 mb-4 border border-card-border shadow-sm min-h-24 flex flex-col items-center justify-center">
          {currentWord ? (
            <div className="text-center animate-fade-in">
              <div className="text-4xl font-bold text-foreground tracking-wider mb-2">
                {currentWord.toUpperCase()}
              </div>
              <div className="inline-block px-3 py-1 bg-wordle-correct/20 text-wordle-correct rounded-full text-sm font-semibold">
                +{previewScore} points
              </div>
            </div>
          ) : (
            <div className="text-text-muted text-center">
              <p className="text-lg">Select fragments to build a word</p>
              <p className="text-sm mt-1">Combine 2+ fragments</p>
            </div>
          )}
        </div>

        {/* Fragment selector */}
        <div className="w-full bg-card rounded-xl p-4 mb-4 border border-card-border shadow-sm">
          <FragmentSelector
            fragments={puzzle.fragments}
            selectedIndices={gameState.currentSelection}
            onFragmentClick={handleFragmentClick}
            disabled={false}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full mb-4">
          <button
            onClick={handleClearSelection}
            disabled={gameState.currentSelection.length === 0}
            className="flex-1 py-3 bg-surface text-foreground border border-card-border rounded-lg font-bold transition-all hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            onClick={handleSubmitWord}
            disabled={gameState.currentSelection.length < 2}
            className="flex-1 py-3 bg-wordle-correct text-white rounded-lg font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Word
          </button>
        </div>

        {/* Words found section */}
        <div className="w-full bg-card rounded-xl p-4 border border-card-border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Words Found
            </h3>
            <span className="text-xs bg-surface px-2 py-1 rounded-full text-text-muted">
              {gameState.wordsFound.length} words
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {gameState.wordsFound.length > 0 ? (
              gameState.wordsFound.map((word, idx) => {
                const isBonus = puzzle.bonusWords.map(w => w.toLowerCase()).includes(word);
                const isJustAdded = word === justSubmittedWord;
                return (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isBonus
                        ? 'bg-wordle-present/20 text-wordle-present border border-wordle-present/40'
                        : 'bg-surface text-foreground border border-card-border'
                    } ${isJustAdded ? 'animate-bounce scale-105' : ''}`}
                  >
                    {word.toUpperCase()}
                    {isBonus && ' ⭐'}
                  </span>
                );
              })
            ) : (
              <span className="text-text-muted text-sm py-4 w-full text-center">
                No words found yet. Start combining fragments!
              </span>
            )}
          </div>

          {/* Bonus words hint */}
          {puzzle.bonusWords && puzzle.bonusWords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-default text-center">
              <span className="text-xs text-text-muted">
                ⭐ {gameState.bonusWordsFound?.length || 0} / {puzzle.bonusWords.length} bonus words
              </span>
            </div>
          )}
        </div>

        {/* Stats summary */}
        {gameState.maxComboLength > 0 && (
          <div className="mt-3 text-center text-sm text-text-muted">
            Best combo: <span className="font-semibold text-connections-orange">{gameState.maxComboLength} fragments</span> 🔥
          </div>
        )}

        {/* New game button for unlimited mode */}
        {mode === 'unlimited' && gameComplete && (
          <button
            onClick={handleNewGame}
            className="mt-4 px-8 py-3 bg-wordle-correct text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
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
      <UnifiedHowToPlay 
        gameName="combinations" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="combinations"
      />

      {/* Statistics Modal */}
      {showStats && stats && (
        <StatisticsModal
          gameName="combinations"
          stats={stats}
          isOpen={showStats}
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
