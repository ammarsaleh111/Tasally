'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '@/components/GameHeader';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import WinConfettiOverlay, { CONFETTI_ORIGINS } from '@/components/WinConfettiOverlay';
import ShareResults from '@/components/ShareResults';
import BadgeToastQueue from '@/components/BadgeToastQueue';
import BadgeDetailsSheet from '@/components/BadgeDetailsSheet';
import BadgeEarnedRecap from '@/components/BadgeEarnedRecap';
import BadgesProgressWidget from '@/components/BadgesProgressWidget';
import BadgesDrawer from '@/components/BadgesDrawer';
import StatisticsModal from '@/components/StatisticsModal';
import StrandsGrid from '@/components/StrandsGrid';
import LearningLogModal from '@/components/LearningLogModal';
import DailyReminder from '@/components/DailyReminder';
import { getTodayString, recordGameResult, getGameStats } from '@/utils/profileManager';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';
import { getNextStrandsHint, getStrandsHintButtonText, getAllHintedTiles } from '@/utils/strandsHints';
import { getUserStorageKey } from '@/utils/storageKeys';
import TutorialPanel from '@/components/tutorial/TutorialPanel';
import { GAME_TUTORIALS } from '@/data/tutorials';
import { useTutorial } from '@/hooks/useTutorial';
import { STRANDS_2026_01 } from './puzzles/strands-2026-01';
import { STRANDS_PUZZLES_FEB_2026 } from './puzzles/strands-2026-02';
import {
  serializePos,
  validateSelection,
  saveProgress,
  loadProgress,
  clearProgress,
  puzzlesHealthCheck,
} from './strandsLogic';
import { resetStrandsHints } from '@/utils/strandsHints';

// Merge January and February puzzles
const ALL_STRANDS_PUZZLES = [...STRANDS_2026_01, ...STRANDS_PUZZLES_FEB_2026];

const SAFE_PUZZLE = {
  date: 'fallback',
  theme: 'Seaside Escape',
  grid: [
    ['O', 'C', 'E', 'A', 'N', 'S'],
    ['B', 'E', 'A', 'C', 'H', 'L'],
    ['S', 'H', 'E', 'L', 'L', 'S'],
    ['T', 'I', 'D', 'E', 'S', 'U'],
    ['C', 'O', 'R', 'A', 'L', 'S'],
    ['S', 'A', 'N', 'D', 'S', 'A'],
  ],
  words: ['BEACH', 'SHELLS', 'TIDES', 'CORAL', 'SANDS'],
  spangram: 'OCEANS',
};

const getInitialState = (puzzle) => {
  if (!puzzle) {
    return {
      foundWords: [],
      foundSet: new Set(),
      lockedSet: new Set(),
      spangramFound: false,
      hintsUsed: 0,
      startedAt: Date.now(),
      completedAt: null,
    };
  }

  const savedProgress = loadProgress(puzzle.date);
  if (savedProgress) {
    return {
      foundWords: savedProgress.foundWords || [],
      foundSet: new Set(savedProgress.foundSet || []),
      lockedSet: new Set(savedProgress.lockedSet || []),
      spangramFound: !!savedProgress.spangramFound,
      hintsUsed: savedProgress.hintsUsed || 0,
      startedAt: savedProgress.startedAt || Date.now(),
      completedAt: savedProgress.completedAt || null,
    };
  }

  return {
    foundWords: [],
    foundSet: new Set(),
    lockedSet: new Set(),
    spangramFound: false,
    hintsUsed: 0,
    startedAt: Date.now(),
    completedAt: null,
  };
};

function StrandsGame({ puzzle, invalidToday, hasValidPuzzles, canCycle, onNewPuzzle }) {
  const initialState = useMemo(() => getInitialState(puzzle), [puzzle]);

  const [path, setPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundWords, setFoundWords] = useState(initialState.foundWords);
  const [foundSet, setFoundSet] = useState(initialState.foundSet);
  const [lockedSet, setLockedSet] = useState(initialState.lockedSet);
  const [spangramFound, setSpangramFound] = useState(initialState.spangramFound);
  const [spangramPath, setSpangramPath] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(initialState.hintsUsed);
  const [highlightedSet, setHighlightedSet] = useState(new Set());
  const [startedAt, setStartedAt] = useState(initialState.startedAt);
  const [completedAt, setCompletedAt] = useState(initialState.completedAt);
  const [winModal, setWinModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [shouldShake, setShouldShake] = useState(false);
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgesDrawer, setShowBadgesDrawer] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [learningLogModal, setLearningLogModal] = useState(false);
  const [showWinConfetti, setShowWinConfetti] = useState(false);
  const [hasCelebratedWin, setHasCelebratedWin] = useState(false);
  const [showFoundWords, setShowFoundWords] = useState(false);

  const tutorial = GAME_TUTORIALS.strands;
  const {
    isOpen: isTutorialOpen,
    openManual: openHowToPlay,
    close: closeTutorial,
    skip: skipTutorial,
    complete: completeTutorial,
    updateStep: updateTutorialStep,
    startMode,
    lastStep,
  } = useTutorial(tutorial.id);

  const prevWinRef = useRef(false);
  const initialWinHandledRef = useRef(false);

  const foundWordStrings = useMemo(() => foundWords.map((fw) => fw.word), [foundWords]);
  const puzzleId = puzzle ? `strands-${puzzle.date}` : null;
  const winStorageKey = puzzle ? getUserStorageKey(`strands-win-celebrated-${puzzle.date}`) : null;

  const hintButtonText = puzzle
    ? getStrandsHintButtonText(puzzleId, puzzle.words, foundWordStrings, puzzle.grid)
    : 'Hint';

  const hintedTiles = puzzle
    ? getAllHintedTiles(puzzleId, puzzle.words, foundWordStrings, puzzle.grid)
    : [];

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

  const allWordsFound = (nextFoundSet) => {
    if (!puzzle) return false;
    return puzzle.words.every((word) => nextFoundSet.has(word.toUpperCase()));
  };

  const completeGame = (nextFoundWords, nextSpangramFound) => {
    if (!puzzle || completedAt) return;

    const end = Date.now();
    const timeSec = Math.floor((end - (startedAt || end)) / 1000);

    const achievements = recordGameResult('strands', {
      date: puzzle.date,
      win: true,
      time: timeSec,
      hintsUsed,
      perfect: hintsUsed === 0,
      attempts: nextFoundWords.length + (nextSpangramFound ? 1 : 0),
      breakdown: { words: nextFoundWords.map((f) => f.word), spangram: nextSpangramFound },
    });
    setBadgeUnlocks(achievements || []);

    submitResult({
      gameKey: 'strands',
      mode: 'daily',
      success: true,
      attempts: nextFoundWords.length + (nextSpangramFound ? 1 : 0),
      durationMs: timeSec * 1000,
      metadata: { hintsUsed, perfect: hintsUsed === 0, puzzleDate: puzzle.date },
    }).catch((err) => console.warn('[Strands] Failed to submit to leaderboard:', err));

    const allWords = [
      ...nextFoundWords.map((f) => f.word),
      puzzle.spangram?.toUpperCase(),
    ].filter(Boolean);
    addWordsToLog(allWords, 'strands');

    setCompletedAt(end);
    setWinModal(true);
  };

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
      setPath((current) => [...current, [r, c]]);
    }
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
      const nextFoundWords = [...foundWords, { word: result.word, path: [...path] }];
      const nextFoundSet = new Set(foundSet);
      nextFoundSet.add(result.word);

      setFoundWords(nextFoundWords);
      setFoundSet(nextFoundSet);
      lockPositions(path);
      setToast({ message: `Found: ${result.word}`, duration: 1200 });
      setTimeout(() => setToast(null), 600);
      setPath([]);

      if (allWordsFound(nextFoundSet) && spangramFound) {
        completeGame(nextFoundWords, spangramFound);
      }
      return;
    }

    if (result.type === 'spangram') {
      const nextSpangramFound = true;
      setSpangramFound(true);
      setSpangramPath([...path]);
      lockPositions(path);
      setToast({ message: 'Spangram found!', duration: 1400 });
      setTimeout(() => setToast(null), 800);
      setPath([]);

      if (allWordsFound(foundSet) && nextSpangramFound) {
        completeGame(foundWords, nextSpangramFound);
      }
      return;
    }

    setToast({ message: 'Not in theme', duration: 1200 });
    setShouldShake(true);
    setTimeout(() => {
      setToast(null);
      setShouldShake(false);
    }, 600);
    clearPathWithFade();
  };

  const handleHint = () => {
    if (!puzzle) return;

    const hintResult = getNextStrandsHint(
      puzzleId,
      puzzle.words,
      foundWordStrings,
      puzzle.grid
    );

    setHintsUsed(hintResult.totalHintsUsed);
  };

  const handleReset = () => {
    if (!puzzle) return;
    clearProgress(puzzle.date);
    resetStrandsHints(`strands-${puzzle.date}`);
    setPath([]);
    setIsDragging(false);
    setFoundWords([]);
    setFoundSet(new Set());
    setLockedSet(new Set());
    setSpangramFound(false);
    setSpangramPath(null);
    setHintsUsed(0);
    setHighlightedSet(new Set());
    setStartedAt(Date.now());
    setCompletedAt(null);
    setWinModal(false);
    setToast(null);
    setShouldShake(false);
    setShowWinConfetti(false);
    setHasCelebratedWin(false);
    prevWinRef.current = false;
  };

  const handleNewPuzzle = () => {
    if (!canCycle) {
      handleReset();
      return;
    }
    onNewPuzzle();
  };

  const wordsFoundCount = foundWords.length;
  const totalWords = puzzle?.words?.length || 0;
  const gameStats = getGameStats('strands');

  useEffect(() => {
    const wonNow = Boolean(completedAt);
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
  }, [completedAt, hasCelebratedWin, winStorageKey]);
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <GameHeader
        title="Strands"
        onHowToPlay={openHowToPlay}
        onStats={() => setStatsModal(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        onLearningLog={() => setLearningLogModal(true)}
        gameComplete={!!completedAt}
      />

      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />

      {/* VIEWPORT-FIT CONTENT - NO SCROLL */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {puzzle ? (
          <>
            {/* DESKTOP SIDEBAR - Hidden on mobile */}
            <aside className="hidden lg:flex lg:flex-col lg:w-[340px] xl:w-[360px] border-r border-border p-4 gap-3 overflow-y-auto scrollbar-thin">
              {/* Theme Card */}
              <div 
                className="bg-gradient-to-br from-strands-ribbon/10 via-info/5 to-transparent border-2 border-strands-ribbon/40 rounded-2xl p-4 shadow-lg relative overflow-hidden" 
                data-tutorial="strands-theme"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-strands-ribbon/5 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-strands-ribbon animate-pulse"></div>
                    <div className="text-[10px] uppercase tracking-widest text-strands-ribbon font-bold">Today's Theme</div>
                  </div>
                  <div className="text-xl font-serif font-bold text-foreground leading-tight">
                    {puzzle.theme}
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-card border-2 border-card-border rounded-2xl p-4 shadow-sm flex-shrink-0">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-wordle-correct">{wordsFoundCount}</span>
                  <span className="text-sm text-text-muted">of {totalWords} words</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2.5 bg-surface rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-wordle-correct to-connections-green transition-all duration-500 ease-out"
                    style={{ width: `${(wordsFoundCount / totalWords) * 100}%` }}
                  />
                </div>

                {/* Found words list - scrollable if many */}
                {foundWords.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                    {foundWords.map((found) => (
                      <div 
                        key={found.word} 
                        className="flex items-center gap-2 text-xs bg-surface/50 px-2.5 py-1.5 rounded-lg"
                      >
                        <div className="w-1 h-1 rounded-full bg-wordle-correct flex-shrink-0"></div>
                        <span className="font-semibold text-foreground">{found.word}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Spangram */}
                {spangramFound && (
                  <div className="mt-3 pt-3 border-t border-border-default">
                    <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-wordle-present/20 to-wordle-correct/20 px-2.5 py-1.5 rounded-lg border border-wordle-present/40">
                      <span>✨</span>
                      <span className="font-bold text-wordle-present">Spangram found!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hint Button */}
              <button
                onClick={handleHint}
                disabled={completedAt || hintButtonText === 'All Revealed' || hintButtonText.includes('Hint Limit')}
                className="w-full py-3 px-4 rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 text-amber-900 dark:text-amber-100 font-bold text-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex-shrink-0" 
                data-tutorial="strands-hint"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>{hintButtonText}</span>
                </span>
              </button>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <button
                  onClick={handleReset}
                  className="py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
                  title="Restart puzzle"
                >
                  Restart
                </button>
                <button
                  onClick={handleNewPuzzle}
                  className="py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
                  title="Load new puzzle"
                >
                  New Puzzle
                </button>
              </div>

              {hintsUsed > 0 && (
                <div className="text-[10px] text-center text-text-muted bg-surface px-2 py-1.5 rounded-lg flex-shrink-0">
                  {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used
                </div>
              )}
            </aside>

            {/* MAIN GRID AREA - Takes remaining space */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* MOBILE TOP BAR - Only visible on mobile */}
              <div className="lg:hidden border-b border-border p-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  {/* Theme (compact) */}
                  <div className="flex-1 bg-gradient-to-r from-strands-ribbon/10 to-transparent border border-strands-ribbon/30 rounded-xl px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wide text-strands-ribbon font-bold mb-0.5">Theme</div>
                    <div className="text-sm font-bold text-foreground line-clamp-1">{puzzle.theme}</div>
                  </div>

                  {/* Progress (compact) */}
                  <button
                    onClick={() => setShowFoundWords(true)}
                    className="bg-card border border-card-border rounded-xl px-3 py-2 hover:bg-surface-hover transition-colors"
                  >
                    <div className="text-[9px] uppercase tracking-wide text-text-muted font-bold mb-0.5">Words</div>
                    <div className="text-sm font-bold text-wordle-correct">{wordsFoundCount}/{totalWords}</div>
                  </button>
                </div>
              </div>

              {/* GRID CONTAINER - Centers vertically and horizontally */}
              <div className="flex-1 flex items-center justify-center p-3 lg:p-6 overflow-hidden" data-tutorial="strands-grid">
                <div className="w-full max-w-[min(92vw,520px)] lg:max-w-[550px]">
                  <WinConfettiOverlay
                    active={showWinConfetti}
                    durationMs={3000}
                    intensity={0.9}
                    origin={CONFETTI_ORIGINS.corners}
                    palette={[
                      'hsl(var(--strands-spangram-ribbon))',
                      'hsl(var(--strands-ribbon))',
                      'hsl(var(--connections-yellow))',
                      'hsl(var(--info))'
                    ]}
                    onDone={() => setShowWinConfetti(false)}
                  />

                  {/* Win banner - appears in reserved space, doesn't shift layout */}
                  {completedAt && !winModal && (
                    <div className="mb-3 rounded-xl border-2 border-wordle-correct bg-gradient-to-r from-wordle-correct/10 to-connections-green/10 px-3 py-2 shadow-md animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-wordle-correct flex items-center gap-1.5">
                          <span>✅</span>
                          <span className="hidden sm:inline">Solved!</span>
                        </div>
                        <div className="text-text-muted text-[10px]">
                          {Math.floor(((completedAt || 0) - (startedAt || 0)) / 1000)}s · {hintsUsed} hints
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Premium Grid Container */}
                  <div className="bg-card border-2 border-card-border rounded-2xl p-3 lg:p-4 shadow-2xl relative overflow-hidden">
                    {/* Subtle inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-strands-ribbon/5 via-transparent to-info/5 pointer-events-none rounded-2xl"></div>
                    
                    <div className="relative">
                      <StrandsGrid
                        grid={puzzle.grid}
                        path={path}
                        lockedSet={lockedSet}
                        highlightedSet={highlightedSet}
                        foundWords={foundWords}
                        spangramPath={spangramPath}
                        isDragging={isDragging}
                        shouldShake={shouldShake}
                        hintedTiles={hintedTiles}
                        onStart={onStart}
                        onEnter={onEnter}
                        onEnd={onEnd}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE BOTTOM TOOLBAR */}
              <div className="lg:hidden border-t border-border p-3 flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={handleHint}
                    disabled={completedAt || hintButtonText === 'All Revealed' || hintButtonText.includes('Hint Limit')}
                    className="flex-1 py-2.5 px-3 rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 text-amber-900 dark:text-amber-100 font-bold text-xs hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    💡 {hintButtonText}
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface text-xs font-semibold hover:bg-surface-hover transition-colors"
                  >
                    Restart
                  </button>
                  <button
                    onClick={handleNewPuzzle}
                    className="py-2.5 px-3 rounded-xl border border-border bg-surface text-xs font-semibold hover:bg-surface-hover transition-colors"
                  >
                    New
                  </button>
                </div>
              </div>
            </main>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <div className="text-6xl mb-4">🧩</div>
              <div className="text-xl">No puzzle available.</div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE: FOUND WORDS BOTTOM SHEET */}
      {showFoundWords && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end animate-fade-in"
          onClick={() => setShowFoundWords(false)}
        >
          <div 
            className="w-full bg-card rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Found Words ({wordsFoundCount}/{totalWords})</h3>
              <button 
                onClick={() => setShowFoundWords(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-surface rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-wordle-correct to-connections-green transition-all duration-500"
                style={{ width: `${(wordsFoundCount / totalWords) * 100}%` }}
              />
            </div>

            {/* Words list */}
            {foundWords.length > 0 ? (
              <div className="space-y-2">
                {foundWords.map((found) => (
                  <div 
                    key={found.word} 
                    className="flex items-center gap-2 text-sm bg-surface px-3 py-2.5 rounded-lg border border-card-border"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-wordle-correct flex-shrink-0"></div>
                    <span className="font-semibold text-foreground">{found.word}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                No words found yet. Start connecting letters!
              </div>
            )}

            {spangramFound && (
              <div className="mt-4 pt-4 border-t border-border-default">
                <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-wordle-present/20 to-wordle-correct/20 px-3 py-2.5 rounded-lg border border-wordle-present">
                  <span className="text-lg">✨</span>
                  <span className="font-bold text-wordle-present">Spangram found!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WIN MODAL */}
      <Modal
        isOpen={winModal}
        title="🎉 Theme Completed!"
        onClose={() => setWinModal(false)}
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-1">Theme</div>
            <div className="text-xl font-serif font-bold text-foreground">{puzzle?.theme}</div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Time</div>
              <div className="text-xl font-bold text-foreground">{Math.floor(((completedAt || 0) - (startedAt || 0)) / 1000)}s</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Hints</div>
              <div className="text-xl font-bold text-foreground">{hintsUsed}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Perfect</div>
              <div className="text-xl font-bold text-foreground">{hintsUsed === 0 ? '✓' : '—'}</div>
            </div>
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

          <DailyReminder gameName="strands" />

          <BadgeEarnedRecap badges={badgeUnlocks} />
          <div className="mt-3">
            <BadgesProgressWidget variant="compact" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setWinModal(false);
                handleNewPuzzle();
              }}
              className="flex-1 py-3 bg-wordle-correct text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              New Puzzle
            </button>
            <button
              onClick={() => setWinModal(false)}
              className="flex-1 py-3 border border-border bg-surface text-foreground rounded-xl font-semibold hover:bg-surface-hover transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <BadgesDrawer
        isOpen={showBadgesDrawer}
        onClose={() => setShowBadgesDrawer(false)}
      />

      <BadgeDetailsSheet
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      <TutorialPanel
        isOpen={isTutorialOpen}
        tutorial={tutorial}
        startAt={startMode === 'resume' ? lastStep : 0}
        resumeStep={lastStep}
        onStepChange={updateTutorialStep}
        onClose={closeTutorial}
        onSkip={skipTutorial}
        onComplete={completeTutorial}
      />

      <StatisticsModal
        isOpen={statsModal}
        onClose={() => setStatsModal(false)}
        gameName="strands"
        stats={gameStats}
      />

      <LearningLogModal
        isOpen={learningLogModal}
        onClose={() => setLearningLogModal(false)}
        gameName="strands"
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

export default function StrandsPage() {
  const todayStr = useMemo(() => getTodayString(), []);
  const [puzzleOffset, setPuzzleOffset] = useState(0);
  const healthLoggedRef = useRef(false);
  const invalidLoggedRef = useRef(new Set());

  const { valid: validPuzzles, invalid: invalidPuzzles } = useMemo(
    () => puzzlesHealthCheck(ALL_STRANDS_PUZZLES),
    []
  );

  const todayAllIndex = useMemo(() => {
    return ALL_STRANDS_PUZZLES.findIndex((puzzle) => puzzle.date === todayStr);
  }, [todayStr]);

  const validIndexByDate = useMemo(() => {
    return new Map(validPuzzles.map((puzzle, index) => [puzzle.date, index]));
  }, [validPuzzles]);

  const baseIndex = useMemo(() => {
    if (validPuzzles.length === 0) return 0;
    const todayValidIndex = validIndexByDate.get(todayStr);
    if (typeof todayValidIndex === 'number') return todayValidIndex;
    if (todayAllIndex === -1) return 0;

    for (let offset = 1; offset <= ALL_STRANDS_PUZZLES.length; offset += 1) {
      const probeIndex = (todayAllIndex + offset) % ALL_STRANDS_PUZZLES.length;
      const probeDate = ALL_STRANDS_PUZZLES[probeIndex]?.date;
      const probeValidIndex = validIndexByDate.get(probeDate);
      if (typeof probeValidIndex === 'number') return probeValidIndex;
    }
    return 0;
  }, [validPuzzles.length, validIndexByDate, todayStr, todayAllIndex]);

  const puzzle = useMemo(() => {
    if (validPuzzles.length === 0) {
      return SAFE_PUZZLE;
    }
    const index = (baseIndex + puzzleOffset) % validPuzzles.length;
    return validPuzzles[index];
  }, [validPuzzles, baseIndex, puzzleOffset]);

  const invalidToday = useMemo(() => {
    return invalidPuzzles.find((item) => item.date === todayStr);
  }, [invalidPuzzles, todayStr]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (healthLoggedRef.current) return;
    healthLoggedRef.current = true;

    if (invalidPuzzles.length > 0) {
      console.warn(`[Strands] Invalid puzzles detected: ${invalidPuzzles.length}`);
      console.warn(invalidPuzzles);
    }
  }, [invalidPuzzles]);

  useEffect(() => {
    if (!invalidToday) return;
    if (process.env.NODE_ENV === 'production') return;
    if (invalidLoggedRef.current.has(invalidToday.date)) return;
    invalidLoggedRef.current.add(invalidToday.date);
    console.error(`[Strands] Puzzle validation failed for ${invalidToday.date}:`, invalidToday.errors);
  }, [invalidToday]);

  const handleNewPuzzle = () => {
    if (validPuzzles.length <= 1) {
      return;
    }
    setPuzzleOffset((prev) => (prev + 1) % validPuzzles.length);
  };

  return (
    <StrandsGame
      key={puzzle?.date || 'fallback'}
      puzzle={puzzle}
      invalidToday={invalidToday}
      hasValidPuzzles={validPuzzles.length > 0}
      canCycle={validPuzzles.length > 1}
      onNewPuzzle={handleNewPuzzle}
    />
  );
}