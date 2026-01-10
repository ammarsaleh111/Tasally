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
  WORDS_PER_GROUP
} from './connectionsLogic';
import ConnectionsGrid from '@/components/ConnectionsGrid';
import GroupBar from '@/components/GroupBar';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Link from 'next/link';

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

  // Save state whenever it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Show result modal when game ends
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') {
      setTimeout(() => setShowResultModal(true), 1000);
    }
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

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto min-h-screen pb-10 px-4 animate-fade-in-up">
      {toast && (
        <Toast 
          key={toast.id}
          message={toast.message} 
          type={toast.type} 
          onExited={handleToastExit} 
        />
      )}

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title={gameState.gameStatus === 'won' ? 'Puzzle Complete!' : 'Next Time!'}>
        <div className="flex flex-col items-center gap-4">
          {gameState.gameStatus === 'won' ? (
            <p className="text-lg text-center">
              You solved all groups!
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

          <div className="w-full h-px bg-border-default my-2"></div>

          <Link 
            href="/games"
            className="w-full py-3 rounded-lg bg-wordle-correct text-white font-bold hover:opacity-90 transition-opacity text-center"
          >
            Back to Games
          </Link>
        </div>
      </Modal>

      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-3 border-b border-border-default pb-3">
          <Link 
            href="/games" 
            className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Games
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Connections</h1>
          
          <div className="w-[80px]"></div>
        </div>

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
  );
}
