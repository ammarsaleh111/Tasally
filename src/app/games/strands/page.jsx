'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GameHeader from '@/components/GameHeader';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Confetti from '@/components/Confetti';
import ShareResults from '@/components/ShareResults';
import StatisticsModal from '@/components/StatisticsModal';
import StrandsGrid from '@/components/StrandsGrid';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import { getGameTheme } from '@/utils/themeEngine';
import { getTodayString, recordGameResult, getGameStats } from '@/utils/profileManager';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { STRANDS_2026_01 } from './puzzles/strands-2026-01';
import { STRANDS_PUZZLES_FEB_2026 } from './puzzles/strands-2026-02';

// Merge January and February puzzles
const ALL_STRANDS_PUZZLES = [...STRANDS_2026_01, ...STRANDS_PUZZLES_FEB_2026];
import {
  serializePos,
  validateSelection,
  getHint,
  saveProgress,
  loadProgress,
  validatePuzzle,
} from './strandsLogic';

export default function StrandsPage() {
  const todayStr = useMemo(() => getTodayString(), []);
  const [puzzle, setPuzzle] = useState(null);
  const [path, setPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundWords, setFoundWords] = useState([]); // { word, path }
  const [foundSet, setFoundSet] = useState(new Set());
  const [lockedSet, setLockedSet] = useState(new Set());
  const [spangramFound, setSpangramFound] = useState(false);
  const [spangramPath, setSpangramPath] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [highlightedSet, setHighlightedSet] = useState(new Set());
  const [startedAt, setStartedAt] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [winModal, setWinModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [shouldShake, setShouldShake] = useState(false);
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [learningLogModal, setLearningLogModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const gameTheme = getGameTheme('strands');

  // Load and validate today's puzzle
  const puzzleData = useMemo(() => {
    const pools = [ALL_STRANDS_PUZZLES];
    const all = pools.flat();
    const today = all.find((p) => p.date === todayStr);
    const puzzleToLoad = today || all[0] || null;
    
    if (puzzleToLoad) {
      const validation = validatePuzzle(puzzleToLoad);
      if (!validation.valid) {
        console.error('Puzzle validation failed:', validation.errors);
        return { puzzle: puzzleToLoad, errors: validation.errors };
      }
      return { puzzle: puzzleToLoad, errors: [] };
    }
    return { puzzle: null, errors: [] };
  }, [todayStr]);

  // Set puzzle and validation errors from memoized data
  useEffect(() => {
    setPuzzle(puzzleData.puzzle);
    setValidationErrors(puzzleData.errors);
  }, [puzzleData]);

  // Load progress from saved data
  const savedProgress = useMemo(() => {
    if (!puzzle) return null;
    return loadProgress(puzzle.date);
  }, [puzzle]);

  // Apply loaded progress to state
  useEffect(() => {
    if (!puzzle) return;
    
    if (savedProgress) {
      setFoundWords(savedProgress.foundWords || []);
      setFoundSet(new Set(savedProgress.foundSet || []));
      setLockedSet(new Set(savedProgress.lockedSet || []));
      setSpangramFound(!!savedProgress.spangramFound);
      setHintsUsed(savedProgress.hintsUsed || 0);
      setStartedAt(savedProgress.startedAt || Date.now());
      setCompletedAt(savedProgress.completedAt || null);
    } else {
      setFoundWords([]);
      setFoundSet(new Set());
      setLockedSet(new Set());
      setSpangramFound(false);
      setHintsUsed(0);
      setStartedAt(Date.now());
      setCompletedAt(null);
    }
  }, [puzzle, savedProgress]);

  // Persist progress
  useEffect(() => {
    if (!puzzle) return;
    saveProgress(puzzle.date, {
      foundWords,
      foundSet: Array.from(foundSet),
      lockedSet: Array.from(lockedSet),
      spangramFound,
      hintsUsed,
      startedAt,
      completedAt,
    });
  }, [puzzle, foundWords, foundSet, lockedSet, spangramFound, hintsUsed, startedAt, completedAt]);

  const onStart = (r, c) => {
    if (completedAt) return;
    setIsDragging(true);
    setPath([[r, c]]);
  };

  const onEnter = (r, c) => {
    if (!isDragging || completedAt) return;
    const last = path[path.length - 1];
    if (!last) return;
    const dr = Math.abs(last[0] - r);
    const dc = Math.abs(last[1] - c);
    const adjacent = dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
    const alreadyUsed = path.some(([pr, pc]) => pr === r && pc === c);
    if (adjacent && !alreadyUsed) {
      setPath((p) => [...p, [r, c]]);
    }
  };

  const clearPathWithFade = () => {
    setPath([]);
  };

  const lockPositions = (cells) => {
    setLockedSet((prev) => {
      const next = new Set(prev);
      cells.forEach(([r, c]) => next.add(serializePos(r, c)));
      return next;
    });
  };

  const onEnd = () => {
    if (!isDragging || !puzzle || !path.length) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    const result = validateSelection(
      puzzle.grid,
      path,
      puzzle,
      foundSet,
      spangramFound
    );

    if (result.type === 'too-short') {
      setToast('Too short');
      setShouldShake(true);
      setTimeout(() => {
        setToast(null);
        setShouldShake(false);
      }, 600);
      clearPathWithFade();
      return;
    }

    if (result.type === 'word') {
      setFoundWords((fw) => [...fw, { word: result.word, path: [...path] }]);
      setFoundSet((s) => new Set([...s, result.word]));
      lockPositions(path);
      setToast('Nice!');
      setTimeout(() => setToast(null), 600);
      setPath([]);
      return;
    }

    if (result.type === 'spangram') {
      setSpangramFound(true);
      setSpangramPath([...path]); // Store spangram path for ribbon
      lockPositions(path);
      setToast('Spangram!');
      setTimeout(() => setToast(null), 800);
      setPath([]);
      return;
    }

    // invalid
    setToast('Not in theme');
    setShouldShake(true);
    setTimeout(() => {
      setToast(null);
      setShouldShake(false);
    }, 600);
    clearPathWithFade();
  };

  // Check if puzzle is complete
  const isComplete = useMemo(() => {
    if (!puzzle || completedAt) return false;
    const allWordsFound = puzzle.words.every((w) => foundSet.has(w.toUpperCase()));
    return allWordsFound && spangramFound;
  }, [puzzle, foundSet, spangramFound, completedAt]);

  // Handle win condition
  useEffect(() => {
    if (!isComplete || !puzzle) return;
    
    const end = Date.now();
    const timeSec = Math.floor((end - (startedAt || end)) / 1000);
    
    // Record result
    recordGameResult('strands', {
      date: puzzle.date,
      win: true,
      time: timeSec,
      hintsUsed,
      perfect: hintsUsed === 0,
      attempts: foundWords.length + (spangramFound ? 1 : 0),
      breakdown: { words: foundWords.map(f => f.word), spangram: spangramFound },
    });
    
    // Add words to Learning Log
    const allWords = [
      ...foundWords.map(f => f.word),
      puzzle.spangram?.toUpperCase(),
    ].filter(Boolean);
    addWordsToLog(allWords, 'strands');
    
    // Set completion state
    setCompletedAt(end);
    setWinModal(true);
  }, [isComplete, puzzle, foundWords, hintsUsed, spangramFound, startedAt]);

  const handleHint = () => {
    if (!puzzle) return;
    const hint = getHint(puzzle, foundSet, spangramFound);
    if (hint.type === 'none') return;
    setHintsUsed((h) => h + 1);
    // Simple hint: highlight tiles matching letter
    const letter = hint.letter;
    const positions = new Set();
    puzzle.grid.forEach((row, r) => {
      row.forEach((ch, c) => {
        if (ch.toUpperCase() === letter) {
          positions.add(serializePos(r, c));
        }
      });
    });
    setHighlightedSet(positions);
    setTimeout(() => setHighlightedSet(new Set()), 1800);
  };

  const handleReset = () => {
    if (!puzzle) return;
    setPath([]);
    setFoundWords([]);
    setFoundSet(new Set());
    setLockedSet(new Set());
    setSpangramFound(false);
    setSpangramPath(null);
    setHintsUsed(0);
    setHighlightedSet(new Set());
    setStartedAt(Date.now());
    setCompletedAt(null);
  };

  const wordsFoundCount = foundWords.length;
  const totalWords = puzzle?.words?.length || 0;
  const gameStats = getGameStats('strands');

  return (
    <div className="min-h-screen bg-background">
      <GameHeader 
        title="Strands" 
        onHowToPlay={() => setHowToPlayModal(true)} 
        onStats={() => setStatsModal(true)} 
        onLearningLog={() => setLearningLogModal(true)}
        gameComplete={!!completedAt}
      />

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {validationErrors.length > 0 && (
          <div className="bg-card border border-border-active rounded-lg p-4 mb-4">
            <h3 className="font-bold text-red-900 mb-2">Puzzle Validation Errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
        
        {puzzle ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
            {/* Left Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Theme */}
              <div className="bg-crossword-highlight border-2 border-crossword-active-ring rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide text-crossword-active-ring font-bold mb-2">Today&apos;s Theme</div>
                <div className="text-xl font-serif font-bold text-foreground">{puzzle.theme}</div>
              </div>

              {/* Progress */}
              <div className="bg-card border-2 border-card-border rounded-xl p-4">
                <div className="text-sm text-text-muted mb-3">
                  <span className="font-bold text-2xl text-foreground">{wordsFoundCount}</span>
                  <span className="text-text-muted"> of {totalWords}</span>
                  <span className="text-text-muted"> theme words found.</span>
                </div>
                
                {/* Found Words List */}
                {foundWords.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {foundWords.map(f => (
                      <div key={f.word} className="text-sm text-foreground font-medium">
                        ✓ {f.word}
                      </div>
                    ))}
                  </div>
                )}
                
                {spangramFound && (
                  <div className="pt-3 border-t border-border-default">
                    <div className="text-sm font-bold text-wordle-correct">✨ Spangram found!</div>
                  </div>
                )}
              </div>

              {/* Hint Button */}
              <button
                onClick={handleHint}
                disabled={wordsFoundCount < 3 || completedAt}
                className="w-full py-3 px-4 rounded-full border-2 border-border-default bg-card text-foreground font-bold text-sm hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {wordsFoundCount < 3 ? '🔒 Hint (find 3 words)' : '💡 Hint'}
              </button>

              {hintsUsed > 0 && (
                <div className="text-xs text-center text-text-muted">
                  Hints used: {hintsUsed}
                </div>
              )}
            </div>

            {/* Right Grid Area */}
            <div className="max-w-2xl mx-auto lg:mx-0 w-full">
              <StrandsGrid
                grid={puzzle.grid}
                path={path}
                lockedSet={lockedSet}
                highlightedSet={highlightedSet}
                foundWords={foundWords}
                spangramPath={spangramPath}
                isDragging={isDragging}
                shouldShake={shouldShake}
                onStart={onStart}
                onEnter={onEnter}
                onEnd={onEnd}
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-text-muted">No puzzle available.</div>
        )}
      </div>

            <Modal isOpen={winModal} title="You solved it!" actions={(
              <>
                <button
                  onClick={() => setWinModal(false)}
                  className="w-full py-3 bg-[var(--button-primary)] text-[var(--button-text)] rounded-lg hover:bg-[var(--button-primary-hover)] transition-all font-bold"
                >
                  Close
                </button>
              </>
            )}>
              <div className="text-center space-y-4">
                <div className="text-text-muted">Theme: <span className="font-semibold text-foreground">{puzzle?.theme}</span></div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div>Time: <span className="font-semibold">{Math.floor(((completedAt||0) - (startedAt||0)) / 1000)}s</span></div>
                  <div>Hints: <span className="font-semibold">{hintsUsed}</span></div>
                  <div>Perfect: {hintsUsed === 0 ? '✅' : '—'}</div>
                </div>
                <ShareResults
                  gameName="strands"
                  puzzleNumber={puzzle?.date}
                  result={{
                    wordsFound: foundWords.length,
                    totalWords,
                    spangram: spangramFound,
                  }}
                />
              </div>
              <Confetti />
            </Modal>

      {/* How to Play Modal - Unified */}
      <UnifiedHowToPlay
        isOpen={howToPlayModal}
        onClose={() => setHowToPlayModal(false)}
        gameName="strands"
      />

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={statsModal}
        onClose={() => setStatsModal(false)}
        gameName="strands"
        stats={gameStats}
      />

      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={learningLogModal}
        onClose={() => setLearningLogModal(false)}
      />

      {toast && (
        <Toast
          message={typeof toast === 'string' ? toast : toast.message}
          duration={typeof toast === 'object' && toast?.duration ? toast.duration : 2000}
          onExited={() => setToast(null)}
        />
      )}
    </div>
  );
}
