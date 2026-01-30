'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getTodaysPuzzle,
  getRandomPuzzle,
  loadGameState,
  saveGameState,
  initializeGame,
  canSelectCell,
  canSwap,
  performSwap,
  isPerfectSolve,
  generateShareText,
  calculateMinimumMoves,
} from './waffleLogic';
import WaffleGrid from '@/components/WaffleGrid';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import GameHeader from '@/components/GameHeader';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import BadgeToastQueue from '@/components/BadgeToastQueue';
import BadgeDetailsSheet from '@/components/BadgeDetailsSheet';
import BadgeEarnedRecap from '@/components/BadgeEarnedRecap';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import BadgesDrawer from '@/components/BadgesDrawer';
import DailyReminder from '@/components/DailyReminder';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';

export default function WafflePage() {
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
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgesDrawer, setShowBadgesDrawer] = useState(false);

  // Load stats on mount
  useEffect(() => {
    const gameStats = getGameStats('waffle');
    setStats(gameStats);
    trackGameStart('waffle');
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (gameState && mode === 'daily') {
      saveGameState(gameState);
    }
  }, [gameState, mode]);

  // Show result modal when game ends
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') {
      const won = gameState.gameStatus === 'won';
      const perfect = isPerfectSolve(gameState, puzzle);
      
      if (mode === 'daily') {
        const result = {
          date: getTodayString(),
          win: won,
          attempts: gameState.movesUsed,
          perfect,
          puzzleId: `waffle-${puzzle.date}`,
          swaps: gameState.movesUsed,
          maxSwaps: gameState.maxMoves,
        };
        
        const achievements = recordGameResult('waffle', result);
        trackGameEnd('waffle', result);
        
        // Submit to leaderboard API
        submitResult({
          gameKey: 'waffle',
          mode: 'daily',
          success: won,
          attempts: gameState.movesUsed,
          metadata: { perfect, swaps: gameState.movesUsed, maxSwaps: gameState.maxMoves, puzzleDate: puzzle.date },
        }).catch(err => console.warn('[Waffle] Failed to submit to leaderboard:', err));
        
        const updatedStats = getGameStats('waffle');
        setStats(updatedStats);
        
        // Add puzzle words to Learning Log
        if (puzzle.words) {
          addWordsToLog(puzzle.words, 'waffle');
        }
        
        setBadgeUnlocks(achievements || []);
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

  const handleCellClick = useCallback((row, col) => {
    if (!canSelectCell(gameState, row, col)) return;

    if (gameState.selectedCell) {
      // Second click - try to swap
      const cell1 = gameState.selectedCell;
      const cell2 = { row, col };

      if (cell1.row === cell2.row && cell1.col === cell2.col) {
        // Clicked same cell - deselect
        setGameState(prev => ({ ...prev, selectedCell: null }));
        return;
      }

      if (canSwap(gameState, cell1, cell2)) {
        const newState = performSwap(gameState, cell1, cell2);
        setGameState(newState);
        
        if (newState.gameStatus === 'won') {
          const perfect = isPerfectSolve(newState, puzzle);
          if (perfect) {
            showToast('⭐ Perfect solve!', 'success');
          } else {
            showToast('🎉 Puzzle solved!', 'success');
          }
        } else if (newState.gameStatus === 'lost') {
          showToast('❌ Out of moves!', 'error');
        }
      } else {
        // Can't swap - just select new cell
        setGameState(prev => ({ ...prev, selectedCell: { row, col } }));
      }
    } else {
      // First click - select cell
      setGameState(prev => ({ ...prev, selectedCell: { row, col } }));
    }
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

  const minMoves = calculateMinimumMoves(puzzle);
  const gameComplete = gameState.gameStatus !== 'playing';

  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader
        title="Waffle"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={gameComplete}
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

        {/* Move counter */}
        <div className="mb-4 text-center">
          <div className="text-lg font-bold text-foreground">
            Moves: {gameState.movesUsed} / {gameState.maxMoves}
          </div>
          <div className="text-sm text-text-muted">
            Perfect solve: {minMoves} moves
          </div>
        </div>

        {/* Game grid */}
        <WaffleGrid
          grid={gameState.currentGrid}
          pattern={gameState.pattern}
          cellStates={gameState.cellStates}
          selectedCell={gameState.selectedCell}
          onCellClick={handleCellClick}
          disabled={gameState.gameStatus !== 'playing'}
        />

        {/* Instructions */}
        <div className="mt-6 text-center text-text-muted max-w-md">
          <p className="text-sm">
            Tap two letters to swap them. Rearrange all letters to form valid words in every row and column.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-wordle-correct"></div>
              <span className="text-xs">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-wordle-present"></div>
              <span className="text-xs">Wrong spot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-wordle-absent"></div>
              <span className="text-xs">Wrong word</span>
            </div>
          </div>
        </div>

        {/* New game button for unlimited mode */}
        {mode === 'unlimited' && gameState.gameStatus !== 'playing' && (
          <button
            onClick={handleNewGame}
            className="mt-6 px-6 py-3 bg-wordle-correct text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            New Puzzle
          </button>
        )}
      </main>

      {/* Result Modal */}
      {showResultModal && (
        <Modal onClose={() => setShowResultModal(false)}>
          <div className="text-center p-6">
            <h2 className="text-3xl font-bold mb-4">
              {gameState.gameStatus === 'won' ? '🎉 You Won!' : '😔 Game Over'}
            </h2>
            
            <div className="mb-6">
              <p className="text-lg mb-2">
                Moves used: <span className="font-bold">{gameState.movesUsed}/{gameState.maxMoves}</span>
              </p>
              {gameState.gameStatus === 'won' && isPerfectSolve(gameState, puzzle) && (
                <p className="text-wordle-correct font-bold">⭐ Perfect Solve!</p>
              )}
            </div>

            {mode === 'daily' && (
              <div className="mb-6">
                <ShareResults
                  gameName="waffle"
                  result={{
                    won: gameState.gameStatus === 'won',
                    moves: gameState.movesUsed,
                    maxMoves: gameState.maxMoves,
                    perfect: isPerfectSolve(gameState, puzzle),
                    cellStates: gameState.cellStates,
                    pattern: gameState.pattern,
                  }}
                  puzzleNumber={puzzle.date}
                />
              </div>
            )}

            <BadgeEarnedRecap badges={badgeUnlocks} />
            <div className="mt-3">
              <BadgesProgressWidget variant="compact" />
            </div>

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
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* How to Play Modal */}
      <UnifiedHowToPlay 
        gameName="waffle" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="waffle"
      />

      {/* Statistics Modal */}
      {showStats && stats && (
        <StatisticsModal
          gameName="waffle"
          stats={stats}
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />
      )}

      <BadgesDrawer
        isOpen={showBadgesDrawer}
        onClose={() => setShowBadgesDrawer(false)}
      />

      <BadgeDetailsSheet
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onExited={handleToastExit}
        />
      )}

      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />

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
