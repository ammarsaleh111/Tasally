'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import SelectionRibbon, { LockedWordRibbon } from './SelectionRibbon';

/**
 * StrandsGrid - Premium NYT-style Strands grid with ribbon selection
 * 
 * Features:
 * - Smooth continuous ribbon selection path (not rectangles/borders)
 * - SVG-based ribbon rendered behind letters
 * - Circular glow at selected tile centers
 * - Touch and mouse support
 */
const StrandsGrid = ({
  grid,
  path,
  lockedSet,
  highlightedSet,
  foundWords = [], // Array of { word, path } for locked word ribbons
  spangramPath = null, // Path for the found spangram
  isDragging,
  shouldShake,
  hintedTiles = [], // Array of { row, col, letter } for tile-progressive hints
  onStart,
  onEnter,
  onEnd,
}) => {
  const mouseDownRef = useRef(false);
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const [dimensions, setDimensions] = useState({ tileSize: 48, gap: 4 });
  const [pointerPoint, setPointerPoint] = useState(null);

  // Calculate actual tile dimensions from the grid element
  useEffect(() => {
    const calculateDimensions = () => {
      if (!gridRef.current) return;
      
      const gridElement = gridRef.current;
      const firstTile = gridElement.querySelector('[data-cell]');
      
      if (firstTile) {
        const rect = firstTile.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(gridElement);
        const gap = parseFloat(computedStyle.gap) || 4;
        
        setDimensions({
          tileSize: rect.width,
          gap: gap,
        });
      }
    };

    calculateDimensions();
    
    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [grid]);

  const handleMouseDown = useCallback((r, c) => {
    mouseDownRef.current = true;
    onStart?.(r, c);
  }, [onStart]);

  const handleMouseEnter = useCallback((r, c) => {
    if (mouseDownRef.current) {
      onEnter?.(r, c);
    }
  }, [onEnter]);

  const handleMouseUp = useCallback(() => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      onEnd?.();
    }
    setPointerPoint(null);
  }, [onEnd]);

  const handlePointerMove = useCallback((event) => {
    if (!mouseDownRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPointerPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((r, c, e) => {
    e.preventDefault();
    mouseDownRef.current = true;
    onStart?.(r, c);
  }, [onStart]);

  const handleTouchMove = useCallback((r, c, e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPointerPoint({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;
    const cell = target.closest('[data-cell]');
    if (!cell) return;
    const rr = Number(cell.getAttribute('data-r'));
    const cc = Number(cell.getAttribute('data-c'));
    onEnter?.(rr, cc);
  }, [onEnter]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    mouseDownRef.current = false;
    onEnd?.();
    setPointerPoint(null);
  }, [onEnd]);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const isInPath = (r, c) => path?.some(([pr, pc]) => pr === r && pc === c);
  const isLocked = (r, c) => lockedSet?.has(`${r},${c}`);
  const isHighlighted = (r, c) => highlightedSet?.has(`${r},${c}`);

  // Check if position is part of spangram
  const isSpangramCell = (r, c) => {
    if (!spangramPath) return false;
    return spangramPath.some(([pr, pc]) => pr === r && pc === c);
  };

  // Check if cell has a hint (tile-progressive system)
  const getHintedTile = (r, c) => {
    if (!hintedTiles || hintedTiles.length === 0) return null;
    return hintedTiles.find(t => t.row === r && t.col === c);
  };

  return (
    <div
      ref={containerRef}
      className="select-none relative strands-grid-container touch-none"
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
      onMouseMove={handlePointerMove}
    >
      {/* Locked word ribbons layer (behind everything) */}
      {foundWords && foundWords.length > 0 && foundWords.map((fw, idx) => (
        fw.path && (
          <LockedWordRibbon
            key={`locked-ribbon-${idx}`}
            path={fw.path}
            gridRows={rows}
            gridCols={cols}
            tileSize={dimensions.tileSize}
            gap={dimensions.gap}
            isSpangram={false}
            isThemeWord={true}
          />
        )
      ))}

      {/* Spangram ribbon */}
      {spangramPath && (
        <LockedWordRibbon
          path={spangramPath}
          gridRows={rows}
          gridCols={cols}
          tileSize={dimensions.tileSize}
          gap={dimensions.gap}
          isSpangram={true}
          isThemeWord={true}
        />
      )}

      {/* Active selection ribbon (smooth continuous path) */}
      {path && path.length > 0 && (
        <SelectionRibbon
          path={path}
          gridRows={rows}
          gridCols={cols}
          tileSize={dimensions.tileSize}
          gap={dimensions.gap}
          color="var(--strands-ribbon, #3b82f6)"
          opacity={0.8}
          isSpangram={false}
          previewPoint={pointerPoint}
        />
      )}

      {/* Grid tiles */}
      <div
        ref={gridRef}
        className={`grid gap-4 relative z-10 ${shouldShake ? 'animate-shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => (
          row.map((ch, c) => {
            const locked = isLocked(r, c);
            const active = isInPath(r, c);
            const highlighted = isHighlighted(r, c);
            const isSpangram = isSpangramCell(r, c);
            const hintedTile = getHintedTile(r, c);
            
            return (
              <div
                key={`${r}-${c}`}
                data-cell
                data-r={r}
                data-c={c}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                onTouchStart={(e) => handleTouchStart(r, c, e)}
                onTouchMove={(e) => handleTouchMove(r, c, e)}
                onTouchEnd={handleTouchEnd}
                className={[
                  // Base styles - COMPACT with smaller font
                  'aspect-square flex items-center justify-center',
                  'font-bold text-xs md:text-sm',
                  'transition-all duration-150 ease-out',
                  'border border-gray-200 dark:border-gray-700 rounded',
                  
                  // Locked/found state - subtle background, letters stay visible
                  locked && isSpangram 
                    ? 'bg-amber-200/70 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100' 
                    : locked 
                      ? 'bg-emerald-200/70 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100'
                      : 'bg-white dark:bg-gray-800',
                  
                  // Active selection - minimal styling since ribbon handles visual
                  active && !locked 
                    ? 'scale-110 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 font-black z-20 border-blue-400' 
                    : '',
                  
                  // HINTED TILE - Soft golden glow with pulse animation
                  hintedTile && !locked && !active
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-black animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                    : '',
                  
                  // Regular hint highlight
                  highlighted && !locked && !active && !hintedTile
                    ? 'ring-1 ring-yellow-400' 
                    : '',
                  
                  // Hover state for unselected, unlocked tiles
                  !locked && !active && !hintedTile
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' 
                    : '',
                  
                  // Cursor states
                  isDragging ? 'cursor-grabbing' : 'cursor-pointer',
                ].filter(Boolean).join(' ')}
              >
                {ch}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default StrandsGrid;
