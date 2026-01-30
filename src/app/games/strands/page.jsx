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
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import { getTodayString, recordGameResult, getGameStats } from '@/utils/profileManager';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';
import { getNextStrandsHint, getStrandsHintButtonText, getAllHintedTiles } from '@/utils/strandsHints';
import { getUserStorageKey } from '@/utils/storageKeys';
import { STRANDS_2026_01 } from './puzzles/strands-2026-01';
import { STRANDS_PUZZLES_FEB_2026 } from './puzzles/strands-2026-02';

// Merge January and February puzzles
const ALL_STRANDS_PUZZLES = [...STRANDS_2026_01, ...STRANDS_PUZZLES_FEB_2026];
import {
  serializePos,
  validateSelection,
  saveProgress,
  loadProgress,
  clearProgress,
  puzzlesHealthCheck,
} from './strandsLogic';
import { resetStrandsHints } from '@/utils/strandsHints';

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
  const [howToPlayModal, setHowToPlayModal] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [learningLogModal, setLearningLogModal] = useState(false);
  const [showWinConfetti, setShowWinConfetti] = useState(false);
  const [hasCelebratedWin, setHasCelebratedWin] = useState(false);

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
    <div className="min-h-screen bg-background">
      <GameHeader
        title="Strands"
        onHowToPlay={() => setHowToPlayModal(true)}
        onStats={() => setStatsModal(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        onLearningLog={() => setLearningLogModal(true)}
        gameComplete={!!completedAt}
      />

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {invalidToday && process.env.NODE_ENV !== 'production' && (
          <div className="bg-card border border-border-active rounded-lg p-4 mb-4">
            <h3 className="font-bold text-red-900 mb-2">Today&apos;s puzzle is invalid (dev fallback loaded):</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {invalidToday.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {!hasValidPuzzles && (
          <div className="bg-card border border-border-active rounded-lg p-4 mb-4">
            <h3 className="font-bold text-red-900 mb-2">No valid puzzles available.</h3>
            <p className="text-sm text-red-700">Showing a safe fallback puzzle.</p>
          </div>
        )}

        {puzzle ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="bg-crossword-highlight border-2 border-crossword-active-ring rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide text-crossword-active-ring font-bold mb-2">Today&apos;s Theme</div>
                <div className="text-xl font-serif font-bold text-foreground">{puzzle.theme}</div>
              </div>

              <div className="bg-card border-2 border-card-border rounded-xl p-4">
                <div className="text-sm text-text-muted mb-3">
                  <span className="font-bold text-2xl text-foreground">{wordsFoundCount}</span>
                  <span className="text-text-muted"> of {totalWords}</span>
                  <span className="text-text-muted"> theme words found.</span>
                </div>

                {foundWords.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {foundWords.map((found) => (
                      <div key={found.word} className="text-sm text-foreground font-medium">
                        ? {found.word}
                      </div>
                    ))}
                  </div>
                )}

                {spangramFound && (
                  <div className="pt-3 border-t border-border-default">
                    <div className="text-sm font-bold text-wordle-correct">? Spangram found!</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleHint}
                disabled={completedAt || hintButtonText === 'All Revealed' || hintButtonText.includes('Hint Limit')}
                className="w-full py-3 px-4 rounded-full border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ?? {hintButtonText}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleReset}
                  className="py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-surface-hover transition"
                >
                  Restart
                </button>
                <button
                  onClick={handleNewPuzzle}
                  className="py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-surface-hover transition"
                >
                  New Puzzle
                </button>
              </div>

              {hintsUsed > 0 && (
                <div className="text-xs text-center text-text-muted">
                  {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used
                </div>
              )}
            </div>

            <div className="relative max-w-md mx-auto lg:mx-0 w-full">
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

              {completedAt && !winModal && (
                <div className="mb-3 w-full rounded-xl border border-border-default bg-card px-4 py-3 text-xs text-text-muted flex items-center justify-between">
                  <div className="font-semibold text-foreground">✅ Solved</div>
                  <div>
                    Time: {Math.floor(((completedAt || 0) - (startedAt || 0)) / 1000)}s · Hints: {hintsUsed} · Words: {wordsFoundCount}/{totalWords}
                  </div>
                </div>
              )}

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
        ) : (
          <div className="text-center text-text-muted">No puzzle available.</div>
        )}
      </div>

      <Modal
        isOpen={winModal}
        title="Theme completed!"
        actions={(
          <>
            <button
              onClick={() => setWinModal(false)}
              className="w-full py-3 bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))] rounded-lg hover:bg-[hsl(var(--button-primary-hover))] transition-all font-bold"
            >
              Close
            </button>
            <button
              onClick={() => {
                setWinModal(false);
                handleNewPuzzle();
              }}
              className="w-full py-3 border border-border rounded-lg hover:bg-surface-hover transition-all font-bold"
            >
              New Puzzle
            </button>
          </>
        )}
      >
        <div className="text-center space-y-4">
          <div className="text-text-muted">Theme: <span className="font-semibold text-foreground">{puzzle?.theme}</span></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-border-default bg-card px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-text-muted">Time</div>
              <div className="text-lg font-bold text-foreground">{Math.floor(((completedAt || 0) - (startedAt || 0)) / 1000)}s</div>
            </div>
            <div className="rounded-xl border border-border-default bg-card px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-text-muted">Hints</div>
              <div className="text-lg font-bold text-foreground">{hintsUsed}</div>
            </div>
            <div className="rounded-xl border border-border-default bg-card px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-text-muted">Perfect</div>
              <div className="text-lg font-bold text-foreground">{hintsUsed === 0 ? 'Yes' : '?'}</div>
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
          <BadgeEarnedRecap badges={badgeUnlocks} />
          <div className="mt-3">
            <BadgesProgressWidget variant="compact" />
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

      <UnifiedHowToPlay
        isOpen={howToPlayModal}
        onClose={() => setHowToPlayModal(false)}
        gameName="strands"
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
      />

      {toast && (
        <Toast
          message={typeof toast === 'string' ? toast : toast.message}
          duration={typeof toast === 'object' && toast?.duration ? toast.duration : 2000}
          onExited={() => setToast(null)}
        />
      )}

      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />
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


