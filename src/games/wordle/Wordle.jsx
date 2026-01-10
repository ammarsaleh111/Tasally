'use client';

import React, { useState, useEffect } from 'react';
import { 
  getDailyWord, 
  getRandomWord,
  evaluateGuess, 
  loadGameState, 
  saveGameState,
  LETTER_STATUS,
  DEFAULT_WORD_LENGTH,
  MAX_GUESSES
} from './wordleLogic';
import { validateWordAsync } from '@/utils/wordValidation';
import WordleGrid from '@/components/WordleGrid';
import Keyboard from '@/components/Keyboard';
import GameHeader from '@/components/GameHeader';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import ModeSelection from './ModeSelection';
import Statistics from '@/components/Statistics';
import HowToPlay from '@/components/HowToPlay';

export default function WordleGame() {
  // --- Game State ---
  const [view, setView] = useState('MENU'); // 'MENU' | 'GAME'
  const [mode, setMode] = useState('daily'); // 'daily' | 'unlimited'
  const [wordLength, setWordLength] = useState(DEFAULT_WORD_LENGTH);
  
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]); 
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [keyStatuses, setKeyStatuses] = useState({}); 
  const [isValidating, setIsValidating] = useState(false);

  // --- UI State ---
  const [toast, setToast] = useState(null); // { message, type, id }
  const [showResultModal, setShowResultModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [stats, setStats] = useState({ played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: {} });
  const [isShaking, setIsShaking] = useState(false);

  // --- Helpers ---
  const showToast = (message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleToastExit = () => {
    setToast(null);
  };

  // Load stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('wordle_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Update stats when game ends
  const updateStats = (won, guessCount) => {
    const newStats = { ...stats };
    newStats.played = (newStats.played || 0) + 1;
    
    if (won) {
      newStats.won = (newStats.won || 0) + 1;
      newStats.currentStreak = (newStats.currentStreak || 0) + 1;
      newStats.maxStreak = Math.max(newStats.maxStreak || 0, newStats.currentStreak);
      
      // Update distribution
      if (!newStats.distribution) newStats.distribution = {};
      newStats.distribution[guessCount] = (newStats.distribution[guessCount] || 0) + 1;
    } else {
      newStats.currentStreak = 0;
    }
    
    setStats(newStats);
    localStorage.setItem('wordle_stats', JSON.stringify(newStats));
  };

  // --- Initialization ---
  const startGame = (targetMode, targetLength) => {
    // Save preferences
    setMode(targetMode);
    setWordLength(targetLength);
    setView('GAME');

    const savedState = loadGameState(targetMode, targetLength);
    
    // Check if we have an active game in storage matching this config
    if (savedState && savedState.status === 'playing') {
        // Restore State
        setSolution(savedState.solution || (targetMode === 'daily' ? getDailyWord() : getRandomWord(targetLength)));
        setGuesses(savedState.guesses);
        setGameStatus(savedState.status);
        reconstructKeys(savedState.guesses);
        setCurrentGuess('');
    } else {
        // New Game
        const newSolution = targetMode === 'daily' ? getDailyWord() : getRandomWord(targetLength);
        setSolution(newSolution);
        setGuesses([]);
        setGameStatus('playing');
        setKeyStatuses({});
        setCurrentGuess('');
    }
  };

  const reconstructKeys = (loadedGuesses) => {
    const newKeyStatuses = {};
    loadedGuesses.forEach(g => {
        g.word.split('').forEach((char, i) => {
            const currentKeyStatus = newKeyStatuses[char];
            const newKeyStatus = g.evaluation[i];
            
            if (currentKeyStatus === LETTER_STATUS.CORRECT) return;
            if (newKeyStatus === LETTER_STATUS.CORRECT) {
                newKeyStatuses[char] = LETTER_STATUS.CORRECT;
                return;
            }
            if (currentKeyStatus === LETTER_STATUS.PRESENT) return;
            newKeyStatuses[char] = newKeyStatus;
        });
    });
    setKeyStatuses(newKeyStatuses);
  };

  // Auto-Show Menu on Mount
  useEffect(() => {
    // If we wanted to auto-load existing game, we'd check localStorage here.
    // Requirement says "Show Mode Selection Screen... Only after user selects mode: Game loads".
    // So we persist in MENU state until user interaction.
    setView('MENU');
  }, []);

  // Save State Effect
  useEffect(() => {
    if (solution && view === 'GAME') {
        saveGameState(guesses, gameStatus, solution, mode, wordLength);
    }
    
    if (gameStatus !== 'playing') {
        setTimeout(() => setShowResultModal(true), 1500);
    } else {
        setShowResultModal(false);
    }
  }, [guesses, gameStatus, solution, mode, wordLength, view]);


  // --- Game Actions ---
  const handlePlayAgain = () => {
    setShowResultModal(false);
    // Reset for Unlimited
    if (mode === 'unlimited') {
        const newSolution = getRandomWord(wordLength);
        setSolution(newSolution);
        setGuesses([]);
        setGameStatus('playing');
        setKeyStatuses({});
        setCurrentGuess('');
    } else {
        // For Daily, typically you can't play again immediately.
        // But for testing/dev or if user wants to play tomorrow's?
        // Let's redirect to menu or unlimited
        setView('MENU');
    }
  };

  const handleMenuReturn = () => {
    setShowResultModal(false);
    setView('MENU');
  };

  const onKey = (key) => {
    if (gameStatus !== 'playing' || view !== 'GAME') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  };

  const submitGuess = async () => {
    if (isValidating || gameStatus !== 'playing') return; 
    
    if (currentGuess.length !== wordLength) {
      showToast("Not enough letters");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    
    setIsValidating(true);
    const isValid = await validateWordAsync(currentGuess);
    setIsValidating(false);

    if (!isValid) {
      showToast("Not in word list");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    const evaluation = evaluateGuess(currentGuess, solution);
    const newGuessObj = { word: currentGuess, evaluation };
    
    const newGuesses = [...guesses, newGuessObj];
    setGuesses(newGuesses);
    
    // Update Keys
    const newKeyStatuses = { ...keyStatuses };
    currentGuess.split('').forEach((char, i) => {
        const currentStatus = newKeyStatuses[char];
        const newStatus = evaluation[i];
        
        // Priority: Correct > Present > Absent
        if (currentStatus === LETTER_STATUS.CORRECT) return;
        if (newStatus === LETTER_STATUS.CORRECT) {
            newKeyStatuses[char] = LETTER_STATUS.CORRECT;
            return;
        }
        if (currentStatus === LETTER_STATUS.PRESENT && newStatus === LETTER_STATUS.ABSENT) return;
        // The above check is tricky: if a letter is Present in one spot, but Absent in another (duplicate guess),
        // we generally want to keep it Present or Correct.
        if (currentStatus === LETTER_STATUS.PRESENT) return;
        
        newKeyStatuses[char] = newStatus;
    });
    setKeyStatuses(newKeyStatuses);

    // Check Win/Loss
    if (currentGuess === solution) {
        setGameStatus('won');
        showToast(getWinMessage(newGuesses.length), 'success');
        updateStats(true, newGuesses.length);
    } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        updateStats(false, newGuesses.length);
        // showToast(solution, 'error'); // Reveal in toast or modal? Modal is better.
    }
    
    setCurrentGuess('');
  };

  const getWinMessage = (count) => {
      const messages = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
      return messages[Math.min(count - 1, 5)];
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE') {
        onKey(key);
      } else if (/^[A-Z]$/.test(key)) {
        onKey(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, view, currentGuess, wordLength]);

  // --- Render ---

  if (view === 'MENU') {
      return <ModeSelection onSelectMode={startGame} />;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto min-h-screen pb-10 px-4 animate-fade-in-up">
      {toast && (
        <Toast 
            key={toast.id}
            message={toast.message} 
            type={toast.type} 
            onExited={handleToastExit} 
        />
      )}

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title={gameStatus === 'won' ? 'You Won!' : 'Game Over'}>
          <div className="flex flex-col items-center gap-4">
            {gameStatus === 'lost' && (
                <div className="text-xl">
                    The word was <span className="font-bold text-wordle-correct">{solution}</span>
                </div>
            )}
            
            <p className="text-text-muted">
                {gameStatus === 'won' ? 'Great job! Come back tomorrow or play unlimited.' : 'Better luck next time!'}
            </p>

            <div className="w-full h-px bg-border-default my-2"></div>

            {mode === 'unlimited' ? (
                <button 
                    onClick={handlePlayAgain}
                    className="w-full py-3 rounded-lg bg-wordle-correct text-white font-bold hover:opacity-90 transition-opacity"
                >
                    Play Again
                </button>
            ) : (
                 <div className="text-sm text-text-muted font-semibold">
                    Next Daily Puzzle: Tomorrow
                 </div>
            )}
            
            <button 
                onClick={handleMenuReturn}
                className="w-full py-3 rounded-lg border border-border-default hover:bg-surface-hover font-bold transition-colors text-foreground"
            >
                Back to Menu
            </button>
          </div>
      </Modal>

      <div className="w-full mb-6">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-3 border-b border-border-default pb-3">
          <button 
            onClick={() => setView('MENU')} 
            className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Menu
          </button>
          
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Wordle</h1>
          
          <div className="flex gap-1">
            <button 
              onClick={() => setShowHowTo(true)} 
              className="p-2 hover:bg-surface-hover rounded-md transition-colors"
              title="How to Play"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
            <button 
              onClick={() => setShowStats(true)} 
              className="p-2 hover:bg-surface-hover rounded-md transition-colors"
              title="Statistics"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <WordleGrid 
        guesses={guesses} 
        currentGuess={currentGuess} 
        length={wordLength} 
        status={gameStatus}
        isShaking={isShaking}
      />
      
      <Keyboard 
        onKey={onKey} 
        keyStatuses={keyStatuses} 
      />

      {/* Statistics Modal */}
      <Statistics 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
        stats={stats}
      />

      {/* How To Play Modal */}
      <HowToPlay 
        isOpen={showHowTo} 
        onClose={() => setShowHowTo(false)} 
      />
    </div>
  );
}
