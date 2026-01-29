'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GameHeader from '@/components/GameHeader';
import HoneycombGridEnhanced from '@/components/HoneycombGridEnhanced';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import WinConfettiOverlay, { CONFETTI_ORIGINS } from '@/components/WinConfettiOverlay';
import ShareResults from '@/components/ShareResults';
import SpellingStatistics from '@/components/SpellingStatistics';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import {
  validateWord,
  calculateWordPoints,
  isPangram,
  getCurrentRank,
  calculateMaxScore,
  shuffleLetters,
  calculateStats,
  generateShareText,
  RANK_TIERS
} from './spellingLogic';
import { SPELLING_PUZZLES_JAN_2026 } from './puzzles/spelling-2026-01';
import { SPELLING_PUZZLES_FEB_2026 } from './puzzles/spelling-2026-02';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { getNextSpellingBeeHint, getSpellingBeeHintButtonText } from '@/utils/spellingBeeHints';
import { getUserStorageKey } from '@/utils/storageKeys';

// Merge January and February puzzles
const ALL_SPELLING_PUZZLES = [...SPELLING_PUZZLES_JAN_2026, ...SPELLING_PUZZLES_FEB_2026];
import { saveGameToProfile, getGameStats } from '@/utils/profileManager';
import { submitResult } from '@/utils/resultsClient';

export default function SpellingBeePage() {
  // Initialize puzzle on first render
  const [puzzle] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPuzzle = ALL_SPELLING_PUZZLES.find(p => p.date === today);
    return todayPuzzle || ALL_SPELLING_PUZZLES[0];
  });

  // Initialize outer letters (shuffled)
  const [outerLetters, setOuterLetters] = useState(() => 
    puzzle ? shuffleLetters(puzzle.letters) : []
  );

  // Initialize max score
  const [maxScore] = useState(() => {
    if (!puzzle) return 0;
    const allLetters = [puzzle.center, ...puzzle.letters];
    return calculateMaxScore(puzzle.validWords, allLetters);
  });

  // Game state - initialize with saved progress
  const [foundWords, setFoundWords] = useState(() => {
    if (!puzzle) return [];
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(getUserStorageKey(`spelling-${puzzle.date}`));
    if (saved) {
      const data = JSON.parse(saved);
      return data.foundWords || [];
    }
    return [];
  });

  const [score, setScore] = useState(() => {
    if (!puzzle) return 0;
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem(getUserStorageKey(`spelling-${puzzle.date}`));
    if (saved) {
      const data = JSON.parse(saved);
      return data.score || 0;
    }
    return 0;
  });

  const [hintsUsed, setHintsUsed] = useState(() => {
    if (!puzzle) return 0;
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem(getUserStorageKey(`spelling-${puzzle.date}`));
    if (saved) {
      const data = JSON.parse(saved);
      return data.hintsUsed || 0;
    }
    return 0;
  });

  const [rank, setRank] = useState(RANK_TIERS[0]);
  const [previousRank, setPreviousRank] = useState(null);
  
  // Current word being typed
  const [currentWord, setCurrentWord] = useState('');
  
  // UI state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [showStats, setShowStats] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [showWinConfetti, setShowWinConfetti] = useState(false);
  const [hasCelebratedWin, setHasCelebratedWin] = useState(false);
  const prevWinRef = useRef(false);
  const initialWinHandledRef = useRef(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const winStorageKey = useMemo(() => (puzzle ? getUserStorageKey(`spelling-win-celebrated-${puzzle.date}`) : null), [puzzle]);

  // Derived state: hint button text
  const hintButtonText = useMemo(() => {
    if (!puzzle) return 'Hint 1/5';
    const puzzleId = `spelling-${puzzle.date}`;
    return getSpellingBeeHintButtonText(puzzleId, puzzle.validWords, foundWords);
  }, [puzzle, foundWords]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      if (!winStorageKey) {
        setHasCelebratedWin(false);
        return;
      }
      setHasCelebratedWin(localStorage.getItem(winStorageKey) === '1');
    });
  }, [winStorageKey]);

  // Save progress
  useEffect(() => {
    if (puzzle && foundWords.length > 0) {
      const saveData = {
        foundWords,
        score,
        hintsUsed,
        date: puzzle.date
      };
      localStorage.setItem(getUserStorageKey(`spelling-${puzzle.date}`), JSON.stringify(saveData));

      // Save to global profile
      const allLetters = [puzzle.center, ...puzzle.letters];
      const currentStats = calculateStats(foundWords, puzzle.validWords, allLetters, score, maxScore);
      saveGameToProfile('spelling', { stats: currentStats });
    }
  }, [foundWords, score, puzzle, hintsUsed, maxScore]);

  // Track previous rank for comparison
  const prevRankRef = useRef(rank);

  // Update rank when score changes
  useEffect(() => {
    if (maxScore > 0) {
      const newRank = getCurrentRank(score, maxScore);
      if (prevRankRef.current.name !== newRank.name) {
        setPreviousRank(prevRankRef.current);
        prevRankRef.current = newRank;
        setRank(newRank);
        setShowRankUp(true);
        const timer = setTimeout(() => setShowRankUp(false), 3000);
        return () => clearTimeout(timer);
      } else if (rank.name !== newRank.name) {
        prevRankRef.current = newRank;
        setRank(newRank);
      }
    }
  }, [score, maxScore, rank.name]);

  // Check if game is complete
  useEffect(() => {
    if (puzzle && foundWords.length === puzzle.validWords.length && !isComplete) {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setIsComplete(true);
      });
      
      // Add all found words to Learning Log
      addWordsToLog(foundWords, 'spelling');
      
      // Save to profile
      const allLetters = [puzzle.center, ...puzzle.letters];
      const stats = calculateStats(foundWords, puzzle.validWords, allLetters, score, maxScore);
      saveGameToProfile('spelling', {
        date: puzzle.date,
        completed: true,
        stats
      });
      
      // Submit to leaderboard API
      submitResult({
        gameKey: 'spelling',
        mode: 'daily',
        success: true,
        attempts: foundWords.length,
        metadata: { score, maxScore, wordsFound: foundWords.length, totalWords: puzzle.validWords.length, puzzleDate: puzzle.date },
      }).catch(err => console.warn('[Spelling] Failed to submit to leaderboard:', err));
    }
  }, [foundWords, puzzle, score, maxScore, isComplete]);

  useEffect(() => {
    const wonNow = Boolean(isComplete);
    if (!initialWinHandledRef.current) {
      prevWinRef.current = wonNow;
      initialWinHandledRef.current = true;
      return;
    }
    if (wonNow && !prevWinRef.current && !hasCelebratedWin) {
      queueMicrotask(() => {
        setShowWinConfetti(true);
        setHasCelebratedWin(true);
        if (typeof window !== 'undefined' && winStorageKey) {
          localStorage.setItem(winStorageKey, '1');
        }
      });
    }
    prevWinRef.current = wonNow;
  }, [isComplete, hasCelebratedWin, winStorageKey]);

  // Show toast
  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 2000);
  }, []);

  // Submit word
  const handleSubmit = useCallback(() => {
    if (!puzzle || currentWord.length < 4) {
      if (currentWord.length > 0 && currentWord.length < 4) {
        showToast('Too short (minimum 4 letters)', 'error');
      }
      return;
    }

    const allLetters = [puzzle.center, ...puzzle.letters];
    const validation = validateWord(
      currentWord,
      puzzle.center,
      allLetters,
      puzzle.validWords,
      foundWords
    );

    if (validation.valid) {
      const wordIsPangram = isPangram(currentWord, allLetters);
      const points = calculateWordPoints(currentWord, wordIsPangram);
      
      setFoundWords(prev => [...prev, currentWord.toUpperCase()]);
      setScore(prev => prev + points);
      
      if (wordIsPangram) {
        showToast(`Pangram! +${points} points! 🐝`, 'success');
      } else {
        showToast(`+${points} point${points > 1 ? 's' : ''}!`, 'success');
      }
      
      setCurrentWord('');
    } else {
      showToast(validation.message, 'error');
      // Shake animation
      const wordDisplay = document.getElementById('current-word-display');
      if (wordDisplay) {
        wordDisplay.classList.add('animate-shake');
        setTimeout(() => wordDisplay.classList.remove('animate-shake'), 500);
      }
    }
  }, [puzzle, currentWord, foundWords, showToast]);

  const handleBackspace = useCallback(() => {
    setCurrentWord(prev => prev.slice(0, -1));
  }, []);

  // Handle letter click
  const handleLetterClick = useCallback((letter) => {
    setCurrentWord(prev => prev + letter);
  }, []);

  // Handle drag word change (from HoneycombGridEnhanced)
  const handleDragWordChange = useCallback((word) => {
    if (!word || word.length < 4) {
      // Just update display, don't submit short words
      if (word) {
        setCurrentWord(word);
      }
      return;
    }
    
    // Auto-submit the dragged word
    setCurrentWord(word);
    
    // Submit after a brief delay to show the word
    setTimeout(() => {
      const allLetters = [puzzle.center, ...puzzle.letters];
      const validation = validateWord(
        word,
        puzzle.center,
        allLetters,
        puzzle.validWords,
        foundWords
      );

      if (validation.valid) {
        const wordIsPangram = isPangram(word, allLetters);
        const points = calculateWordPoints(word, wordIsPangram);
        
        setFoundWords(prev => [...prev, word.toUpperCase()]);
        setScore(prev => prev + points);
        
        if (wordIsPangram) {
          showToast(`Pangram! +${points} points! 🐝`, 'success');
        } else {
          showToast(`+${points} point${points > 1 ? 's' : ''}!`, 'success');
        }
        
        setCurrentWord('');
      } else {
        showToast(validation.message, 'error');
        setCurrentWord('');
      }
    }, 200);
  }, [puzzle, foundWords, showToast]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showStats) return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'enter') {
        handleSubmit();
      } else if (key === 'backspace') {
        handleBackspace();
      } else if (/^[a-z]$/.test(key)) {
        const upperKey = key.toUpperCase();
        const allLetters = [puzzle?.center, ...(puzzle?.letters || [])];
        if (allLetters.includes(upperKey)) {
          handleLetterClick(upperKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleLetterClick, handleSubmit, handleBackspace, showStats, puzzle]);

  // Shuffle letters
  const handleShuffle = () => {
    setOuterLetters(prev => shuffleLetters(prev));
  };

  // Show hint - Progressive letter-reveal system
  const handleHint = () => {
    if (!puzzle) return;
    
    const puzzleId = `spelling-${puzzle.date}`;
    const hintResult = getNextSpellingBeeHint(
      puzzleId,
      puzzle.validWords,
      foundWords,
      currentWord // Pass current input so hints can be player-aware
    );
    
    if (hintResult.pattern) {
      showToast(hintResult.pattern, 'info');
      setHintsUsed(hintResult.totalHintsUsed);
      // Note: hintButtonText updates automatically via useMemo when foundWords changes
    }
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-text-muted">Loading puzzle...</div>
      </div>
    );
  }

  const allLetters = [puzzle.center, ...puzzle.letters];
  const currentGameStats = calculateStats(foundWords, puzzle.validWords, allLetters, score, maxScore);

  return (
    <div className="min-h-screen bg-background pb-20">
      <GameHeader 
        title="Spelling Bee"
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={isComplete}
      />

      <main className="relative max-w-2xl mx-auto px-4 pt-4">
        <WinConfettiOverlay
          active={showWinConfetti}
          durationMs={3000}
          intensity={0.8}
          origin={CONFETTI_ORIGINS.top}
          palette={[
            'hsl(var(--wordle-present))',
            'hsl(var(--warning))',
            'hsl(var(--button-primary))',
            'hsl(var(--info))'
          ]}
          onDone={() => setShowWinConfetti(false)}
        />
        {/* Rank Display */}
        {showRankUp && previousRank && (
          <div className="mb-4 p-4 bg-card rounded-lg shadow-lg border-2 border-yellow-400 animate-bounce">
            <div className="text-center">
              <div className="text-sm text-text-muted">Rank Up!</div>
              <div className="text-2xl font-bold" style={{ color: rank.color }}>
                {rank.name}
              </div>
            </div>
          </div>
        )}

        {/* Score and Progress */}
        <div className="mb-6 bg-card rounded-lg shadow-md p-6 border border-card-border">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-text-muted">Score</div>
              <div className="text-3xl font-bold text-foreground">{score}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-muted">Rank</div>
              <div className="text-xl font-bold" style={{ color: rank.color }}>
                {rank.name}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-graph-bg rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-wordle-present transition-all duration-500"
              style={{ width: `${(score / maxScore) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>{foundWords.length} words</span>
            <span>{Math.round((score / maxScore) * 100)}%</span>
          </div>
        </div>

        {isComplete && (
          <div className="mb-6 w-full rounded-xl border border-border-default bg-card px-4 py-3 text-xs text-text-muted flex items-center justify-between">
            <div className="font-semibold text-foreground">✅ Solved</div>
            <div>Words: {foundWords.length}/{puzzle.validWords.length} · Pangrams: {puzzle.pangrams.filter(p => foundWords.includes(p)).length}</div>
          </div>
        )}

        {/* Current Word Display */}
        <div className="mb-6">
          <div
            id="current-word-display"
            className="min-h-16 bg-card border border-card-border rounded-lg shadow-md p-4 flex items-center justify-center"
          >
            <div className="text-3xl font-bold text-foreground tracking-wider">
              {currentWord || <span className="text-text-muted">Type or click letters</span>}
            </div>
          </div>
        </div>

        {/* Honeycomb Grid with Path Visualization */}
        <div className="mb-6">
          <HoneycombGridEnhanced
            centerLetter={puzzle.center}
            outerLetters={outerLetters}
            onLetterClick={handleLetterClick}
            onWordChange={handleDragWordChange}
            currentWord={currentWord}
            disabled={isComplete}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleBackspace}
            className="py-3 bg-key-bg text-key-text rounded-lg hover:bg-key-bg-hover font-semibold transition-colors py-3 bg-key-bg text-key-text rounded-lg hover:bg-key-bg-hover font-semibold transition-colors bg-card border border-card-border rounded-lg hover:bg-surface-hover"
          >
            Delete
          </button>
          <button
            onClick={handleShuffle}
            className="py-3 bg-button-primary text-button-text rounded-lg hover:bg-button-primary-hover font-semibold transition-colors"
          >
            🔄 Shuffle
          </button>
          <button
            onClick={handleSubmit}
            className="py-3 bg-wordle-present text-background rounded-lg hover:bg-wordle-correct font-semibold transition-colors"
          >
            Enter
          </button>
        </div>

        {/* Hint Button */}
        <div className="mb-6">
          <button
            onClick={handleHint}
            className="w-full py-2 bg-card border border-card-border text-foreground rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium"
            disabled={hintButtonText === 'No Hints Left'}
          >
            💡 {hintButtonText} {hintsUsed > 0 && `(${hintsUsed} used)`}
          </button>
        </div>

        {/* Found Words */}
        <div className="bg-card border border-card-border rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-foreground">
              Found Words ({foundWords.length})
            </h3>
            <div className="text-sm text-text-muted">
              {puzzle.pangrams.filter(p => foundWords.includes(p)).length}/
              {puzzle.pangrams.length} pangrams
            </div>
          </div>

          {foundWords.length === 0 ? (
            <div className="text-center text-text-muted py-8">
              No words found yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {foundWords.map((word, index) => (
                <div
                  key={index}
                  className={`
                    p-2 rounded text-center text-sm font-medium
                    ${puzzle.pangrams.includes(word)
                      ? 'bg-wordle-present text-background border border-wordle-correct'
                      : 'bg-surface-hover text-foreground'
                    }
                  `}
                >
                  {word}
                  {puzzle.pangrams.includes(word) && ' 🐝'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complete Message */}
        {isComplete && (
          <div className="mt-6 bg-wordle-correct rounded-lg shadow-lg p-6 text-center text-button-text">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-2xl font-bold mb-2">Congratulations!</div>
            <div className="text-lg mb-4">You found all {foundWords.length} words!</div>
            <ShareResults text={generateShareText(currentGameStats, puzzle.date)} />
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Statistics">
        <SpellingStatistics
          stats={currentGameStats}
          onClose={() => setShowStats(false)}
        />
      </Modal>
      
      {/* How to Play Modal */}
      <UnifiedHowToPlay 
        gameName="spelling" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="spelling"
      />

      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} />
      )}

    </div>
  );
}
