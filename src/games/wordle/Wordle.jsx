'use client';

import React, { useState, useEffect } from 'react';
import { 
  getDailyWord, 
  evaluateGuess, 
  loadGameState, 
  saveGameState,
  LETTER_STATUS,
  WORD_LENGTH,
  MAX_GUESSES
} from './wordleLogic';
import { validateWordAsync } from '@/utils/wordValidation';
import WordleGrid from '@/components/WordleGrid';
import Keyboard from '@/components/Keyboard';
import GameHeader from '@/components/GameHeader';

export default function WordleGame() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]); // Array of { word: string, evaluation: [] }
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [keyStatuses, setKeyStatuses] = useState({}); // Map of key -> status
  const [message, setMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Initialization
  useEffect(() => {
    // 1. Get Today's Word
    const dailyWord = getDailyWord();
    setSolution(dailyWord);

    // 2. Load State
    const savedState = loadGameState();
    if (savedState) {
        setGuesses(savedState.guesses);
        setGameStatus(savedState.status);
        
        // Reconstruct Key Statuses
        const newKeyStatuses = {};
        savedState.guesses.forEach(g => {
            g.word.split('').forEach((char, i) => {
                const currentStatus = newKeyStatuses[char];
                const newStatus = g.evaluation[i];
                
                // Update priority: CORRECT > PRESENT > ABSENT
                if (currentStatus === LETTER_STATUS.CORRECT) return;
                if (newStatus === LETTER_STATUS.CORRECT) {
                    newKeyStatuses[char] = LETTER_STATUS.CORRECT;
                    return;
                }
                if (currentStatus === LETTER_STATUS.PRESENT) return;
                newKeyStatuses[char] = newStatus;
            });
        });
        setKeyStatuses(newKeyStatuses);
    }
  }, []);

  // Save State on Change
  useEffect(() => {
    if (solution) { // Only save if initialized
        saveGameState(guesses, gameStatus);
    }
  }, [guesses, gameStatus, solution]);

  // Handle Input
  const onKey = (key) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
      }
    }
  };

  const submitGuess = async () => {
    if (isValidating) return; // Prevent double submission
    
    if (currentGuess.length !== WORD_LENGTH) {
      showMessage("Not enough letters");
      return;
    }
    
    setIsValidating(true);
    const isValid = await validateWordAsync(currentGuess);
    setIsValidating(false);

    if (!isValid) {
      showMessage("Not in word list");
      // Optional: Add shake animation trigger here
      return;
    }

    const evaluation = evaluateGuess(currentGuess, solution);
    const newGuessObj = { word: currentGuess, evaluation };
    
    // Update Guesses
    const newGuesses = [...guesses, newGuessObj];
    setGuesses(newGuesses);
    
    // Update Keys
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
      
      {/* Messages */}
      {message && (
        <div className="fixed top-20 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded shadow-lg z-50 font-bold border border-slate-300 dark:border-slate-600">
          {message}
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
