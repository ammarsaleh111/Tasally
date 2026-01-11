'use client';

import React from 'react';

/**
 * WaffleGrid Component
 * Renders the 5x5 waffle grid with interactive letter tiles
 */
const WaffleGrid = ({
  grid,
  pattern,
  cellStates,
  selectedCell,
  onCellClick,
  disabled = false,
}) => {
  const getCellClass = (row, col, state, isSelected) => {
    // Empty cell
    if (!pattern[row][col]) {
      return 'bg-transparent cursor-default';
    }

    let baseClasses = 'w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg transition-all duration-200 select-none';
    
    // State-based colors
    let stateClasses = '';
    switch (state) {
      case 'correct':
        stateClasses = 'bg-wordle-correct text-white';
        break;
      case 'present':
        stateClasses = 'bg-wordle-present text-white';
        break;
      case 'absent':
        stateClasses = 'bg-wordle-absent text-white';
        break;
      default:
        stateClasses = 'bg-surface-secondary text-foreground';
    }
    
    // Selected state
    if (isSelected) {
      stateClasses += ' ring-4 ring-blue-500 ring-offset-2 scale-110 z-10';
    }
    
    // Interactive states
    if (!disabled && pattern[row][col]) {
      baseClasses += ' cursor-pointer hover:scale-105 active:scale-95';
    } else if (disabled) {
      baseClasses += ' cursor-not-allowed';
    }
    
    return `${baseClasses} ${stateClasses}`;
  };

  const handleClick = (row, col) => {
    if (disabled || !pattern[row][col]) return;
    onCellClick(row, col);
  };

  return (
    <div className="inline-block p-4 bg-card rounded-2xl shadow-lg">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        {grid.map((row, rowIdx) =>
          row.map((letter, colIdx) => {
            const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
            const state = cellStates[rowIdx][colIdx];
            
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={getCellClass(rowIdx, colIdx, state, isSelected)}
                onClick={() => handleClick(rowIdx, colIdx)}
                role={pattern[rowIdx][colIdx] ? 'button' : 'presentation'}
                aria-label={
                  pattern[rowIdx][colIdx]
                    ? `Letter ${letter} at row ${rowIdx + 1}, column ${colIdx + 1}. ${
                        state === 'correct'
                          ? 'Correct position'
                          : state === 'present'
                          ? 'Wrong position'
                          : 'Not in word'
                      }${isSelected ? '. Selected.' : ''}`
                    : ''
                }
                tabIndex={pattern[rowIdx][colIdx] && !disabled ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(rowIdx, colIdx);
                  }
                }}
              >
                {pattern[rowIdx][colIdx] ? letter : ''}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WaffleGrid;
