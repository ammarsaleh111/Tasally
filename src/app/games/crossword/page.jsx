'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getTodaysPuzzle,
  loadGameState,
  saveGameState,
  initializeGame,
  getWordCells,
  getNextCell,
  checkPuzzle,
  isGridComplete,
  getClueNumber,
  GRID_SIZE
} from './crosswordLogic';
import CrosswordGrid from '@/components/CrosswordGrid';
import CluePanel from '@/components/CluePanel';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Confetti from '@/components/Confetti';
import Link from 'next/link';

export default function CrosswordGame() {
  const [puzzle] = useState(() => getTodaysPuzzle());
  const [gameState, setGameState] = useState(() => {
    const currentPuzzle = getTodaysPuzzle();
    const savedState = loadGameState();
    if (savedState && savedState.date === currentPuzzle.date) {
      return savedState;
    }
    return initializeGame(currentPuzzle);
  });
  
  const [highlightCells, setHighlightCells] = useState([]);
  const [activeClue, setActiveClue] = useState(1);
  const [toast, setToast] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [solvedWords, setSolvedWords] = useState(new Set());
  const [isPaused, setIsPaused] = useState(false);

  // Save state whenever it changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Timer with pause on window blur
  useEffect(() => {
    const handleBlur = () => setIsPaused(true);
    const handleFocus = () => setIsPaused(false);
    
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  useEffect(() => {
    if (gameState.isSolved || gameState.endTime || isPaused) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.isSolved, gameState.endTime, gameState.startTime, isPaused]);

  // Update highlighted cells when active cell changes
  useEffect(() => {
    const cells = getWordCells(puzzle, gameState.activeCell.row, gameState.activeCell.col, gameState.direction);
    setHighlightCells(cells);
    
    // Update active clue number
    const clueNum = getClueNumber(puzzle, gameState.activeCell.row, gameState.activeCell.col);
    if (clueNum) {
      setActiveClue(clueNum);
    }
  }, [puzzle, gameState.activeCell, gameState.direction]);

  // Auto-check when grid is complete
  useEffect(() => {
    if (gameState.isSolved) return;
    
    if (isGridComplete(puzzle, gameState.userGrid)) {
      const isCorrect = checkPuzzle(puzzle, gameState.userGrid);
      if (isCorrect) {
        const newState = {
          ...gameState,
          isSolved: true,
          endTime: Date.now()
        };
        setGameState(newState);
        setTimeout(() => setShowResultModal(true), 500);
      }
    }
  }, [puzzle, gameState, gameState.userGrid, gameState.isSolved]);

  const showToast = useCallback((message, type = 'default') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleToastExit = useCallback(() => {
    setToast(null);
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (gameState.isSolved) return;
    
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
  }, [gameState.activeCell, gameState.isSolved]);

  const handleClueClick = useCallback((clueNum, dir) => {
    // Find the cell that starts this clue
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (puzzle.grid[r][c] === "") continue;
        
        const startsAcross = c === 0 || puzzle.grid[r][c - 1] === "";
        const startsDown = r === 0 || puzzle.grid[r - 1][c] === "";
        
        if (startsAcross || startsDown) {
          count++;
          if (count === clueNum) {
            setGameState(prev => ({
              ...prev,
              activeCell: { row: r, col: c },
              direction: dir
            }));
            return;
          }
        }
      }
    }
  }, [puzzle]);

  // Check if a word is complete and correct
  const checkWordSolved = useCallback((row, col, direction) => {
    const cells = getWordCells(puzzle, row, col, direction);
    const userWord = cells.map(c => gameState.userGrid[c.row][c.col]).join('');
    const correctWord = cells.map(c => puzzle.solution[c.row][c.col]).join('');
    
    if (userWord === correctWord && userWord.length > 0 && !userWord.includes('')) {
      const clueNum = getClueNumber(puzzle, row, col);
      if (clueNum) {
        const wordKey = `${direction}-${clueNum}`;
        setSolvedWords(prev => new Set([...prev, wordKey]));
        return true;
      }
    }
    return false;
  }, [puzzle, gameState.userGrid]);
  
  // Find next unsolved clue
  const getNextUnsolvedClue = useCallback((currentDirection) => {
    const clues = currentDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    
    for (const clue of clues) {
      const wordKey = `${currentDirection}-${clue.number}`;
      if (!solvedWords.has(wordKey)) {
        // Find first cell of this clue
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (puzzle.clueNumbers[r][c] === clue.number) {
              return { row: r, col: c, direction: currentDirection };
            }
          }
        }
      }
    }
    
    // Try other direction
    const otherDirection = currentDirection === 'across' ? 'down' : 'across';
    const otherClues = otherDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    
    for (const clue of otherClues) {
      const wordKey = `${otherDirection}-${clue.number}`;
      if (!solvedWords.has(wordKey)) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (puzzle.clueNumbers[r][c] === clue.number) {
              return { row: r, col: c, direction: otherDirection };
            }
          }
        }
      }
    }
    
    return null;
  }, [puzzle, solvedWords]);

  const handleKeyDown = useCallback((e) => {
    if (gameState.isSolved) return;
    
    const { row, col } = gameState.activeCell;
    
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
      const cells = getWordCells(puzzle, row, col, gameState.direction);
      const userWord = cells.map(c => newGrid[c.row][c.col]).join('');
      const correctWord = cells.map(c => puzzle.grid[c.row][c.col]).join('');
      const wordComplete = userWord === correctWord && userWord.length > 0 && !userWord.includes('');
      
      if (wordComplete) {
        // Mark word as solved
        const clueNum = getClueNumber(puzzle, row, col);
        if (clueNum) {
          const wordKey = `${gameState.direction}-${clueNum}`;
          setSolvedWords(prev => new Set([...prev, wordKey]));
        }
        
        // Update grid and advance to next unsolved clue
        const nextClue = getNextUnsolvedClue(gameState.direction);
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
        const cells = getWordCells(puzzle, row, col, gameState.direction);
        const currentIndex = cells.findIndex(c => c.row === row && c.col === col);
        
        if (currentIndex > 0) {
          const prevCell = cells[currentIndex - 1];
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
    
    // Arrow keys
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || 
        e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      
      let newRow = row;
      let newCol = col;
      
      if (e.key === 'ArrowRight') {
        newCol = Math.min(GRID_SIZE - 1, col + 1);
        while (newCol < GRID_SIZE && puzzle.grid[row][newCol] === "") newCol++;
      } else if (e.key === 'ArrowLeft') {
        newCol = Math.max(0, col - 1);
        while (newCol >= 0 && puzzle.grid[row][newCol] === "") newCol--;
      } else if (e.key === 'ArrowDown') {
        newRow = Math.min(GRID_SIZE - 1, row + 1);
        while (newRow < GRID_SIZE && puzzle.grid[newRow][col] === "") newRow++;
      } else if (e.key === 'ArrowUp') {
        newRow = Math.max(0, row - 1);
        while (newRow >= 0 && puzzle.grid[newRow][col] === "") newRow--;
      }
      
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE &&
          puzzle.grid[newRow][newCol] !== "") {
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
  }, [puzzle, gameState, getNextUnsolvedClue]);

  // Keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Auto-focus on mobile to show keyboard
  useEffect(() => {
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      const timer = setTimeout(() => {
        const input = document.createElement('input');
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        input.focus();
        setTimeout(() => input.remove(), 100);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const solveTime = gameState.endTime 
    ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
    : elapsedTime;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto min-h-screen pb-10 px-4 animate-fade-in-up">
      {gameState.isSolved && <Confetti />}
      
      {toast && (
        <Toast 
          key={toast.id}
          message={toast.message} 
          type={toast.type} 
          onExited={handleToastExit} 
        />
      )}

      {/* Result Modal */}
      <Modal isOpen={showResultModal} title="Puzzle Complete!">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-wordle-correct mb-2">
              {formatTime(solveTime)}
            </p>
            <p className="text-lg text-text-muted">
              Great job! Come back tomorrow for a new puzzle.
            </p>
          </div>

          <div className="w-full h-px bg-border-default my-2"></div>

          <Link 
            href="/games"
            className="w-full py-3 rounded-lg bg-wordle-correct text-white font-bold hover:opacity-90 transition-opacity text-center"
          >
            Back to Games
          </Link>
        </div>
      </Modal>

      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-3 border-b border-border-default pb-3">
          <Link 
            href="/games" 
            className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Games
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Mini Crossword</h1>
          
          <div className="text-lg font-mono font-bold text-foreground flex items-center gap-2">
            {isPaused && (
              <span className="text-sm text-yellow-500 animate-pulse">⏸</span>
            )}
            {formatTime(solveTime)}
          </div>
        </div>
      </div>

      {/* Grid and Clues Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start justify-center">
        {/* Clues on Left */}
        <div className="w-full lg:w-80 order-2 lg:order-1">
          <CluePanel 
            puzzle={puzzle}
            activeClue={activeClue}
            direction={gameState.direction}
            onClueClick={handleClueClick}
            solvedWords={solvedWords}
          />
        </div>
        
        {/* Grid on Right */}
        <div className="w-full lg:w-auto order-1 lg:order-2">
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
  );
}
