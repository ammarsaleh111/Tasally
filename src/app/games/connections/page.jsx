'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getTodaysPuzzle,
  loadGameState,
  saveGameState,
  initializeGame,
  checkGroup,
  isOneAway,
  MAX_MISTAKES,
  WORDS_PER_GROUP,
  loadStats,
  saveStats,
  updateStats,
  getDefaultStats
} from './connectionsLogic';
import ConnectionsGrid from '@/components/ConnectionsGrid';
import GroupBar from '@/components/GroupBar';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import GameHeader from '@/components/GameHeader';
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import BadgeToastQueue from '@/components/BadgeToastQueue';
import BadgeDetailsSheet from '@/components/BadgeDetailsSheet';
import BadgeEarnedRecap from '@/components/BadgeEarnedRecap';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import BadgesDrawer from '@/components/BadgesDrawer';
import DailyReminder from '@/components/DailyReminder';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import Link from 'next/link';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';

export default function ConnectionsGame() {
  const [puzzle, setPuzzle] = useState(() => getTodaysPuzzle());
  const [gameState, setGameState] = useState(() => {
    const currentPuzzle = getTodaysPuzzle();
    const savedState = loadGameState();
    if (savedState && savedState.date === currentPuzzle.date) {
      return savedState;
    }
    return initializeGame(currentPuzzle);
  });
  const [selectedWords, setSelectedWords] = useState([]);
  const [isShaking, setIsShaking] = useState(false);
  const [toast, setToast] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [stats, setStats] = useState(null);
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgesDrawer, setShowBadgesDrawer] = useState(false);
  
  // Load stats on mount and track game start
  useEffect(() => {
    const gameStats = getGameStats('connections');
    setStats(gameStats);
    trackGameStart('connections');
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Show result modal when game ends
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') {
      // Update stats using profileManager
      const won = gameState.gameStatus === 'won';
      const result = {
        date: getTodayString(),
        win: won,
        mistakes: gameState.mistakes,
        perfect: won && gameState.mistakes === 0,
        puzzleId: `connections-${puzzle.date}`,
        solvedGroups: gameState.solvedGroups.map((g, i) => i),
      };
      
      const achievements = recordGameResult('connections', result);
      trackGameEnd('connections', result);
      
      // Submit to leaderboard API
      submitResult({
        gameKey: 'connections',
        mode: 'daily',
        success: won,
        attempts: gameState.mistakes,
        metadata: { puzzleDate: puzzle.date, perfect: result.perfect },
      }).catch(err => console.warn('[Connections] Failed to submit to leaderboard:', err));
      
      const updatedStats = getGameStats('connections');
      setStats(updatedStats);
      
      // Add all words from the puzzle to Learning Log
      const allWords = puzzle.groups.flatMap(g => g.words);
      addWordsToLog(allWords, 'connections');
      
      setBadgeUnlocks(achievements || []);
      
      setTimeout(() => setShowResultModal(true), 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus]);

  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleToastExit = useCallback(() => {
    setToast(null);
  }, []);

  const handleWordClick = useCallback((word) => {
    if (gameState.gameStatus !== 'playing') return;

    setSelectedWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      } else if (prev.length < WORDS_PER_GROUP) {
        return [...prev, word];
      }
      return prev;
    });
  }, [gameState.gameStatus]);

  const handleShuffle = useCallback(() => {
    if (!gameState || !puzzle) return;

    // Get remaining words (not in solved groups)
    const solvedWords = gameState.solvedGroups.flatMap(g => g.words);
    const remainingWords = gameState.shuffledWords.filter(w => !solvedWords.includes(w));

    // Shuffle remaining words
    const shuffled = [...remainingWords].sort(() => Math.random() - 0.5);

    const newState = {
      ...gameState,
      shuffledWords: [...solvedWords, ...shuffled]
    };

    setGameState(newState);
  }, [gameState, puzzle]);

  const handleDeselectAll = useCallback(() => {
    setSelectedWords([]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!gameState || !puzzle || selectedWords.length !== WORDS_PER_GROUP || isSubmitting) return;

    setIsSubmitting(true);

    const group = checkGroup(selectedWords, puzzle);

    if (group) {
      // Correct group!
      const newSolvedGroups = [...gameState.solvedGroups, group];
      const allSolved = newSolvedGroups.length === puzzle.groups.length;

      const newState = {
        ...gameState,
        solvedGroups: newSolvedGroups,
        gameStatus: allSolved ? 'won' : 'playing'
      };

      setGameState(newState);
      setSelectedWords([]);
      showToast('Correct!', 'success');
    } else {
      // Wrong group
      const newMistakes = gameState.mistakes + 1;
      const oneAway = isOneAway(selectedWords, puzzle);

      if (oneAway) {
        showToast('One away...');
      }

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);

      const newState = {
        ...gameState,
        mistakes: newMistakes,
        gameStatus: newMistakes >= MAX_MISTAKES ? 'lost' : 'playing'
      };

      setGameState(newState);
      setSelectedWords([]);
    }

    setTimeout(() => setIsSubmitting(false), 500);
  }, [gameState, puzzle, selectedWords, isSubmitting, showToast]);

  if (!puzzle || !gameState) {
    return null;
  }

  // Get remaining words (not in solved groups)
  const solvedWords = gameState.solvedGroups.flatMap(g => g.words.map(w => w.toUpperCase()));
  const remainingWords = gameState.shuffledWords.filter(w => !solvedWords.includes(w.toUpperCase()));

  const mistakesRemaining = MAX_MISTAKES - gameState.mistakes;
  const gameComplete = gameState.gameStatus !== 'playing';

  return (
    <div className="flex flex-col items-center w-full min-h-screen pb-10 animate-fade-in-up">
      <GameHeader 
        title="Connections" 
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={gameComplete}
      />
      
      <div className="w-full max-w-3xl mx-auto px-4">     {toast && (
        <Toast 
          key={toast.id}
          message={toast.message} 
          type={toast.type} 
          onExited={handleToastExit} 
        />
      )}

      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title={gameState.gameStatus === 'won' ? 'Puzzle Complete!' : 'Next Time!'}>
        <div className="flex flex-col items-center gap-4">
          {gameState.gameStatus === 'won' ? (
            <p className="text-lg text-center">
              You solved all groups with {gameState.mistakes} mistake{gameState.mistakes !== 1 ? 's' : ''}!
            </p>
          ) : (
            <div className="text-center">
              <p className="text-lg mb-4">
                You ran out of attempts. Here were the groups:
              </p>
              <div className="space-y-2">
                {puzzle.groups.map((group, idx) => (
                  <GroupBar key={idx} group={group} />
                ))}
              </div>
            </div>
          )}

          {/* Share Results */}
          {gameState.gameStatus === 'won' && (
            <ShareResults
              gameName="connections"
              result={{
                solvedGroups: gameState.solvedGroups.map((g, i) => i),
                win: true
              }}
              puzzleNumber={`#${puzzle.date}`}
            />
          )}

          {/* Daily Reminder */}
          <DailyReminder gameName="connections" />

          <BadgeEarnedRecap badges={badgeUnlocks} />
          <div className="mt-3 w-full">
            <BadgesProgressWidget variant="compact" />
          </div>

          <div className="w-full h-px bg-border-default my-2"></div>

          <button
            onClick={() => setShowResultModal(false)}
            className="w-full py-3 rounded-lg bg-wordle-correct text-white font-bold hover:opacity-90 transition-opacity text-center"
          >
            Close
          </button>
        </div>
      </Modal>
      
      {/* How to Play Modal */}
      <UnifiedHowToPlay 
        gameName="connections" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="connections"
      />
      
      {/* Stats Modal */}
      {stats && (
        <StatisticsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          gameName="connections"
          stats={stats}
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

      {/* Header */}
      <div className="w-full mb-6 px-4">
        <p className="text-center text-text-muted text-sm mb-4">
          Create four groups of four!
        </p>
      </div>

      {/* Solved Groups */}
      {gameState.solvedGroups.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-4">
          {gameState.solvedGroups.map((group, idx) => (
            <GroupBar key={idx} group={group} isAnimating={idx === gameState.solvedGroups.length - 1} />
          ))}
        </div>
      )}

      {/* Grid */}
      {remainingWords.length > 0 && (
        <ConnectionsGrid 
          words={remainingWords}
          selectedWords={selectedWords}
          onWordClick={handleWordClick}
          isShaking={isShaking}
          disabled={gameState.gameStatus !== 'playing' || isSubmitting}
        />
      )}

      {/* Mistakes Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-text-muted">Mistakes remaining:</span>
        <div className="flex gap-1">
          {[...Array(MAX_MISTAKES)].map((_, idx) => (
            <div 
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < mistakesRemaining ? 'bg-foreground' : 'bg-border-default'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      {gameState.gameStatus === 'playing' && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleShuffle}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-lg border-2 border-border-default hover:bg-surface-hover font-bold transition-colors disabled:opacity-50"
          >
            Shuffle
          </button>
          
          <button
            onClick={handleDeselectAll}
            disabled={selectedWords.length === 0 || isSubmitting}
            className="px-6 py-3 rounded-lg border-2 border-border-default hover:bg-surface-hover font-bold transition-colors disabled:opacity-50"
          >
            Deselect All
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={selectedWords.length !== WORDS_PER_GROUP || isSubmitting}
            className="px-8 py-3 rounded-lg bg-foreground text-background font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
