"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameHeader from "@/components/GameHeader";
import Button from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import StatisticsModal from "@/components/StatisticsModal";
import BadgeToastQueue from "@/components/BadgeToastQueue";
import BadgeDetailsSheet from "@/components/BadgeDetailsSheet";
import BadgeEarnedRecap from "@/components/BadgeEarnedRecap";
import BadgesProgressWidget from "@/components/BadgesProgressWidget";
import BadgesDrawer from "@/components/BadgesDrawer";
import DailyReminder from "@/components/DailyReminder";
import WinConfettiOverlay from "@/components/WinConfettiOverlay";
import TutorialPanel from "@/components/tutorial/TutorialPanel";
import { GAME_TUTORIALS } from "@/data/tutorials";
import { useGameContext } from "@/hooks/useGameContext";
import { useTutorial } from "@/hooks/useTutorial";
import { submitResult } from "@/utils/resultsClient";
import { getSession } from "@/utils/sessionManager";
import { addWordsToLog } from "@/utils/learningLogEngine";
import { getGameStats, getTodayString, recordGameResult } from "@/utils/profileManager";
import {
  DIRECTIONS,
  MAX_REVEALS_PER_PUZZLE,
  buildCrosswordModel,
  buildProgressPayload,
  cloneLetters,
  createEmptyLetters,
  findFirstPlayableCell,
  findNextArrowCell,
  findNextEditableCellInSegment,
  findPrevEditableCellInSegment,
  getActiveCellNumber,
  getHintLevel1,
  getHintLevel2,
  getHintLevel3,
  getIncorrectSegments,
  getNewlySolvedSegments,
  getSegmentForCell,
  getTabNavigationTarget,
  getCairoDateKey,
  isPlayableAt,
  isPuzzleSolved,
  loadGuestProgress,
  makeCellKey,
  normalizePuzzlePayload,
  normalizeRestoredProgress,
  recomputeSolvedAndLocked,
  resolveActiveSegment,
  saveGuestProgress,
} from "./crosswordLogic";

const SOLVE_FLASH_MS = 720;
const INCORRECT_FLASH_MS = 700;
const HINT_FLASH_MS = 2000;
const MESSAGE_MS = 2600;

const EMPTY_HINTS = { level1Count: 0, level2Count: 0, level3Count: 0, revealsUsed: 0 };

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function suffix(direction) {
  return direction === DIRECTIONS.ACROSS ? "A" : "D";
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 stroke-current">
      <rect x="5" y="10" width="14" height="10" rx="2" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ObstacleGlyph({ type }) {
  if (type === "circle") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-foreground/70" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="currentColor" />
      </svg>
    );
  }
  if (type === "triangle") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-foreground/70" aria-hidden="true">
        <polygon points="12,5 20,19 4,19" fill="currentColor" />
      </svg>
    );
  }
  if (type === "diamond") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-foreground/70" aria-hidden="true">
        <polygon points="12,3 21,12 12,21 3,12" fill="currentColor" />
      </svg>
    );
  }
  return null;
}

function ClueTabs({ active, onChange }) {
  return (
    <Tabs value={active} onValueChange={onChange} variant="segmented">
      <TabsList className="rounded-xl border border-border-default bg-card p-1 shadow-sm">
        <TabsTrigger value={DIRECTIONS.ACROSS} className="min-w-[88px]">
          Across
        </TabsTrigger>
        <TabsTrigger value={DIRECTIONS.DOWN} className="min-w-[88px]">
          Down
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function ClueList({ clues, model, activeSegmentId, solvedSegmentIds, onSelect }) {
  if (!clues.length) {
    return <div className="px-2 py-4 text-sm text-text-muted">No clues available.</div>;
  }

  return (
    <div className="max-h-[38vh] overflow-y-auto pr-1 lg:max-h-[65vh]">
      {clues.map((clue) => {
        const segment = model.segmentById.get(clue.id);
        const isActive = activeSegmentId === clue.id;
        const isSolved = solvedSegmentIds.has(clue.id);

        return (
          <Button
            key={clue.id}
            type="button"
            onClick={() => segment && onSelect(segment)}
            variant="ghost"
            size="sm"
            className={`mb-1.5 h-auto w-full justify-start rounded-xl border px-3 py-2 text-left transition ${
              isActive
                ? "border-info/50 bg-info/10"
                : "border-border-default bg-card hover:border-border-active hover:bg-surface-hover"
            } ${isSolved ? "state-correct" : ""}`}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wide text-text-muted">
                  {clue.number}
                  {segment ? suffix(segment.direction) : ""}
                </span>
                <span className="block text-sm text-foreground">{clue.text}</span>
              </span>
              {isSolved ? (
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                    <path d="M5 12.5 9.2 16.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : null}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

function MobileCluesPanel({ activeTab, onTabChange, activeClues, model, activeSegment, solvedSegmentIds, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  // Find active clue text
  const activeClue = activeClues.find(c => activeSegment && c.id === activeSegment.id);
  const previewText = activeClue
    ? `${activeClue.number}${suffix(activeSegment)}: ${activeClue.text}`
    : "Tap a cell to see its clue";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-background/95 shadow-lg backdrop-blur lg:hidden">
      {/* Collapsed: just the active clue + expand button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <span className="flex-1 truncate text-sm font-medium text-foreground">{previewText}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded: full clues list */}
      {expanded && (
        <div className="mx-auto max-w-3xl px-3 pb-3">
          <div className="rounded-2xl border border-border-default bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">Clues</h2>
              <ClueTabs active={activeTab} onChange={onTabChange} />
            </div>
            <ClueList
              clues={activeClues}
              model={model}
              activeSegmentId={activeSegment?.id || null}
              solvedSegmentIds={solvedSegmentIds}
              onSelect={(segment) => { onSelect(segment); setExpanded(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrosswordPage() {
  const { returnUrl, returnLabel } = useGameContext();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [puzzle, setPuzzle] = useState(null);
  const [model, setModel] = useState(null);

  const [requestedDate, setRequestedDate] = useState("");
  const [servedDate, setServedDate] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  const [storageMode, setStorageMode] = useState("local");
  const [isHydrated, setIsHydrated] = useState(false);

  const [letters, setLetters] = useState([]);
  const [activeCell, setActiveCell] = useState({ r: 0, c: 0 });
  const [direction, setDirection] = useState(DIRECTIONS.ACROSS);
  const [activeTab, setActiveTab] = useState(DIRECTIONS.ACROSS);

  const [solvedSegmentIds, setSolvedSegmentIds] = useState(new Set());
  const [lockedCells, setLockedCells] = useState(new Set());
  const [segmentResults, setSegmentResults] = useState(new Map());

  const [justSolvedIds, setJustSolvedIds] = useState(new Set());
  const [checkedIncorrectIds, setCheckedIncorrectIds] = useState(new Set());
  const [hintFocusCells, setHintFocusCells] = useState(new Set());
  const [hintIncorrectCells, setHintIncorrectCells] = useState(new Set());
  const [hintCycle, setHintCycle] = useState({ segmentId: null, level: 0 });
  const [hintsUsed, setHintsUsed] = useState(EMPTY_HINTS);

  const [statusMessage, setStatusMessage] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [showWinConfetti, setShowWinConfetti] = useState(false);

  // Trigger confetti on completion
  useEffect(() => {
    if (isComplete) {
      setShowWinConfetti(true);
    }
  }, [isComplete]);

  // Modal and drawer state
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);
  const [showBadgesDrawer, setShowBadgesDrawer] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);

  // Tutorial
  const tutorial = GAME_TUTORIALS.crossword;
  const {
    isOpen: isTutorialOpen,
    openManual: openHowToPlay,
    close: closeTutorial,
    skip: skipTutorial,
    complete: completeTutorial,
    updateStep: updateTutorialStep,
    startMode,
    lastStep,
  } = useTutorial(tutorial?.id);

  const [startedAt, setStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const flashTimeoutRef = useRef(null);
  const incorrectTimeoutRef = useRef(null);
  const hintTimeoutRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const completionSubmitRef = useRef(false);
  const previousSolvedRef = useRef(new Set());
  const elapsedSecondsRef = useRef(0);
  const autosaveFailCountRef = useRef(0);

  // Load stats on mount
  useEffect(() => {
    const gameStats = getGameStats('crossword');
    setStats(gameStats);
  }, []);

  const activeResolution = useMemo(() => {
    if (!model) return { segment: null, direction };
    return resolveActiveSegment(model, activeCell.r, activeCell.c, direction);
  }, [model, activeCell.r, activeCell.c, direction]);

  const activeSegment = activeResolution.segment;
  const effectiveDirection = activeResolution.direction;

  const activeWordCellKeys = useMemo(() => {
    if (!activeSegment) return new Set();
    return new Set(activeSegment.cells.map((cell) => makeCellKey(cell.r, cell.c)));
  }, [activeSegment]);

  useEffect(() => {
    if (effectiveDirection !== direction) {
      setDirection(effectiveDirection);
      setActiveTab(effectiveDirection);
    }
  }, [effectiveDirection, direction]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!startedAt || isComplete) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt, isComplete]);

  const showIncorrectSegments = useCallback((segmentIds) => {
    if (incorrectTimeoutRef.current) clearTimeout(incorrectTimeoutRef.current);
    const next = new Set(segmentIds);
    setCheckedIncorrectIds(next);
    if (next.size) {
      incorrectTimeoutRef.current = setTimeout(() => {
        setCheckedIncorrectIds(new Set());
      }, INCORRECT_FLASH_MS);
    }
  }, []);

  const showHintFocus = useCallback((cellKeys) => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setHintFocusCells(new Set(cellKeys));
    if (cellKeys.length) {
      hintTimeoutRef.current = setTimeout(() => {
        setHintFocusCells(new Set());
      }, HINT_FLASH_MS);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (incorrectTimeoutRef.current) clearTimeout(incorrectTimeoutRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzle() {
      try {
        setIsLoading(true);
        setLoadError("");

        const cairoDate = getCairoDateKey();
        const session = getSession();
        const loggedIn = session?.role === "USER";

        const response = await fetch(`/api/crossword/daily?date=${encodeURIComponent(cairoDate)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Puzzle request failed (${response.status})`);

        const payload = await response.json();
        const normalizedPuzzle = normalizePuzzlePayload(payload);
        const nextModel = buildCrosswordModel(normalizedPuzzle);

        let mode = loggedIn ? "db" : "local";
        let restored = null;

        if (loggedIn) {
          try {
            const progressRes = await fetch(`/api/crossword/progress?date=${encodeURIComponent(cairoDate)}`, { cache: "no-store" });
            if (progressRes.ok) {
              const progressJson = await progressRes.json();
              restored = normalizeRestoredProgress(progressJson.progress, normalizedPuzzle);
            } else if (progressRes.status === 401) {
              mode = "local";
            }
          } catch {
            mode = "local";
          }
        }

        if (!restored && mode === "local") {
          restored = loadGuestProgress(cairoDate, normalizedPuzzle);
        }

        const initialLetters = restored?.letters || createEmptyLetters(normalizedPuzzle);
        const initialActiveCell = restored?.activeCell || findFirstPlayableCell(normalizedPuzzle);
        const initialDirection = restored?.direction || DIRECTIONS.ACROSS;
        const initialHints = restored?.hintsUsed || EMPTY_HINTS;
        const restoredElapsedSeconds = restored?.elapsedSeconds || 0;
        const initialComputed = recomputeSolvedAndLocked(normalizedPuzzle, nextModel, initialLetters);
        const restoredSolved = isPuzzleSolved(nextModel, initialComputed.solvedSegmentIds);

        if (cancelled) return;

        setPuzzle(normalizedPuzzle);
        setModel(nextModel);
        setRequestedDate(cairoDate);
        setServedDate(String(payload.servedDate || normalizedPuzzle.date || cairoDate));
        setUsingFallback(Boolean(payload.usingFallback));
        setStorageMode(mode);

        setLetters(initialLetters);
        setActiveCell(initialActiveCell);
        setDirection(initialDirection);
        setActiveTab(initialDirection);
        setHintsUsed(initialHints);

        setStartedAt(Date.now() - restoredElapsedSeconds * 1000);
        setElapsedSeconds(restoredElapsedSeconds);
        setSubmitState(restoredSolved ? "submitted" : "idle");
        setIsComplete(restoredSolved);
        completionSubmitRef.current = restoredSolved;
        previousSolvedRef.current = initialComputed.solvedSegmentIds;
        setIsHydrated(true);
      } catch (error) {
        if (cancelled) return;
        console.error("[crossword] init failed", error);
        setLoadError(error?.message || "Failed to load crossword");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPuzzle();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!puzzle || !model || !letters.length) return;

    const computed = recomputeSolvedAndLocked(puzzle, model, letters);
    const newlySolved = getNewlySolvedSegments(previousSolvedRef.current, computed.solvedSegmentIds);

    setSegmentResults(computed.segmentResults);
    setSolvedSegmentIds(computed.solvedSegmentIds);
    setLockedCells(computed.lockedCells);

    const nowSolved = isPuzzleSolved(model, computed.solvedSegmentIds);
    setIsComplete(nowSolved);

    if (nowSolved && !completionSubmitRef.current) {
      setStatusMessage({ type: "success", text: "Puzzle solved. Great work." });
    }

    if (newlySolved.length) {
      setJustSolvedIds((prev) => new Set([...prev, ...newlySolved]));
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setJustSolvedIds(new Set());
      }, SOLVE_FLASH_MS);
    }

    previousSolvedRef.current = computed.solvedSegmentIds;
  }, [puzzle, model, letters]);

  useEffect(() => {
    if (!isComplete || completionSubmitRef.current || !requestedDate) return;

    completionSubmitRef.current = true;
    const result = {
      date: getTodayString(),
      win: true,
      time: elapsedSecondsRef.current,
      puzzleId: `crossword-${requestedDate}`,
      perfect: hintsUsed.revealsUsed === 0,
    };
    const achievements = recordGameResult("crossword", result);
    setStats(getGameStats("crossword"));
    setBadgeUnlocks(achievements || []);

    if (model?.segments?.length) {
      const solvedWords = Array.from(
        new Set(
          model.segments
            .map((segment) => segment.solution)
            .filter((word) => typeof word === "string" && word.length > 0)
        )
      );
      if (solvedWords.length) {
        addWordsToLog(solvedWords, "crossword");
      }
    }

    setSubmitState("submitting");

    submitResult({
      gameKey: "crossword",
      mode: "daily",
      success: true,
      durationMs: elapsedSecondsRef.current * 1000,
      metadata: { requestedDate, servedDate },
    })
      .then(() => setSubmitState("submitted"))
      .catch(() => setSubmitState("error"));
  }, [isComplete, requestedDate, servedDate, hintsUsed.revealsUsed, model]);

  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);

  useEffect(() => {
    if (!isHydrated || !puzzle || !requestedDate) return;

    const payload = buildProgressPayload({
      letters,
      solvedSegmentIds,
      hintsUsed,
      activeCell,
      direction,
      elapsedSeconds,
    });

    if (storageMode === "db") {
      // Stop retrying after 3 consecutive failures to avoid spamming a broken endpoint
      if (autosaveFailCountRef.current >= 3) return;
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = setTimeout(() => {
        fetch("/api/crossword/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: requestedDate, progress: payload }),
        })
          .then((res) => {
            if (res.ok) {
              autosaveFailCountRef.current = 0;
            } else {
              autosaveFailCountRef.current += 1;
              if (autosaveFailCountRef.current >= 3) {
                console.warn("[crossword] db autosave disabled after 3 failures, falling back to local");
                saveGuestProgress(requestedDate, payload);
              }
            }
          })
          .catch(() => {
            autosaveFailCountRef.current += 1;
            if (autosaveFailCountRef.current >= 3) {
              console.warn("[crossword] db autosave disabled after 3 failures, falling back to local");
              saveGuestProgress(requestedDate, payload);
            }
          });
      }, 420);
      return;
    }

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      saveGuestProgress(requestedDate, payload);
    }, 420);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, storageMode, requestedDate, puzzle, letters, solvedSegmentIds, hintsUsed, activeCell, direction]);

  const selectSegment = useCallback((segment) => {
    if (!segment?.cells?.length) return;
    setDirection(segment.direction);
    setActiveTab(segment.direction);
    setActiveCell({ ...segment.cells[0] });
    setHintIncorrectCells(new Set());
    setHintFocusCells(new Set());
    setHintCycle({ segmentId: null, level: 0 });
  }, []);

  const handleCellClick = useCallback((r, c) => {
    if (!puzzle || !model || !isPlayableAt(puzzle, r, c)) return;

    if (activeCell.r === r && activeCell.c === c) {
      const toggled = direction === DIRECTIONS.ACROSS ? DIRECTIONS.DOWN : DIRECTIONS.ACROSS;
      setDirection(toggled);
      setActiveTab(toggled);
    } else {
      setActiveCell({ r, c });
    }

    setHintIncorrectCells(new Set());
    setHintFocusCells(new Set());
    setHintCycle({ segmentId: null, level: 0 });
  }, [puzzle, model, activeCell.r, activeCell.c, direction]);

  const handleCheckWord = useCallback(() => {
    if (!activeSegment) {
      setStatusMessage({ type: "info", text: "Select a clue first." });
      return;
    }

    const result = segmentResults.get(activeSegment.id);
    if (!result?.filled) {
      setStatusMessage({ type: "info", text: `${activeSegment.number}${suffix(activeSegment.direction)} is not fully filled yet.` });
      return;
    }

    if (result.correct) {
      setStatusMessage({ type: "success", text: `${activeSegment.number}${suffix(activeSegment.direction)} is correct.` });
      return;
    }

    showIncorrectSegments([activeSegment.id]);
    setStatusMessage({ type: "warning", text: `${activeSegment.number}${suffix(activeSegment.direction)} has errors.` });
  }, [activeSegment, segmentResults, showIncorrectSegments]);

  const handleCheckPuzzle = useCallback(() => {
    if (!model) return;

    const incorrect = getIncorrectSegments(model, segmentResults);
    if (!incorrect.length) {
      setStatusMessage({ type: isComplete ? "success" : "info", text: isComplete ? "Puzzle is fully correct." : "No completed words are wrong right now." });
      return;
    }

    showIncorrectSegments(incorrect);
    setStatusMessage({ type: "warning", text: `${incorrect.length} completed word${incorrect.length > 1 ? "s are" : " is"} incorrect.` });
  }, [model, segmentResults, isComplete, showIncorrectSegments]);

  const handleClearWord = useCallback(() => {
    if (!activeSegment || !letters.length) return;

    const next = cloneLetters(letters);
    let cleared = 0;

    for (const cell of activeSegment.cells) {
      const key = makeCellKey(cell.r, cell.c);
      if (lockedCells.has(key)) continue;
      if (next[cell.r][cell.c]) {
        next[cell.r][cell.c] = "";
        cleared += 1;
      }
    }

    if (!cleared) {
      setStatusMessage({ type: "info", text: "No editable letters to clear in this word." });
      return;
    }

    setLetters(next);
    setHintIncorrectCells(new Set());
    setHintFocusCells(new Set());
    setHintCycle({ segmentId: null, level: 0 });
    setStatusMessage({ type: "info", text: "Current word cleared." });
  }, [activeSegment, letters, lockedCells]);

  const handleHint = useCallback(() => {
    if (!model || !puzzle || !activeSegment) {
      setStatusMessage({ type: "info", text: "Select a clue first." });
      return;
    }

    const level2 = hintCycle.segmentId === activeSegment.id && hintCycle.level === 1;

    if (!level2) {
      const hint = getHintLevel1({ model, letters, activeSegment, activeDirection: effectiveDirection, segmentResults });
      setHintsUsed((prev) => ({ ...prev, level1Count: prev.level1Count + 1 }));
      setHintCycle({ segmentId: activeSegment.id, level: 1 });
      setHintIncorrectCells(new Set());

      if (hint?.targetCell) {
        setActiveCell({ ...hint.targetCell });
        showHintFocus([makeCellKey(hint.targetCell.r, hint.targetCell.c)]);
      } else if (hint?.targetCells?.length) {
        showHintFocus(hint.targetCells.map((cell) => makeCellKey(cell.r, cell.c)));
      } else {
        showHintFocus([]);
      }

      setStatusMessage({ type: "info", text: hint.message });
      return;
    }

    const hint = getHintLevel2({ activeSegment, letters, puzzle });
    setHintsUsed((prev) => ({ ...prev, level2Count: prev.level2Count + 1 }));
    setHintCycle({ segmentId: activeSegment.id, level: 2 });

    const wrong = new Set((hint?.incorrectCells || []).map((cell) => makeCellKey(cell.r, cell.c)));
    setHintIncorrectCells(wrong);
    setHintFocusCells(new Set());
    setStatusMessage({ type: wrong.size ? "warning" : "success", text: hint?.message || "No incorrect letters found." });
  }, [model, puzzle, activeSegment, hintCycle.segmentId, hintCycle.level, letters, effectiveDirection, segmentResults, showHintFocus]);

  const handleReveal = useCallback(() => {
    if (!activeSegment || !puzzle || !letters.length) {
      setStatusMessage({ type: "info", text: "Select a clue first." });
      return;
    }

    if (hintsUsed.revealsUsed >= MAX_REVEALS_PER_PUZZLE) {
      setStatusMessage({ type: "warning", text: "No reveals left for this puzzle." });
      return;
    }

    const allowed = window.confirm(
      `Reveal one letter in ${activeSegment.number}${suffix(activeSegment.direction)}? (${MAX_REVEALS_PER_PUZZLE - hintsUsed.revealsUsed} left)`
    );
    if (!allowed) return;

    const reveal = getHintLevel3({ activeSegment, letters, puzzle, lockedCells });
    if (!reveal?.reveal) {
      setStatusMessage({ type: "info", text: "No revealable letters in this word." });
      return;
    }

    const next = cloneLetters(letters);
    next[reveal.reveal.r][reveal.reveal.c] = reveal.reveal.letter;
    setLetters(next);
    setActiveCell({ r: reveal.reveal.r, c: reveal.reveal.c });

    setHintsUsed((prev) => ({
      ...prev,
      level3Count: prev.level3Count + 1,
      revealsUsed: prev.revealsUsed + 1,
    }));

    setHintCycle({ segmentId: null, level: 0 });
    setHintIncorrectCells(new Set());
    showHintFocus([makeCellKey(reveal.reveal.r, reveal.reveal.c)]);
    setStatusMessage({ type: "info", text: `${reveal.message} (${MAX_REVEALS_PER_PUZZLE - (hintsUsed.revealsUsed + 1)} left)` });
  }, [activeSegment, puzzle, letters, hintsUsed.revealsUsed, lockedCells, showHintFocus]);

  useEffect(() => {
    if (!puzzle || !model || !letters.length) return;

    function handleKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const key = event.key;
      if (isComplete) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) {
          event.preventDefault();
        }
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        event.preventDefault();
        const next = findNextArrowCell(puzzle, activeCell.r, activeCell.c, key);
        setActiveCell(next);
        if (key === "ArrowLeft" || key === "ArrowRight") {
          setDirection(DIRECTIONS.ACROSS);
          setActiveTab(DIRECTIONS.ACROSS);
        } else {
          setDirection(DIRECTIONS.DOWN);
          setActiveTab(DIRECTIONS.DOWN);
        }
        setHintIncorrectCells(new Set());
        setHintFocusCells(new Set());
        setHintCycle({ segmentId: null, level: 0 });
        return;
      }

      if (key === "Tab") {
        event.preventDefault();
        if (!activeSegment) return;
        const target = getTabNavigationTarget(model, activeSegment.id, effectiveDirection, event.shiftKey);
        if (!target?.cells?.length) return;

        setDirection(target.direction);
        setActiveTab(target.direction);
        setActiveCell({ ...target.cells[0] });
        setHintIncorrectCells(new Set());
        setHintFocusCells(new Set());
        setHintCycle({ segmentId: null, level: 0 });
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        if (!activeSegment) return;

        const next = cloneLetters(letters);
        const currentKey = makeCellKey(activeCell.r, activeCell.c);
        const currentLocked = lockedCells.has(currentKey);
        const currentValue = next[activeCell.r]?.[activeCell.c] || "";

        if (!currentLocked && currentValue) {
          next[activeCell.r][activeCell.c] = "";
          setLetters(next);
          setCheckedIncorrectIds(new Set());
          setHintIncorrectCells(new Set());
          setHintFocusCells(new Set());
          setHintCycle({ segmentId: null, level: 0 });
          return;
        }

        const prev = findPrevEditableCellInSegment(activeSegment, activeCell.r, activeCell.c, lockedCells);
        if (prev.r === activeCell.r && prev.c === activeCell.c) return;

        next[prev.r][prev.c] = "";
        setLetters(next);
        setActiveCell(prev);
        setCheckedIncorrectIds(new Set());
        setHintIncorrectCells(new Set());
        setHintFocusCells(new Set());
        setHintCycle({ segmentId: null, level: 0 });
        return;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();

        const fallbackDirection = effectiveDirection === DIRECTIONS.ACROSS ? DIRECTIONS.DOWN : DIRECTIONS.ACROSS;
        const segment =
          activeSegment ||
          getSegmentForCell(model, activeCell.r, activeCell.c, effectiveDirection) ||
          getSegmentForCell(model, activeCell.r, activeCell.c, fallbackDirection);

        if (!segment) return;

        let target = { ...activeCell };
        let targetKey = makeCellKey(target.r, target.c);

        if (lockedCells.has(targetKey)) {
          const nextEditable = findNextEditableCellInSegment(segment, target.r, target.c, lockedCells);
          target = nextEditable;
          targetKey = makeCellKey(target.r, target.c);
        }

        if (lockedCells.has(targetKey) || !isPlayableAt(puzzle, target.r, target.c)) return;

        const next = cloneLetters(letters);
        next[target.r][target.c] = key.toUpperCase();
        setLetters(next);

        const forward = findNextEditableCellInSegment(segment, target.r, target.c, lockedCells);
        setActiveCell(forward);

        setCheckedIncorrectIds(new Set());
        setHintIncorrectCells(new Set());
        setHintFocusCells(new Set());
        setHintCycle({ segmentId: null, level: 0 });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [puzzle, model, letters, activeCell, activeSegment, effectiveDirection, lockedCells, isComplete]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-20 overflow-x-hidden">
        <GameHeader 
          title="Mini Crossword" 
          onHowToPlay={openHowToPlay}
          onStats={() => setShowStats(true)}
          onBadges={() => setShowBadgesDrawer(true)}
          gameComplete={false}
          returnUrl={returnUrl} 
          returnLabel={returnLabel} 
        />
        <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 pt-6">
          <div className="flex items-center gap-3 rounded-xl border border-border-default bg-card px-4 py-3 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-foreground" />
            <div className="text-sm font-medium text-foreground">Loading daily crossword...</div>
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !puzzle || !model) {
    return (
      <div className="min-h-[100dvh] bg-background pb-20 overflow-x-hidden">
        <GameHeader 
          title="Mini Crossword" 
          onHowToPlay={openHowToPlay}
          onStats={() => setShowStats(true)}
          onBadges={() => setShowBadgesDrawer(true)}
          gameComplete={false}
          returnUrl={returnUrl} 
          returnLabel={returnLabel} 
        />
        <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 pt-6">
          <div className="max-w-md rounded-2xl border border-destructive/35 bg-card p-6 shadow-sm">
            <h1 className="text-lg font-bold text-destructive">Crossword unavailable</h1>
            <p className="mt-2 text-sm text-text-muted">{loadError || "Failed to initialize crossword."}</p>
            <Button type="button" variant="primary" size="sm" onClick={() => window.location.reload()} className="mt-4">
              Reload
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const activeClues = activeTab === DIRECTIONS.ACROSS ? model.clues.across : model.clues.down;
  const statusToneClass =
    statusMessage?.type === "success"
      ? "border-success/35 bg-success/10 text-success"
      : statusMessage?.type === "warning"
      ? "border-destructive/35 bg-destructive/10 text-destructive"
      : "border-info/35 bg-info/10 text-info";

  return (
    <div className="min-h-[100dvh] bg-background pb-16 text-foreground overflow-x-hidden lg:pb-8">
      <GameHeader 
        title="Mini Crossword" 
        onHowToPlay={openHowToPlay}
        onStats={() => setShowStats(true)}
        onBadges={() => setShowBadgesDrawer(true)}
        gameComplete={isComplete}
        returnUrl={returnUrl} 
        returnLabel={returnLabel} 
      />

      <main className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-card px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Mini Crossword</h1>
            <div className="text-xs text-text-muted">
              Cairo key: <span className="font-semibold text-foreground">{requestedDate}</span>
              {usingFallback ? (
                <span className="ml-2 rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 font-semibold text-warning">
                  Using puzzle for {servedDate}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border-default bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
              {formatDuration(elapsedSeconds)}
            </div>
            <div className="rounded-lg border border-border-default bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
              {storageMode === "db" ? "DB autosave" : "Local autosave"}
            </div>
          </div>
        </div>
        {puzzle.theme ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <span>Today&apos;s theme:</span>
            <span className="font-bold">{puzzle.theme}</span>
          </div>
        ) : null}

        {statusMessage ? <div className={`mb-4 rounded-xl border px-4 py-2 text-sm font-medium ${statusToneClass}`}>{statusMessage.text}</div> : null}

        <WinConfettiOverlay
          active={showWinConfetti}
          gameName="crossword"
          onDone={() => setShowWinConfetti(false)}
        />

        {isComplete ? (
          <div className="mb-4 rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-sm text-success">
            <div className="font-bold">Puzzle complete in {formatDuration(elapsedSeconds)}.</div>
            <div className="mt-1 text-xs text-success/90">
              Result submission: {submitState === "submitting" ? "sending..." : submitState === "submitted" ? "saved" : submitState === "error" ? "failed" : "pending"}
            </div>
          </div>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div >
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-border-default bg-card p-3 shadow-sm sm:flex sm:flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={handleCheckWord}>
                Check Word
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCheckPuzzle}>
                Check Puzzle
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleClearWord}>
                Clear Word
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleHint}>
                Hint
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReveal}
                className="border-warning/45 bg-warning/10 text-warning hover:border-warning/60 hover:bg-warning/15"
              >
                Reveal ({Math.max(0, MAX_REVEALS_PER_PUZZLE - hintsUsed.revealsUsed)})
              </Button>
            </div>

           <div data-tutorial="crossword-grid" className="w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-border-default bg-card shadow-lg">
  {/* Grid wrapper with proper containment */}
  <div className="w-full p-3 sm:p-4">
    <div 
      className="grid gap-0 bg-border-default/40 p-[1.5px] rounded-md shadow-inner w-full mx-auto" 
      style={{ 
        gridTemplateColumns: `repeat(${puzzle.size.cols}, minmax(0, 1fr))`,
        aspectRatio: `${puzzle.size.cols} / ${puzzle.size.rows}`
      }}
    >
      {Array.from({ length: puzzle.size.rows }).map((_, r) =>
        Array.from({ length: puzzle.size.cols }).map((__, c) => {
          const cell = puzzle.grid[r][c];
          const key = makeCellKey(r, c);
          const playable = isPlayableAt(puzzle, r, c);

          const acrossId = model.cellToAcross.get(key);
          const downId = model.cellToDown.get(key);

          const inActiveWord = activeWordCellKeys.has(key);
          const isActive = activeCell.r === r && activeCell.c === c;
          const isLocked = lockedCells.has(key);
          const isSolvedCell = (acrossId && solvedSegmentIds.has(acrossId)) || (downId && solvedSegmentIds.has(downId));
          const isJustSolved = (acrossId && justSolvedIds.has(acrossId)) || (downId && justSolvedIds.has(downId));
          const isIncorrectChecked = (acrossId && checkedIncorrectIds.has(acrossId)) || (downId && checkedIncorrectIds.has(downId));
          const isHintFocus = hintFocusCells.has(key);
          const isHintWrong = hintIncorrectCells.has(key);

          const obstacleType = cell?.obstacle?.type || "none";
          const clueNumber = getActiveCellNumber(model, r, c);

          const wallRight = obstacleType === "wallRight" ? "border-r-[3px] border-r-info" : "";
          const wallDown = obstacleType === "wallDown" ? "border-b-[3px] border-b-info" : "";

          if (!playable) {
            if (obstacleType === "block") {
              return (
                <div 
                  key={key} 
                  className={`aspect-square bg-foreground/20 dark:bg-foreground/15 ${wallRight} ${wallDown}`} 
                  aria-hidden="true" 
                />
              );
            }

            return (
              <div 
                key={key} 
                className={`flex aspect-square items-center justify-center bg-secondary/80 border border-border-default/20 ${wallRight} ${wallDown}`} 
                aria-hidden="true"
              >
                <ObstacleGlyph type={obstacleType} />
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleCellClick(r, c)}
              className={`
                relative flex aspect-square select-none items-center justify-center overflow-hidden
                text-[clamp(0.65rem,3.5vw,1.25rem)] font-bold uppercase 
                transition-all duration-200 ease-out
                border border-border-default/30
                focus:outline-none focus:z-20
                ${
                  isActive 
                    ? "state-active-cell" 
                    : inActiveWord 
                    ? "state-active-word" 
                    : "bg-background hover:bg-surface-hover hover:shadow-sm active:bg-surface-hover/80"
                }
                ${isSolvedCell ? "state-correct" : ""}
                ${isLocked ? "state-locked" : ""}
                ${isHintFocus ? "state-hint-focus" : ""}
                ${isHintWrong ? "state-wrong-underline" : ""}
                ${isIncorrectChecked ? "state-wrong state-wrong-shake" : ""}
                ${isJustSolved ? "state-correct-animate" : ""}
                ${wallRight} ${wallDown}
              `}
              aria-label={`Row ${r + 1} column ${c + 1}`}
            >
              {/* Clue number */}
              {clueNumber ? (
                <span className="absolute left-[1px] top-[1px] sm:left-[3px] sm:top-[2px] text-[6px] sm:text-[8px] md:text-[9px] font-semibold text-text-muted leading-none pointer-events-none">
                  {clueNumber}
                </span>
              ) : null}
              
              {/* Letter */}
              <span className="tracking-tighter leading-none max-w-full text-center">
                {(letters[r]?.[c] || "").toUpperCase()}
              </span>
              
              {/* Lock icon */}
              {isLocked ? (
                <span className="absolute bottom-[2px] right-[2px] text-success opacity-90">
                  <LockIcon />
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  </div>
</div>
          </div>

          <aside className="hidden rounded-2xl border border-border-default bg-card p-3 shadow-sm lg:block">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">Clues</h2>
              <ClueTabs active={activeTab} onChange={setActiveTab} />
            </div>
            <ClueList clues={activeClues} model={model} activeSegmentId={activeSegment?.id || null} solvedSegmentIds={solvedSegmentIds} onSelect={selectSegment} />
          </aside>
        </div>
      </main>

      <MobileCluesPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeClues={activeClues}
        model={model}
        activeSegment={activeSegment}
        solvedSegmentIds={solvedSegmentIds}
        onSelect={selectSegment}
      />

      {/* Modals and Drawers */}
      <BadgeToastQueue
        unlocks={badgeUnlocks}
        onView={(badge) => setSelectedBadge(badge)}
      />

      {stats && (
        <StatisticsModal 
          isOpen={showStats} 
          onClose={() => setShowStats(false)}
          gameName="crossword"
          stats={stats}
        />
      )}

      <BadgeDetailsSheet 
        badge={selectedBadge} 
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)} 
      />

      <BadgeEarnedRecap badges={badgeUnlocks} />


      <BadgesDrawer 
        isOpen={showBadgesDrawer}
        onClose={() => setShowBadgesDrawer(false)}
      />

      <DailyReminder gameName="crossword" />

      {tutorial && (
        <TutorialPanel 
          isOpen={isTutorialOpen}
          tutorial={tutorial}
          startAt={startMode === "resume" ? lastStep : 0}
          resumeStep={lastStep}
          onStepChange={updateTutorialStep}
          onClose={closeTutorial}
          onSkip={skipTutorial}
          onComplete={completeTutorial}
        />
      )}
    </div>
  );
}
