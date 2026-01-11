'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import StatisticsModal from '@/components/StatisticsModal';
import HowToPlay from '@/components/HowToPlay';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import Link from 'next/link';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';

// Validation cache to avoid duplicate API calls
const validationCache = new Map();

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
  const [stats, setStats] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  // --- Helpers ---
  const showToast = (message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleToastExit = () => {
    setToast(null);
  };

  // Load stats from profileManager
  useEffect(() => {
    const gameStats = getGameStats('wordle');
    setStats(gameStats);
  }, []);

  // Update stats when game ends using profileManager
  const updateStats = (won, guessCount) => {
    const result = {
      date: getTodayString(),
      win: won,
      attempts: guessCount,
      puzzleId: mode === 'daily' ? `daily-${getTodayString()}` : `unlimited-${Date.now()}`,
      guesses: guesses.map(g => ({ word: g.word, evaluation: g.evaluation })),
    };
    
    // Record result and check for achievements
    const achievements = recordGameResult('wordle', result);
    
    // Track game end in session
    trackGameEnd('wordle', result);
    
    // Update local stats display
    const updatedStats = getGameStats('wordle');
    setStats(updatedStats);
    
    // Show achievements
    if (achievements && achievements.length > 0) {
      setNewAchievements(achievements);
      setCurrentAchievementIndex(0);
    }
  };

  // --- Initialization ---
  const startGame = (targetMode, targetLength) => {
    // Save preferences
    setMode(targetMode);
    setWordLength(targetLength);
    setView('GAME');
    
    // Track game start
    trackGameStart('wordle');

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

  const submitGuess = useCallback(async () => {
    if (isValidating || gameStatus !== 'playing') return; 
    
    if (currentGuess.length !== wordLength) {
      showToast("Not enough letters");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    
    const guessWord = currentGuess;
    
    // Validate FIRST (check cache or call API)
    setIsValidating(true);
    let isValid = validationCache.get(guessWord);
    
    if (isValid === undefined) {
      isValid = await validateWordAsync(guessWord);
      validationCache.set(guessWord, isValid);
    }
    
    setIsValidating(false);
    
    // If invalid, show error immediately
    if (!isValid) {
      showToast("Not in word list");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    
    // Valid word - proceed with animation and update
    const evaluation = evaluateGuess(guessWord, solution);
    const newGuessObj = { word: guessWord, evaluation };
    const newGuesses = [...guesses, newGuessObj];
    
    setCurrentGuess('');
    setGuesses(newGuesses);
    
    // Update keyboard statuses
    const newKeyStatuses = { ...keyStatuses };
    guessWord.split('').forEach((char, i) => {
        const currentStatus = newKeyStatuses[char];
        const newStatus = evaluation[i];
        
        if (currentStatus === LETTER_STATUS.CORRECT) return;
        if (newStatus === LETTER_STATUS.CORRECT) {
            newKeyStatuses[char] = LETTER_STATUS.CORRECT;
            return;
        }
        if (currentStatus === LETTER_STATUS.PRESENT && newStatus === LETTER_STATUS.ABSENT) return;
        if (currentStatus === LETTER_STATUS.PRESENT) return;
        
        newKeyStatuses[char] = newStatus;
    });
    setKeyStatuses(newKeyStatuses);

    // Check Win/Loss
    if (guessWord === solution) {
        setGameStatus('won');
        showToast(getWinMessage(newGuesses.length), 'success');
        updateStats(true, newGuesses.length);
    } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        updateStats(false, newGuesses.length);
    }
  }, [currentGuess, wordLength, guesses, solution, keyStatuses, gameStatus, isValidating]);

  const onKey = useCallback((key) => {
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
  }, [gameStatus, view, currentGuess, wordLength, submitGuess]);

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
                {gameStatus === 'won' ? 'Great job!' : 'Better luck next time!'}
            </p>

            {/* Share Results Button */}
            {gameStatus === 'won' && (
              <ShareResults 
                gameName="wordle"
                result={{
                  guesses: guesses,
                  win: true
                }}
                puzzleNumber={mode === 'daily' ? `#${getTodayString()}` : ''}
              />
            )}

            {/* Daily Reminder for daily mode */}
            {mode === 'daily' && (
              <DailyReminder gameName="wordle" />
            )}

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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('MENU')} 
              className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Menu
            </button>

            <Link 
              href="/games" 
              className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              All Games
            </Link>
          </div>
          
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
      {stats && (
        <StatisticsModal 
          isOpen={showStats} 
          onClose={() => setShowStats(false)} 
          gameName="wordle"
          stats={stats}
        />
      )}

      {/* Achievement Notifications */}
      {newAchievements.length > 0 && currentAchievementIndex < newAchievements.length && (
        <AchievementNotification
          achievementId={newAchievements[currentAchievementIndex].id}
          onClose={() => {
            if (currentAchievementIndex < newAchievements.length - 1) {
              setCurrentAchievementIndex(currentAchievementIndex + 1);
            } else {
              setNewAchievements([]);
              setCurrentAchievementIndex(0);
            }
          }}
        />
      )}

      {/* How To Play Modal */}
      <HowToPlay 
        isOpen={showHowTo} 
        onClose={() => setShowHowTo(false)} 
      />
    </div>
  );
}
