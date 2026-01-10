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
    <div className={`w-full max-w-md mx-auto ${isSolved ? 'animate-pulse' : ''}`}>
      <div className="grid grid-cols-5 gap-0.5 bg-border-default p-1 rounded-lg shadow-lg">
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
                  className="aspect-square bg-foreground rounded-sm"
                />
              );
            }
            
            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick(row, col)}
                className={`
                  aspect-square relative cursor-pointer
                  flex items-center justify-center
                  text-xl sm:text-2xl font-bold
                  transition-all duration-150 ease-out
                  rounded-sm
                  ${active 
                    ? 'bg-blue-400 ring-2 ring-blue-600 ring-inset scale-105 z-10 shadow-lg' 
                    : highlighted 
                      ? 'bg-blue-100 dark:bg-blue-900/50 scale-[1.02]' 
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
                    ${active ? 'text-white' : 'text-text-muted'}
                  `}>
                    {clueNum}
                  </span>
                )}
                <span className={`
                  transition-all duration-100
                  ${active ? 'text-white' : 'text-foreground'}
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
