'use client';

import { useState, useEffect, useCallback } from 'react';
import GameHeader from '@/components/GameHeader';
import HoneycombGrid from '@/components/HoneycombGrid';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import Confetti from '@/components/Confetti';
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
  getHint,
  calculateStats,
  generateShareText,
  RANK_TIERS
} from './spellingLogic';
import { SPELLING_PUZZLES_JAN_2026 } from './puzzles/spelling-2026-01';
import { SPELLING_PUZZLES_FEB_2026 } from './puzzles/spelling-2026-02';
import { addWordsToLog } from '@/utils/learningLogEngine';

// Merge January and February puzzles
const ALL_SPELLING_PUZZLES = [...SPELLING_PUZZLES_JAN_2026, ...SPELLING_PUZZLES_FEB_2026];
import { saveGameToProfile, getGameStats } from '@/utils/profileManager';

export default function SpellingBeePage() {
  // Game state
  const [puzzle, setPuzzle] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [outerLetters, setOuterLetters] = useState([]);
  const [rank, setRank] = useState(RANK_TIERS[0]);
  const [previousRank, setPreviousRank] = useState(null);
  
  // UI state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [showStats, setShowStats] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRankUp, setShowRankUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Load today's puzzle
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPuzzle = ALL_SPELLING_PUZZLES.find(p => p.date === today);
    
    if (todayPuzzle) {
      setPuzzle(todayPuzzle);
      const allLetters = [todayPuzzle.center, ...todayPuzzle.letters];
      setOuterLetters(shuffleLetters(todayPuzzle.letters));
      setMaxScore(calculateMaxScore(todayPuzzle.validWords, allLetters));
      
      // Load saved progress
      loadProgress(today);
    } else {
      // Fallback to first puzzle
      const fallback = ALL_SPELLING_PUZZLES[0];
      setPuzzle(fallback);
      const allLetters = [fallback.center, ...fallback.letters];
      setOuterLetters(shuffleLetters(fallback.letters));
      setMaxScore(calculateMaxScore(fallback.validWords, allLetters));
    }
  }, []);

  // Load progress from localStorage
  const loadProgress = (date) => {
    const saved = localStorage.getItem(`spelling-${date}`);
    if (saved) {
      const { foundWords: savedWords, score: savedScore, hintsUsed: savedHints } = JSON.parse(saved);
      setFoundWords(savedWords || []);
      setScore(savedScore || 0);
      setHintsUsed(savedHints || 0);
    }
  };

  // Save progress
  useEffect(() => {
    if (puzzle && foundWords.length > 0) {
      const saveData = {
        foundWords,
        score,
        hintsUsed,
        date: puzzle.date
      };
      localStorage.setItem(`spelling-${puzzle.date}`, JSON.stringify(saveData));

      // Save to global profile
      const allLetters = [puzzle.center, ...puzzle.letters];
      const currentStats = calculateStats(foundWords, puzzle.validWords, allLetters, score, maxScore);
      saveGameToProfile('spelling', { stats: currentStats });
    }
  }, [foundWords, score, puzzle, hintsUsed, maxScore]);

  // Update rank when score changes
  useEffect(() => {
    if (maxScore > 0) {
      const newRank = getCurrentRank(score, maxScore);
      if (rank.name !== newRank.name) {
        setPreviousRank(rank);
        setRank(newRank);
        setShowRankUp(true);
        setTimeout(() => setShowRankUp(false), 3000);
      } else {
        setRank(newRank);
      }
    }
  }, [score, maxScore]);

  // Check if game is complete
  useEffect(() => {
    if (puzzle && foundWords.length === puzzle.validWords.length) {
      setIsComplete(true);
      setShowConfetti(true);
      
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
    }
  }, [foundWords, puzzle, score, maxScore]);

  // Handle letter click
  const handleLetterClick = useCallback((letter) => {
    setCurrentWord(prev => prev + letter);
  }, []);

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
  }, [handleLetterClick, showStats, puzzle]);

  // Submit word
  const handleSubmit = () => {
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
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
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
  };

  // Backspace
  const handleBackspace = () => {
    setCurrentWord(prev => prev.slice(0, -1));
  };

  // Shuffle letters
  const handleShuffle = () => {
    setOuterLetters(prev => shuffleLetters(prev));
  };

  // Show hint
  const handleHint = () => {
    if (!puzzle) return;
    
    const hint = getHint(puzzle.validWords, foundWords);
    if (hint) {
      showToast(`Hint: Word starting with "${hint}"`, 'info');
      setHintsUsed(prev => prev + 1);
    } else {
      showToast('All words found!', 'success');
    }
  };

  // Show toast
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 2000);
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

      <main className="max-w-2xl mx-auto px-4 pt-4">
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

        {/* Honeycomb Grid */}
        <div className="mb-6">
          <HoneycombGrid
            centerLetter={puzzle.center}
            outerLetters={outerLetters}
            onLetterClick={handleLetterClick}
            disabled={isComplete}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleBackspace}
            className="py-3 bg-key-bg text-key-text rounded-lg hover:bg-key-bg-hover font-semibold transition-colors"
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
          >
            💡 Hint ({hintsUsed} used)
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

      {/* Confetti */}
      {showConfetti && <Confetti />}
    </div>
  );
}
