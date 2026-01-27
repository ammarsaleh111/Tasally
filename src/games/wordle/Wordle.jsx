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
import { validateWordAsync, isWordLocallyKnown } from '@/utils/wordValidation';
import WordleGrid from '@/components/WordleGrid';
import Keyboard from '@/components/Keyboard';
import GameHeader from '@/components/GameHeader';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import ModeSelection from './ModeSelection';
import StatisticsModal from '@/components/StatisticsModal';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';
import { addWordToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';


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

  // --- UI State ---
  const [toast, setToast] = useState(null); // { message, type, id }
  const [showResultModal, setShowResultModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [stats, setStats] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [solveTime, setSolveTime] = useState(null);

  const guessesRef = useRef([]);
  const startTimeRef = useRef(null);
  const confirmedGuesses = useMemo(() => guesses.filter(guess => !guess.pending), [guesses]);


  const syncGuesses = useCallback((updater) => {
    setGuesses(prev => {
      const next = updater(prev);
      guessesRef.current = next;
      return next;
    });
  }, []);

    const getWinMessage = useCallback((count) => {
      const messages = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
      return messages[Math.min(count - 1, 5)];
    }, []);

  // --- Helpers ---
  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleToastExit = () => {
    setToast(null);
  };

  // Load stats from profileManager
  useEffect(() => {
    const gameStats = getGameStats('wordle');
    setStats(gameStats);
  }, []);

  useEffect(() => {
    guessesRef.current = guesses;
  }, [guesses]);

  // Update stats when game ends using profileManager
  const updateStats = (won, guessCount, latestGuesses) => {
    const sourceGuesses = latestGuesses || guessesRef.current;
    const confirmedGuesses = sourceGuesses.filter(guess => !guess.pending);
    const result = {
      date: getTodayString(),
      win: won,
      attempts: guessCount,
      puzzleId: mode === 'daily' ? `daily-${getTodayString()}` : `unlimited-${Date.now()}`,
      guesses: confirmedGuesses.map(g => ({ word: g.word, evaluation: g.evaluation })),
    };
    
    // Record result and check for achievements
    const achievements = recordGameResult('wordle', result);
    
    // Track game end in session
    trackGameEnd('wordle', result);
    
    // Submit to leaderboard API (for database-backed leaderboard)
    const endTime = Date.now();
    const durationMs = startTimeRef.current ? endTime - startTimeRef.current : undefined;
    submitResult({
      gameKey: 'wordle',
      mode: mode,
      success: won,
      attempts: guessCount,
      durationMs: durationMs,
      metadata: { wordLength, solution },
    }).catch(err => console.warn('[Wordle] Failed to submit to leaderboard:', err));
    
    // Add solution word to Learning Log
    addWordToLog(solution, 'wordle');
    
    // Update local stats display
    const updatedStats = getGameStats('wordle');
    setStats(updatedStats);
    
    // Show achievements
    if (achievements && achievements.length > 0) {
      setNewAchievements(achievements);
      setCurrentAchievementIndex(0);
    }
  };

  /**
   * Validates that a word matches the expected length.
   * Returns the word if valid, or fetches a new one if not.
   */
  const validateAndGetWord = useCallback((word, expectedLength, mode) => {
    if (word && word.length === expectedLength) {
      return word;
    }
    // Word length mismatch - this should not happen with fixed logic
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Wordle] Word length mismatch: "${word}" (${word?.length}) vs expected ${expectedLength}. Fetching new word.`);
    }
    return mode === 'daily' ? getDailyWord() : getRandomWord(expectedLength);
  }, []);

  // --- Initialization ---
  const startGame = (targetMode, targetLength) => {
    // Save preferences
    setMode(targetMode);
    setWordLength(targetLength);
    setView('GAME');
    setIsChecking(false);
    
    // Track game start
    trackGameStart('wordle');
    startTimeRef.current = Date.now();
    setSolveTime(null);

    const savedState = loadGameState(targetMode, targetLength);
    
    // Check if we have an active game in storage matching this config, OR if it's daily and already completed
    if (savedState && (savedState.status === 'playing' || (targetMode === 'daily'))) {
      let restoredSolution = savedState.solution || (targetMode === 'daily' ? getDailyWord() : getRandomWord(targetLength));
      // CRITICAL: Validate word length matches
      restoredSolution = validateAndGetWord(restoredSolution, targetLength, targetMode);
      setSolution(restoredSolution);
      const restoredGuesses = (savedState.guesses || []).map((guess, index) => ({
        id: `restored-${index}`,
        word: guess.word,
        evaluation: guess.evaluation,
        pending: false,
      }));
      syncGuesses(() => restoredGuesses);
      setGameStatus(savedState.status);
      setKeyStatuses({});
      setCurrentGuess('');
    } else {
      let newSolution = targetMode === 'daily' ? getDailyWord() : getRandomWord(targetLength);
      // CRITICAL: Validate word length matches
      newSolution = validateAndGetWord(newSolution, targetLength, targetMode);
      setSolution(newSolution);
      syncGuesses(() => []);
      setGameStatus('playing');
      setKeyStatuses({});
      setCurrentGuess('');
    }
  };

  const reconstructKeys = (loadedGuesses) => {
    const newKeyStatuses = {};
    loadedGuesses.forEach(g => {
      if (g.pending) return;
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

  useEffect(() => {
    reconstructKeys(guesses);
  }, [guesses]);

  // Save State Effect
  useEffect(() => {
    if (solution && view === 'GAME') {
        const confirmedGuesses = guesses
          .filter(guess => !guess.pending)
          .map(({ word, evaluation }) => ({ word, evaluation }));
        saveGameState(confirmedGuesses, gameStatus, solution, mode, wordLength);
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
    setIsChecking(false);
    setSolveTime(null);
    startTimeRef.current = Date.now();
    
    // Reset for Unlimited
    if (mode === 'unlimited') {
        let newSolution = getRandomWord(wordLength);
        // CRITICAL: Validate word length matches
        newSolution = validateAndGetWord(newSolution, wordLength, mode);
        setSolution(newSolution);
        syncGuesses(() => []);
        setGameStatus('playing');
        setKeyStatuses({});
        setCurrentGuess('');
    } else {
        // For Daily, prevent immediate replay if just finished.
        // Return to menu
        if (gameStatus === 'won' || gameStatus === 'lost') {
             triggerInvalidWordFeedback('Come back tomorrow for the next puzzle!');
        }
        setView('MENU');
    }
  };

  const handleMenuReturn = () => {
    setShowResultModal(false);
    setView('MENU');
  };

  const triggerInvalidWordFeedback = useCallback((message = 'Not in word list') => {
    showToast(message);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  }, [showToast]);

  const handleConfirmedGuess = useCallback((guessEntry, evaluation, currentGuesses) => {
    // Use passed guesses or fall back to ref (though ref might be stale if called immediately after update)
    // In strict 3-layer architecture, we should trust the explicitly passed state.
    const nextGuesses = currentGuesses || guessesRef.current;
    
    // We expect nextGuesses to already contain the validated, non-pending guess
    const confirmedCount = nextGuesses.filter(guess => !guess.pending).length;

    if (gameStatus !== 'playing') {
      return;
    }

    if (guessEntry.word === solution) {
      // Calculate solve time
      const timeInSeconds = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
      setSolveTime(timeInSeconds);
      
      setGameStatus('won');
      showToast(getWinMessage(confirmedCount), 'success');
      updateStats(true, confirmedCount, nextGuesses);
      return;
    }

    if (confirmedCount >= MAX_GUESSES) {
      setGameStatus('lost');
      updateStats(false, confirmedCount, nextGuesses);
    }
  }, [gameStatus, solution, showToast, updateStats, getWinMessage]);

  const submitGuess = useCallback(async () => {
    if (gameStatus !== 'playing' || view !== 'GAME') return;
    if (isChecking) return;
    if (guessesRef.current.length >= MAX_GUESSES) return;

    if (currentGuess.length !== wordLength) {
      triggerInvalidWordFeedback('Not enough letters');
      return;
    }

    const guessWord = currentGuess.toUpperCase();
    const guessId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // UI: Lock input, show checking state
    setIsChecking(true);

    try {
      let validationResult = { valid: true, source: 'local' };
      
      // If locally known, skip async entirely for speed
      if (!isWordLocallyKnown(guessWord)) {
        try {
          validationResult = await validateWordAsync(guessWord);
        } catch (error) {
          validationResult = { valid: false, source: 'error' };
        }
      }

      // If invalid, REJECT immediately without ever adding the row
      if (!validationResult?.valid) {
        triggerInvalidWordFeedback('Not in word list');
        return;
      }

      // If valid, Proceed to Add Row and Score
      const evaluation = evaluateGuess(guessWord, solution);
      const newGuess = { id: guessId, word: guessWord, evaluation, pending: false };
      
      // Calculate next state synchronously
      const nextGuesses = [...guessesRef.current, newGuess];
      
      // Update state
      syncGuesses(() => nextGuesses);
      setCurrentGuess('');
      
      // Check win/loss immediately with the new state
      handleConfirmedGuess(newGuess, evaluation, nextGuesses);

    } finally {
      setIsChecking(false);
    }
  }, [gameStatus, view, isChecking, currentGuess, wordLength, isWordLocallyKnown, syncGuesses, validateWordAsync, triggerInvalidWordFeedback, evaluateGuess, solution, handleConfirmedGuess]);

  const onKey = useCallback((key) => {
    if (gameStatus !== 'playing' || view !== 'GAME' || isChecking) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  }, [gameStatus, view, isChecking, currentGuess, wordLength, submitGuess]);

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
  }, [onKey]);

  // --- Render ---

  if (view === 'MENU') {
      return <ModeSelection onSelectMode={startGame} />;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen animate-fade-in-up">
      {toast && (
        <Toast 
            key={toast.id}
            message={toast.message} 
            type={toast.type} 
            onExited={handleToastExit} 
        />
      )}

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title={gameStatus === 'won' ? '🎉 You solved it!' : 'Game Over'}>
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <div className="text-lg mb-2">
                The word was <span className="font-bold text-wordle-correct text-2xl">{solution}</span>
              </div>
              
              {gameStatus === 'won' && (
                <div className="space-y-1 text-sm text-text-muted">
                  <div>Solved in <span className="font-bold text-foreground">{confirmedGuesses.length}</span> {confirmedGuesses.length === 1 ? 'try' : 'tries'}</div>
                  {solveTime !== null && (
                    <div>Time: <span className="font-bold text-foreground">{Math.floor(solveTime / 60)}:{(solveTime % 60).toString().padStart(2, '0')}</span></div>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-text-muted text-sm">
                {gameStatus === 'won' ? 'Excellent work!' : 'Better luck next time!'}
            </p>

            {/* Share Results Button */}
            {gameStatus === 'won' && (
              <ShareResults 
                gameName="wordle"
                result={{
                  guesses: confirmedGuesses,
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
                    ▶ Play Again
                </button>
            ) : (
                 <div className="text-center py-2">
                    <div className="text-xs uppercase tracking-wide text-text-muted mb-1">Next Daily Puzzle</div>
                    <div className="text-sm font-bold text-foreground">Tomorrow</div>
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

      {/* Unified GameHeader - consistent with all other games */}
      <GameHeader
        title={mode === 'unlimited' ? `Wordle ${wordLength}` : 'Wordle'}
        onHowToPlay={() => setShowHowTo(true)}
        onStats={() => setShowStats(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={gameStatus !== 'playing'}
        mode={mode}
      />

      {/* Main Game Content */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4 pb-10">
        {gameStatus === 'lost' && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-center animate-in fade-in slide-in-from-top-4 w-full">
            <p className="font-bold text-lg">The word was: <span className="uppercase tracking-widest">{solution}</span></p>
          </div>
        )}

        <WordleGrid 
          guesses={guesses} 
          currentGuess={currentGuess} 
          length={wordLength} 
          gameStatus={gameStatus}
          solution={solution}
          isShaking={isShaking}
          isChecking={isChecking}
        />
        
        <Keyboard 
          onKey={onKey} 
          keyStatuses={keyStatuses} 
          disabled={isChecking}
        />
      </div>

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
      <UnifiedHowToPlay 
        isOpen={showHowTo} 
        onClose={() => setShowHowTo(false)} 
        gameName="wordle"
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="wordle"
      />
    </div>
  );
}
