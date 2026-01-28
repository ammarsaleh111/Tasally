'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getTodaysPuzzle,
  loadGameState,
  saveGameState,
  initializeGame,
  getWordCells,
  getNextCell,
  getPreviousCell,
  checkPuzzle,
  isGridComplete,
  getClueNumber,
  GRID_SIZE,
  formatTime,
  loadPuzzleTimer,
  savePuzzleTimer,
  pausePuzzleTimer,
  resumePuzzleTimer,
  calculateElapsedTime,
  initializeTimer,
} from './crosswordLogic';
import CrosswordGrid from '@/components/CrosswordGrid';
import CluePanel from '@/components/CluePanel';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import WinConfettiOverlay, { CONFETTI_ORIGINS } from '@/components/WinConfettiOverlay';
import GameHeader from '@/components/GameHeader';
import StatisticsModal from '@/components/StatisticsModal';
import UnifiedHowToPlay from '@/components/UnifiedHowToPlay';
import LearningLogModal from '@/components/LearningLogModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';
import Link from 'next/link';
import { recordGameResult, getGameStats, getTodayString } from '@/utils/profileManager';
import { trackGameStart, trackGameEnd } from '@/utils/sessionTracker';
import { addWordsToLog } from '@/utils/learningLogEngine';
import { submitResult } from '@/utils/resultsClient';

export default function CrosswordGame() {
  // =========================================================================
  // STATE INITIALIZATION
  // =========================================================================
  
  const [puzzle, setPuzzle] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [timerState, setTimerState] = useState(null);
  const [displayTime, setDisplayTime] = useState(0);
  
  const [highlightCells, setHighlightCells] = useState([]);
  const [activeClue, setActiveClue] = useState(1);
  const [toast, setToast] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [solvedWords, setSolvedWords] = useState(new Set());
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [stats, setStats] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [showWinConfetti, setShowWinConfetti] = useState(false);
  const [hasCelebratedWin, setHasCelebratedWin] = useState(false);
  
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const prevWinRef = useRef(false);
  const initialWinHandledRef = useRef(false);
  const winStorageKey = puzzle ? `crossword-win-celebrated-${puzzle.date}` : null;
  
  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  
  useEffect(() => {
    try {
      // Generate or load puzzle
      const currentPuzzle = getTodaysPuzzle();
      setPuzzle(currentPuzzle);
      
      // Load saved state or initialize new game
      const savedState = loadGameState();
      if (savedState && savedState.date === currentPuzzle.date) {
        setGameState(savedState);
        
        // Load timer state
        const savedTimer = loadPuzzleTimer(currentPuzzle.date);
        if (savedTimer) {
          // Resume timer if game not solved
          if (!savedState.isSolved) {
            const resumed = resumePuzzleTimer(savedTimer, currentPuzzle.date);
            setTimerState(resumed);
          } else {
            setTimerState(savedTimer);
          }
        } else {
          setTimerState(initializeTimer());
        }
      } else {
        const newState = initializeGame(currentPuzzle);
        setGameState(newState);
        setTimerState(newState.timerState);
      }
    } catch (error) {
      console.error('[CROSSWORD] Initialization error:', error);
      setInitError(error.message || 'Failed to load puzzle');
      setIsLoading(false);
    }
    
    // Load stats
    const gameStats = getGameStats('crossword');
    setStats(gameStats);
    trackGameStart('crossword');
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!winStorageKey) {
      setHasCelebratedWin(false);
      return;
    }
    setHasCelebratedWin(localStorage.getItem(winStorageKey) === '1');
  }, [winStorageKey]);

  // =========================================================================
  // TIMER LOGIC - Proper visibility-aware timer
  // =========================================================================
  
  // Handle visibility changes
  useEffect(() => {
    if (!puzzle || !timerState || gameState?.isSolved) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause timer
        const paused = pausePuzzleTimer(timerState, puzzle.date);
        setTimerState(paused);
      } else {
        // Page is visible - resume timer
        const resumed = resumePuzzleTimer(timerState, puzzle.date);
        setTimerState(resumed);
      }
    };
    
    const handleBeforeUnload = () => {
      // Save timer state before page unloads
      if (timerState && puzzle) {
        const paused = pausePuzzleTimer(timerState, puzzle.date);
        savePuzzleTimer(puzzle.date, paused);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [puzzle, timerState, gameState?.isSolved]);
  
  // Update display time every second
  useEffect(() => {
    if (!timerState || gameState?.isSolved) return;
    
    const updateDisplay = () => {
      const elapsed = calculateElapsedTime(timerState);
      setDisplayTime(elapsed);
    };
    
    updateDisplay();
    timerRef.current = setInterval(updateDisplay, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, gameState?.isSolved]);

  // Save state whenever it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // =========================================================================
  // CELL & WORD HIGHLIGHTING
  // =========================================================================
  
  useEffect(() => {
    if (!puzzle || !gameState) return;
    
    const cells = getWordCells(puzzle, gameState.activeCell.row, gameState.activeCell.col, gameState.direction);
    setHighlightCells(cells);
    
    // Update active clue number
    const clueNum = getClueNumber(puzzle, gameState.activeCell.row, gameState.activeCell.col);
    if (clueNum) {
      setActiveClue(clueNum);
    }
  }, [puzzle, gameState?.activeCell, gameState?.direction]);

  // =========================================================================
  // AUTO-CHECK ON COMPLETION
  // =========================================================================
  
  useEffect(() => {
    if (!puzzle || !gameState || gameState.isSolved) return;
    
    if (isGridComplete(puzzle, gameState.userGrid)) {
      const isCorrect = checkPuzzle(puzzle, gameState.userGrid);
      if (isCorrect) {
        // Puzzle solved!
        const finalTime = calculateElapsedTime(timerState);
        
        // Pause and finalize timer
        const finalTimer = pausePuzzleTimer(timerState, puzzle.date);
        setTimerState(finalTimer);
        setDisplayTime(finalTime);
        
        const newState = {
          ...gameState,
          isSolved: true,
          endTime: Date.now(),
          finalTime: finalTime,
        };
        setGameState(newState);
        
        // Record result
        const result = {
          date: getTodayString(),
          win: true,
          time: finalTime,
          puzzleId: `crossword-${puzzle.date}`,
        };
        
        const achievements = recordGameResult('crossword', result);
        trackGameEnd('crossword', result);
        
        // Submit to leaderboard API
        submitResult({
          gameKey: 'crossword',
          mode: 'daily',
          success: true,
          durationMs: finalTime * 1000,
          metadata: { puzzleDate: puzzle.date },
        }).catch(err => console.warn('[Crossword] Failed to submit to leaderboard:', err));
        
        const updatedStats = getGameStats('crossword');
        setStats(updatedStats);
        
        // Add words to learning log
        const crosswordWords = [
          ...Object.values(puzzle.solution?.across || {}),
          ...Object.values(puzzle.solution?.down || {})
        ].filter(Boolean);
        addWordsToLog(crosswordWords, 'crossword');
        
        if (achievements && achievements.length > 0) {
          setNewAchievements(achievements);
          setCurrentAchievementIndex(0);
        }
        
        setTimeout(() => setShowResultModal(true), 500);
      }
    }
  }, [puzzle, gameState, gameState?.userGrid, timerState]);

  useEffect(() => {
    const wonNow = Boolean(gameState?.isSolved);
    if (!initialWinHandledRef.current) {
      prevWinRef.current = wonNow;
      initialWinHandledRef.current = true;
      return;
    }
    if (wonNow && !prevWinRef.current && !hasCelebratedWin) {
      setShowWinConfetti(true);
      setHasCelebratedWin(true);
      if (typeof window !== 'undefined' && winStorageKey) {
        localStorage.setItem(winStorageKey, '1');
      }
    }
    prevWinRef.current = wonNow;
  }, [gameState?.isSolved, hasCelebratedWin, winStorageKey]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  
  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleToastExit = useCallback(() => {
    setToast(null);
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (!puzzle || !gameState || gameState.isSolved) return;
    
    // Check if cell is a block
    const isBlock = puzzle.template 
      ? puzzle.template.blocks[row][col]
      : puzzle.grid[row][col] === '';
    
    if (isBlock) return; // Can't click on blocks
    
    // If clicking same cell, toggle direction
    if (gameState.activeCell.row === row && gameState.activeCell.col === col) {
      setGameState(prev => ({
        ...prev,
        direction: prev.direction === 'across' ? 'down' : 'across'
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        activeCell: { row, col }
      }));
    }
    
    // Focus input for mobile
    inputRef.current?.focus();
  }, [puzzle, gameState]);

  const handleClueClick = useCallback((clueNum, dir) => {
    if (!puzzle) return;
    
    const height = puzzle.height || GRID_SIZE;
    const width = puzzle.width || GRID_SIZE;
    
    // Find the cell that starts this clue
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (puzzle.clueNumbers?.[r]?.[c] === clueNum) {
          setGameState(prev => ({
            ...prev,
            activeCell: { row: r, col: c },
            direction: dir
          }));
          inputRef.current?.focus();
          return;
        }
      }
    }
  }, [puzzle]);

  // Check if a word is complete and correct
  const checkWordSolved = useCallback((row, col, direction, userGrid) => {
    if (!puzzle) return false;
    
    const cells = getWordCells(puzzle, row, col, direction);
    const userWord = cells.map(c => userGrid[c.row][c.col]).join('');
    const correctWord = cells.map(c => puzzle.grid[c.row][c.col]).join('');
    
    if (userWord === correctWord && userWord.length > 0 && !userWord.includes('')) {
      const clueNum = getClueNumber(puzzle, cells[0].row, cells[0].col);
      if (clueNum) {
        return { complete: true, wordKey: `${direction}-${clueNum}` };
      }
    }
    return { complete: false };
  }, [puzzle]);
  
  // Find next unsolved clue
  const getNextUnsolvedClue = useCallback((currentDirection, currentSolvedWords = solvedWords) => {
    if (!puzzle) return null;
    
    const height = puzzle.height || GRID_SIZE;
    const width = puzzle.width || GRID_SIZE;
    
    // Get clues for current direction
    const clues = currentDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    
    if (!clues) return null;
    
    for (const clue of clues) {
      const wordKey = `${currentDirection}-${clue.number}`;
      if (!currentSolvedWords.has(wordKey)) {
        // Find first cell of this clue
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (puzzle.clueNumbers?.[r]?.[c] === clue.number) {
              return { row: r, col: c, direction: currentDirection };
            }
          }
        }
      }
    }
    
    // Try other direction
    const otherDirection = currentDirection === 'across' ? 'down' : 'across';
    const otherClues = otherDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    
    if (!otherClues) return null;
    
    for (const clue of otherClues) {
      const wordKey = `${otherDirection}-${clue.number}`;
      if (!currentSolvedWords.has(wordKey)) {
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (puzzle.clueNumbers?.[r]?.[c] === clue.number) {
              return { row: r, col: c, direction: otherDirection };
            }
          }
        }
      }
    }
    
    return null;
  }, [puzzle, solvedWords]);

  const handleKeyDown = useCallback((e) => {
    if (!puzzle || !gameState || gameState.isSolved) return;
    
    const { row, col } = gameState.activeCell;
    
    // Check if current cell is a block (shouldn't happen but be safe)
    const isBlock = puzzle.template 
      ? puzzle.template.blocks[row][col]
      : puzzle.grid[row][col] === '';
    
    if (isBlock) return;
    
    // Enter key - jump to next unsolved clue
    if (e.key === 'Enter') {
      const nextClue = getNextUnsolvedClue(gameState.direction);
      if (nextClue) {
        setGameState(prev => ({
          ...prev,
          activeCell: { row: nextClue.row, col: nextClue.col },
          direction: nextClue.direction
        }));
      }
      e.preventDefault();
      return;
    }
    
    // Letter input
    if (/^[A-Za-z]$/.test(e.key)) {
      const newGrid = gameState.userGrid.map(r => [...r]);
      newGrid[row][col] = e.key.toUpperCase();
      
      // Check if word is complete with the NEW grid
      const wordCheck = checkWordSolved(row, col, gameState.direction, newGrid);
      
      if (wordCheck.complete) {
        // Mark word as solved
        const newSolvedWords = new Set([...solvedWords, wordCheck.wordKey]);
        setSolvedWords(newSolvedWords);
        
        // Update grid and advance to next unsolved clue
        const nextClue = getNextUnsolvedClue(gameState.direction, newSolvedWords);
        if (nextClue) {
          setGameState(prev => ({
            ...prev,
            userGrid: newGrid,
            activeCell: { row: nextClue.row, col: nextClue.col },
            direction: nextClue.direction
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            userGrid: newGrid
          }));
        }
      } else {
        // Just advance to next cell in current word
        const next = getNextCell(puzzle, row, col, gameState.direction);
        setGameState(prev => ({
          ...prev,
          userGrid: newGrid,
          activeCell: { row: next.row, col: next.col },
          direction: next.direction
        }));
      }
      
      e.preventDefault();
      return;
    }
    
    // Backspace
    if (e.key === 'Backspace') {
      const newGrid = gameState.userGrid.map(r => [...r]);
      
      if (newGrid[row][col]) {
        // Clear current cell
        newGrid[row][col] = '';
        setGameState(prev => ({ ...prev, userGrid: newGrid }));
      } else {
        // Move back and clear
        const prevCell = getPreviousCell(puzzle, row, col, gameState.direction);
        if (prevCell.row !== row || prevCell.col !== col) {
          newGrid[prevCell.row][prevCell.col] = '';
          setGameState(prev => ({
            ...prev,
            userGrid: newGrid,
            activeCell: prevCell
          }));
        }
      }
      
      e.preventDefault();
      return;
    }
    
    // Arrow keys - navigate grid (respecting blocks)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || 
        e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      
      const height = puzzle.height || GRID_SIZE;
      const width = puzzle.width || GRID_SIZE;
      
      const isBlockAt = (r, c) => {
        if (r < 0 || r >= height || c < 0 || c >= width) return true;
        return puzzle.template 
          ? puzzle.template.blocks[r][c]
          : puzzle.grid[r][c] === '';
      };
      
      let newRow = row;
      let newCol = col;
      
      if (e.key === 'ArrowRight') {
        newCol = col + 1;
        while (newCol < width && isBlockAt(row, newCol)) newCol++;
        if (newCol >= width || isBlockAt(row, newCol)) newCol = col;
      } else if (e.key === 'ArrowLeft') {
        newCol = col - 1;
        while (newCol >= 0 && isBlockAt(row, newCol)) newCol--;
        if (newCol < 0 || isBlockAt(row, newCol)) newCol = col;
      } else if (e.key === 'ArrowDown') {
        newRow = row + 1;
        while (newRow < height && isBlockAt(newRow, col)) newRow++;
        if (newRow >= height || isBlockAt(newRow, col)) newRow = row;
      } else if (e.key === 'ArrowUp') {
        newRow = row - 1;
        while (newRow >= 0 && isBlockAt(newRow, col)) newRow--;
        if (newRow < 0 || isBlockAt(newRow, col)) newRow = row;
      }
      
      if (newRow !== row || newCol !== col) {
        setGameState(prev => ({
          ...prev,
          activeCell: { row: newRow, col: newCol }
        }));
      }
      
      e.preventDefault();
      return;
    }
    
    // Tab to switch direction
    if (e.key === 'Tab') {
      setGameState(prev => ({
        ...prev,
        direction: prev.direction === 'across' ? 'down' : 'across'
      }));
      e.preventDefault();
    }
  }, [puzzle, gameState, solvedWords, checkWordSolved, getNextUnsolvedClue]);

  // Keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Hidden input for mobile keyboard
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    if (value && /^[A-Za-z]$/.test(value)) {
      // Simulate key press
      handleKeyDown({ key: value, preventDefault: () => {} });
    }
    // Clear input for next character
    e.target.value = '';
  }, [handleKeyDown]);

  // =========================================================================
  // RENDER
  // =========================================================================
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen">
        <div className="text-lg text-text-muted">Loading puzzle...</div>
      </div>
    );
  }
  
  if (initError || !puzzle || !gameState) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen gap-4">
        <div className="text-lg text-red-500">Error loading puzzle</div>
        <div className="text-sm text-text-muted">{initError || 'Puzzle failed to initialize'}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-button-primary text-button-text rounded-lg hover:bg-button-primary-hover"
        >
          Reload Page
        </button>
      </div>
    );
  }

  const solveTime = gameState.finalTime || displayTime;
  const isPaused = timerState?.isPaused && !gameState.isSolved;

  return (
    <div className="flex flex-col items-center w-full min-h-screen pb-10 animate-fade-in-up">
      <GameHeader 
        title="Mini Crossword" 
        onHowToPlay={() => setShowHowToPlay(true)}
        onStats={() => setShowStats(true)}
        onLearningLog={() => setShowLearningLog(true)}
        gameComplete={gameState.isSolved}
      />
      
      {/* Hidden input for mobile keyboard */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        onChange={handleInputChange}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-5xl mx-auto px-4">
        <WinConfettiOverlay
          active={showWinConfetti}
          durationMs={2800}
          intensity={0.7}
          origin={CONFETTI_ORIGINS.top}
          palette={[
            'hsl(var(--crossword-active-ring))',
            'hsl(var(--info))',
            'hsl(var(--warning))',
            'hsl(var(--accent))'
          ]}
          onDone={() => setShowWinConfetti(false)}
        />
        
        {toast && (
          <Toast 
            key={toast.id}
            message={toast.message} 
            type={toast.type} 
            onExited={handleToastExit} 
          />
        )}

        {gameState.isSolved && !showResultModal && (
          <div className="mb-4 w-full rounded-xl border border-border-default bg-card px-4 py-3 text-xs text-text-muted flex items-center justify-between">
            <div className="font-semibold text-foreground">✅ Solved</div>
            <div>Time: {formatTime(solveTime)}</div>
          </div>
        )}

        {/* Timer Display */}
        <div className="w-full mb-4 text-center">
          <div className="text-lg font-mono font-bold text-foreground flex items-center justify-center gap-2">
            {isPaused && (
              <span className="text-sm text-yellow-500 animate-pulse" title="Timer paused">⏸</span>
            )}
            {formatTime(solveTime)}
          </div>
          {puzzle.template && (
            <div className="text-xs text-text-muted mt-1">
              {puzzle.template.name}
            </div>
          )}
        </div>

        {/* Grid and Clues Side by Side */}
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start justify-center">
          {/* Clues on Left */}
          <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-80 order-2 lg:order-1">
            <CluePanel 
              puzzle={puzzle}
              activeClue={activeClue}
              direction={gameState.direction}
              onClueClick={handleClueClick}
              solvedWords={solvedWords}
            />
          </div>
          
          {/* Grid on Right */}
          <div 
            className="w-full lg:w-auto lg:flex-shrink-0 order-1 lg:order-2"
            onClick={() => inputRef.current?.focus()}
          >
            <CrosswordGrid 
              puzzle={puzzle}
              userGrid={gameState.userGrid}
              activeCell={gameState.activeCell}
              direction={gameState.direction}
              onCellClick={handleCellClick}
              highlightCells={highlightCells}
              isSolved={gameState.isSolved}
            />
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title="Puzzle Complete!">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-wordle-correct mb-2">
              {formatTime(solveTime)}
            </p>
            <p className="text-lg text-text-muted">
              Great job!
            </p>
          </div>

          {/* Share Results */}
          <ShareResults
            gameName="crossword"
            result={{
              time: solveTime,
              win: true
            }}
            puzzleNumber={`#${puzzle.date}`}
          />

          {/* Daily Reminder */}
          <DailyReminder gameName="crossword" />

          <div className="w-full h-px bg-border-default my-2"></div>

          <button
            onClick={() => setShowResultModal(false)}
            className="w-full py-3 rounded-lg bg-wordle-correct text-white font-bold hover:opacity-90 transition-opacity text-center"
          >
            Close
          </button>
        </div>
      </Modal>
      
      {/* How to Play Modal */}
      <UnifiedHowToPlay 
        gameName="crossword" 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      
      {/* Learning Log Modal */}
      <LearningLogModal
        isOpen={showLearningLog}
        onClose={() => setShowLearningLog(false)}
        gameName="crossword"
      />
      
      {/* Stats Modal */}
      {stats && (
        <StatisticsModal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          gameName="crossword"
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
    </div>
  );
}
