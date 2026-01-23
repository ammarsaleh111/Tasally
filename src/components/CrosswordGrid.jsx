import React from 'react';

/**
 * CrosswordGrid component
 * 
 * Renders a crossword grid with support for:
 * - Template-based grids (new engine)
 * - Legacy grids (old format)
 * - Block cells (non-clickable black squares)
 * - Active cell highlighting
 * - Word highlighting
 */
const CrosswordGrid = React.memo(({ 
  puzzle, 
  userGrid, 
  activeCell, 
  direction,
  onCellClick,
  highlightCells = [],
  isSolved = false
}) => {
  // Get grid dimensions (support both old and new format)
  const gridHeight = puzzle.height || puzzle.grid?.length || 5;
  const gridWidth = puzzle.width || puzzle.grid?.[0]?.length || 5;
  
  const isActive = (row, col) => {
    return activeCell?.row === row && activeCell?.col === col;
  };
  
  const isHighlighted = (row, col) => {
    return highlightCells.some(cell => cell.row === row && cell.col === col);
  };
  
  /**
   * Check if a cell is a block (black square)
   * Supports both template-based and legacy formats
   */
  const isBlock = (row, col) => {
    // New template-based format
    if (puzzle.template?.blocks) {
      return puzzle.template.blocks[row]?.[col] ?? false;
    }
    // Legacy format - empty string means block
    return puzzle.grid?.[row]?.[col] === '';
  };
  
  /**
   * Get clue number for a cell
   * Supports both computed clueNumbers and legacy calculation
   */
  const getClueNumber = (row, col) => {
    // New format with pre-computed clue numbers
    if (puzzle.clueNumbers) {
      return puzzle.clueNumbers[row]?.[col] || null;
    }
    
    // Legacy calculation
    if (isBlock(row, col)) return null;
    
    const startsAcross = col === 0 || isBlock(row, col - 1);
    const startsDown = row === 0 || isBlock(row - 1, col);
    
    if (!startsAcross && !startsDown) return null;
    
    let clueNum = 0;
    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        if (isBlock(r, c)) continue;
        
        const isAcrossStart = c === 0 || isBlock(r, c - 1);
        const isDownStart = r === 0 || isBlock(r - 1, c);
        
        if (isAcrossStart || isDownStart) {
          clueNum++;
          if (r === row && c === col) {
            return clueNum;
          }
        }
      }
    }
    
    return null;
  };
  
  // Generate grid columns CSS
  const gridColsClass = `grid-cols-${gridWidth}`;
  
  return (
    <div className={`crossword-scale ${isSolved ? 'animate-pulse' : ''}`}>
      <div 
        className={`grid ${gridColsClass} gap-1 bg-border-default p-2 rounded-lg shadow-lg h-full`}
        style={{ 
          gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))` 
        }}
      >
        {Array(gridHeight).fill(null).map((_, row) => (
          Array(gridWidth).fill(null).map((_, col) => {
            const cellIsBlock = isBlock(row, col);
            const clueNum = getClueNumber(row, col);
            const active = isActive(row, col);
            const highlighted = isHighlighted(row, col);
            const hasLetter = userGrid?.[row]?.[col];
            
            // Render block (black square)
            if (cellIsBlock) {
              return (
                <div
                  key={`${row}-${col}`}
                  className="w-full h-full aspect-square bg-foreground rounded-sm"
                  aria-hidden="true"
                />
              );
            }
            
            // Render playable cell
            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick(row, col)}
                role="gridcell"
                aria-label={`Row ${row + 1}, Column ${col + 1}${clueNum ? `, Clue ${clueNum}` : ''}${hasLetter ? `, Letter ${hasLetter}` : ', Empty'}`}
                tabIndex={active ? 0 : -1}
                className={`
                  w-full h-full aspect-square relative cursor-pointer
                  flex items-center justify-center
                  text-2xl font-bold
                  transition-all duration-150 ease-out
                  rounded-sm
                  ${active 
                    ? 'bg-[hsl(var(--crossword-active))] ring-2 ring-[hsl(var(--crossword-active-ring))] ring-inset scale-105 z-10 shadow-lg' 
                    : highlighted 
                      ? 'bg-[hsl(var(--crossword-highlight))] scale-[1.02]' 
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
                    ${active ? 'text-[hsl(var(--button-text))]' : 'text-text-muted'}
                  `}>
                    {clueNum}
                  </span>
                )}
                <span className={`
                  transition-all duration-100
                  ${active ? 'text-[hsl(var(--button-text))]' : 'text-foreground'}
                  ${hasLetter ? 'animate-pop' : ''}
                `}>
                  {(userGrid?.[row]?.[col] || '').toUpperCase()}
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
