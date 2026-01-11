'use client';

import React, { useRef } from 'react';

// Grid component that renders tiles and handles pointer interaction
const StrandsGrid = ({
  grid,
  path,
  lockedSet,
  highlightedSet,
  isDragging,
  shouldShake,
  onStart,
  onEnter,
  onEnd,
}) => {
  const mouseDownRef = useRef(false);

  const handleMouseDown = (r, c) => {
    mouseDownRef.current = true;
    onStart?.(r, c);
  };

  const handleMouseEnter = (r, c) => {
    if (mouseDownRef.current) {
      onEnter?.(r, c);
    }
  };

  const handleMouseUp = () => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      onEnd?.();
    }
  };

  // Touch handlers
  const handleTouchStart = (r, c, e) => {
    e.preventDefault();
    onStart?.(r, c);
  };

  const handleTouchMove = (r, c, e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;
    const cell = target.closest('[data-cell]');
    if (!cell) return;
    const rr = Number(cell.getAttribute('data-r'));
    const cc = Number(cell.getAttribute('data-c'));
    onEnter?.(rr, cc);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    onEnd?.();
  };

  const size = grid.length;

  const isInPath = (r, c) => path?.some(([pr, pc]) => pr === r && pc === c);
  const isLocked = (r, c) => lockedSet?.has(`${r},${c}`);
  const isHighlighted = (r, c) => highlightedSet?.has(`${r},${c}`);

  // Generate SVG lines between path tiles
  const generatePathLines = () => {
    if (!path || path.length < 2) return null;
    const lines = [];
    for (let i = 0; i < path.length - 1; i++) {
      const [r1, c1] = path[i];
      const [r2, c2] = path[i + 1];
      lines.push({ x1: c1, y1: r1, x2: c2, y2: r2, key: `${r1}-${c1}-${r2}-${c2}` });
    }
    return lines;
  };

  const pathLines = generatePathLines();

  return (
    <div
      className="select-none relative"
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      {/* SVG overlay for path lines */}
      {pathLines && pathLines.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {pathLines.map(line => {
            const cellSize = 100 / size;
            const x1 = (line.x1 + 0.5) * cellSize;
            const y1 = (line.y1 + 0.5) * cellSize;
            const x2 = (line.x2 + 0.5) * cellSize;
            const y2 = (line.y2 + 0.5) * cellSize;
            return (
              <line
                key={line.key}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="var(--crossword-active)"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-in fade-in duration-100"
              />
            );
          })}
        </svg>
      )}
      <div
        className={`grid gap-1 md:gap-1.5 ${shouldShake ? 'animate-shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) => (
          row.map((ch, c) => {
            const locked = isLocked(r, c);
            const active = isInPath(r, c);
            const highlighted = isHighlighted(r, c);
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
                  'aspect-square rounded-lg flex items-center justify-center font-bold text-xl md:text-2xl transition-all duration-200',
                  'border-2',
                  locked ? 'bg-wordle-correct text-white border-wordle-correct shadow-md' : 'bg-card border-wordle-tile-border',
                  active && !locked ? 'ring-4 ring-crossword-active ring-opacity-50 bg-crossword-highlight scale-105' : '',
                  highlighted && !locked ? 'outline outline-2 outline-wordle-present outline-offset-2' : '',
                  !locked && !active ? 'hover:border-crossword-active hover:bg-crossword-highlight' : '',
                  isDragging ? 'cursor-grabbing' : 'cursor-pointer',
                ].join(' ')}
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
