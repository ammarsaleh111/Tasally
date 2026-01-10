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

export default function WordleGame() {
  const [mode, setMode] = useState('daily'); // 'daily' | 'unlimited'
  const [wordLength, setWordLength] = useState(DEFAULT_WORD_LENGTH); // Default 5
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]); 
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); 
  const [keyStatuses, setKeyStatuses] = useState({}); 
  const [message, setMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Initialize Game Logic (Loads state or starts new)
  const initGame = (targetMode, targetLength) => {
    const savedState = loadGameState(targetMode, targetLength);
    
    let currentSolution = '';
    let currentGuesses = [];
    let currentStatus = 'playing';

    if (savedState) {
        // Load Game
        if (targetMode === 'daily') {
            currentSolution = getDailyWord(); // Currently ignoring length for daily, only 5 exists
            if (targetLength !== 5) {
                // Should not happen if we disable controls, but safe fallback
                // Or maybe you want daily 4/6 in future?
                // For now, if Daily selected, force length 5?
            }
        } else {
            currentSolution = savedState.solution || getRandomWord(targetLength);
        }
        currentGuesses = savedState.guesses;
        currentStatus = savedState.status;
    } else {
        // New Game
        currentSolution = targetMode === 'daily' ? getDailyWord() : getRandomWord(targetLength);
        currentGuesses = [];
        currentStatus = 'playing';
    }

    setSolution(currentSolution);
    setGuesses(currentGuesses);
    setGameStatus(currentStatus);
    
    // Reconstruct Keys
    const newKeyStatuses = {};
    currentGuesses.forEach(g => {
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
    setCurrentGuess('');
  };

  // Initial Load
  useEffect(() => {
    initGame('daily', 5);
  }, []);

  // Save State
  useEffect(() => {
    if (solution) {
        saveGameState(guesses, gameStatus, solution, mode, wordLength);
    }
  }, [guesses, gameStatus, solution, mode, wordLength]);

  // Mode Switching
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    
    // If switching to Daily, force length 5 for now
    if (newMode === 'daily') {
        const newLen = 5;
        setWordLength(newLen);
        initGame(newMode, newLen);
    } else {
        initGame(newMode, wordLength);
    }
  };

  // Length Switching (Unlimited Only)
  const switchLength = (newLength) => {
    if (newLength === wordLength) return;
    if (mode === 'daily') {
        showMessage("Daily is 5 letters only");
        return;
    }
    setWordLength(newLength);
    initGame(mode, newLength);
  };

  // Play Again (Unlimited only)
  const handlePlayAgain = () => {
    setMode('unlimited'); 
    
    // Manual Reset
    const newSolution = getRandomWord(wordLength);
    setSolution(newSolution);
    setGuesses([]);
    setGameStatus('playing');
    setKeyStatuses({});
    setCurrentGuess('');
  };

  // Handle Input
  const onKey = (key) => {
    if (gameStatus !== 'playing') return;

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
    if (isValidating) return; 
    
    if (currentGuess.length !== wordLength) {
      showMessage("Not enough letters");
      return;
    }
    
    setIsValidating(true);
    // Note: We bypass dictionary check for non-5-length random words if they aren't in dictionary
    // Ideally validateWordAsync would check against words4/words6 too or a real API
    // For now, let's assume random words are valid, so only check if user typed real word
    // API dictionary might cover 4/6 letters too.
    const isValid = await validateWordAsync(currentGuess);
    setIsValidating(false);

    if (!isValid) {
      showMessage("Not in word list");
      return;
    }

    const evaluation = evaluateGuess(currentGuess, solution);
    const newGuessObj = { word: currentGuess, evaluation };
    
    // Update Guesses
    const newGuesses = [...guesses, newGuessObj];
    setGuesses(newGuesses);
    
    // ... Key Update Logic same as before ... 
    const newKeyStatuses = { ...keyStatuses };
    currentGuess.split('').forEach((char, i) => {
        const currentStatus = newKeyStatuses[char];
        const newStatus = evaluation[i];
        
        if (currentStatus === LETTER_STATUS.CORRECT) return;
        if (newStatus === LETTER_STATUS.CORRECT) {
            newKeyStatuses[char] = LETTER_STATUS.CORRECT;
            return;
        }
        if (currentStatus === LETTER_STATUS.PRESENT) return;
        newKeyStatuses[char] = newStatus;
    });
    setKeyStatuses(newKeyStatuses);

    // Check Win/Loss
    if (currentGuess === solution) {
        setGameStatus('won');
        showMessage("Genius!");
    } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        showMessage(`The word was ${solution}`);
    }

    setCurrentGuess('');
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
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
  }, [currentGuess, gameStatus]); // Dependencies trigger re-bind, keep simple

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background text-foreground safe-area-padding">
      <GameHeader title="Wordle" />
      
      {/* Mode Toggle */}
      <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-4 bg-slate-800 p-1.5 rounded-full">
            <button 
                onClick={() => switchMode('daily')}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${mode === 'daily' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
                Daily
            </button>
            <button 
                onClick={() => switchMode('unlimited')}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${mode === 'unlimited' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
                Unlimited
            </button>
          </div>
          
          {/* Length Selector (Unlimited Only?) */}
          {mode === 'unlimited' && (
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Letters:</span>
                {[4, 5, 6].map(len => (
                    <button
                        key={len}
                        onClick={() => switchLength(len)}
                        className={`
                            w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center
                            ${wordLength === len ? 'bg-slate-700 text-white border-slate-500' : 'hover:bg-slate-800'}
                        `}
                    >
                        {len}
                    </button>
                ))}
             </div>
          )}
      </div>

      {/* Messages */}
      {message && (
        <div className="fixed top-24 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded shadow-lg z-50 font-bold border border-slate-300 dark:border-slate-600 animate-fade-in-up">
          {message}
        </div>
      )}

      {/* Play Again Overlay */}
      {gameStatus !== 'playing' && mode === 'unlimited' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
            <button 
                onClick={handlePlayAgain}
                className="
                    px-8 py-3 bg-wordle-correct text-white font-bold rounded-lg shadow-xl 
                    text-xl hover:scale-105 active:scale-95 transition-transform animate-pop
                "
            >
                Play Again
            </button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-grow flex items-center justify-center p-4">
        <WordleGrid 
            guesses={guesses} 
            currentGuess={currentGuess} 
            status={gameStatus} 
        />
      </div>

      {/* Keyboard */}
      <div className="w-full pb-8">
        <Keyboard onKey={onKey} keyStatuses={keyStatuses} />
      </div>
    </div>
  );
}
