import React from 'react';
import { GRID_SIZE, getClueNumber, getWordCells } from '../app/games/crossword/crosswordLogic';

const CrosswordGrid = React.memo(({ 
  puzzle, 
  userGrid, 
  activeCell, 
  direction,
  onCellClick,
  highlightCells = [],
  isSolved = false
}) => {
  const isActive = (row, col) => {
    return activeCell.row === row && activeCell.col === col;
  };
  
  const isHighlighted = (row, col) => {
    return highlightCells.some(cell => cell.row === row && cell.col === col);
  };
  
  const getClueNumberForCell = (row, col) => {
    return getClueNumber(puzzle, row, col);
  };
  
  return (
    <div className={`crossword-scale ${isSolved ? 'animate-pulse' : ''}`}>
      <div className="grid grid-cols-5 gap-1 bg-border-default p-2 rounded-lg shadow-lg h-full">
        {Array(GRID_SIZE).fill(null).map((_, row) => (
          Array(GRID_SIZE).fill(null).map((_, col) => {
            const isBlack = puzzle.grid[row][col] === "";
            const clueNum = getClueNumberForCell(row, col);
            const active = isActive(row, col);
            const highlighted = isHighlighted(row, col);
            const hasLetter = userGrid[row][col];
            
            if (isBlack) {
              return (
                <div
                  key={`${row}-${col}`}
                  className="w-full h-full aspect-square bg-foreground rounded-sm"
                />
              );
            }
            
            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick(row, col)}
                className={`
                  w-full h-full aspect-square relative cursor-pointer
                  flex items-center justify-center
                  text-2xl font-bold
                  transition-all duration-150 ease-out
                  rounded-sm
                  ${active 
                    ? 'bg-[var(--crossword-active)] ring-2 ring-[var(--crossword-active-ring)] ring-inset scale-105 z-10 shadow-lg' 
                    : highlighted 
                      ? 'bg-[var(--crossword-highlight)] scale-[1.02]' 
                      : 'bg-background hover:bg-surface-hover'
                  }
                  ${!active && !highlighted ? 'hover:scale-[1.02]' : ''}
                  ${hasLetter && !active && !highlighted ? 'shadow-sm' : ''}
                `}
              >
                {clueNum && (
                  <span className={`
                    absolute top-0.5 left-1 text-[10px] font-bold
                    transition-colors duration-150
                    ${active ? 'text-[var(--button-text)]' : 'text-text-muted'}
                  `}>
                    {clueNum}
                  </span>
                )}
                <span className={`
                  transition-all duration-100
                  ${active ? 'text-[var(--button-text)]' : 'text-foreground'}
                  ${hasLetter ? 'animate-pop' : ''}
                `}>
                  {userGrid[row][col].toUpperCase()}
                </span>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
});

CrosswordGrid.displayName = 'CrosswordGrid';

export default CrosswordGrid;
