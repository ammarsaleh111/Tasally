'use client';

import React, { useMemo } from 'react';

/**
 * SelectionRibbon - NYT-style smooth ribbon selection for Strands
 * 
 * Renders a continuous, smooth ribbon path connecting selected tiles.
 * Uses SVG with rounded strokes for a premium visual effect.
 * 
 * @param {Array} path - Array of [row, col] positions in selection order
 * @param {number} gridSize - Number of rows/columns in the grid
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} gap - Gap between tiles in pixels
 * @param {string} color - Ribbon color (CSS color value)
 * @param {number} opacity - Ribbon opacity (0-1)
 * @param {boolean} isSpangram - Whether this is a spangram selection
 */
export default function SelectionRibbon({
  path = [],
  gridSize = 6,
  tileSize = 48,
  gap = 4,
  color = 'var(--strands-ribbon)',
  opacity = 0.85,
  isSpangram = false,
}) {
  // Calculate ribbon path as SVG
  const ribbonPath = useMemo(() => {
    if (!path || path.length < 1) return null;

    // Cell total size including gap
    const cellTotalSize = tileSize + gap;
    // Center offset within cell
    const centerOffset = tileSize / 2;

    // Convert grid position to pixel position (center of tile)
    const getCenter = (row, col) => ({
      x: col * cellTotalSize + centerOffset,
      y: row * cellTotalSize + centerOffset,
    });

    // If only one cell selected, return circle data
    if (path.length === 1) {
      const center = getCenter(path[0][0], path[0][1]);
      return {
        type: 'single',
        center,
        radius: tileSize * 0.38,
      };
    }

    // Build smooth path through all selected cells
    const points = path.map(([r, c]) => getCenter(r, c));
    
    // Create SVG path with smooth curves
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Direct line to each point (the stroke-linejoin: round handles corners)
      d += ` L ${curr.x} ${curr.y}`;
    }

    return {
      type: 'path',
      d,
      points,
    };
  }, [path, tileSize, gap]);

  // Calculate glow points for each selected cell
  const glowPoints = useMemo(() => {
    if (!path || path.length === 0) return [];

    const cellTotalSize = tileSize + gap;
    const centerOffset = tileSize / 2;

    return path.map(([r, c]) => ({
      x: c * cellTotalSize + centerOffset,
      y: r * cellTotalSize + centerOffset,
    }));
  }, [path, tileSize, gap]);

  // Calculate SVG dimensions
  const svgSize = useMemo(() => {
    const cellTotalSize = tileSize + gap;
    return gridSize * cellTotalSize - gap;
  }, [gridSize, tileSize, gap]);

  // Ribbon stroke width (70-80% of tile width)
  const strokeWidth = tileSize * 0.75;

  // Glow radius
  const glowRadius = tileSize * 0.25;

  if (!ribbonPath) return null;

  // Determine colors based on selection type
  const ribbonColor = isSpangram 
    ? 'var(--strands-spangram-ribbon, #fbbf24)' 
    : color;
  const glowColor = isSpangram 
    ? 'var(--strands-spangram-glow, #fcd34d)' 
    : 'var(--strands-glow, rgba(59, 130, 246, 0.5))';

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0 selection-ribbon"
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      {/* Gradient definitions for premium look */}
      <defs>
        {/* Main ribbon gradient */}
        <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={ribbonColor} stopOpacity={opacity} />
          <stop offset="50%" stopColor={ribbonColor} stopOpacity={opacity * 0.9} />
          <stop offset="100%" stopColor={ribbonColor} stopOpacity={opacity} />
        </linearGradient>

        {/* Spangram shimmer gradient */}
        <linearGradient id="spangramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
          <stop offset="25%" stopColor="#fcd34d" stopOpacity={0.95} />
          <stop offset="50%" stopColor="#fde68a" stopOpacity={1} />
          <stop offset="75%" stopColor="#fcd34d" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9} />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow for ribbon */}
        <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Render glow points behind ribbon */}
      <g className="glow-layer">
        {glowPoints.map((point, idx) => (
          <circle
            key={`glow-${idx}`}
            cx={point.x}
            cy={point.y}
            r={glowRadius}
            fill={glowColor}
            opacity={0.6}
            filter="url(#glowFilter)"
            className="animate-pulse"
          />
        ))}
      </g>

      {/* Render the ribbon path */}
      {ribbonPath.type === 'single' ? (
        // Single cell selection - render a circle
        <circle
          cx={ribbonPath.center.x}
          cy={ribbonPath.center.y}
          r={ribbonPath.radius}
          fill={isSpangram ? 'url(#spangramGradient)' : 'url(#ribbonGradient)'}
          filter="url(#ribbonShadow)"
          className="animate-in zoom-in-50 duration-150"
        />
      ) : (
        // Multi-cell selection - render path
        <path
          d={ribbonPath.d}
          fill="none"
          stroke={isSpangram ? 'url(#spangramGradient)' : 'url(#ribbonGradient)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ribbonShadow)"
          className="animate-in fade-in duration-100"
        />
      )}
    </svg>
  );
}

/**
 * LockedWordRibbon - Renders completed word ribbons
 * For words that have been found and locked in
 */
export function LockedWordRibbon({
  path = [],
  gridSize = 6,
  tileSize = 48,
  gap = 4,
  isSpangram = false,
  isThemeWord = true,
}) {
  const ribbonPath = useMemo(() => {
    if (!path || path.length < 1) return null;

    const cellTotalSize = tileSize + gap;
    const centerOffset = tileSize / 2;

    const getCenter = (row, col) => ({
      x: col * cellTotalSize + centerOffset,
      y: row * cellTotalSize + centerOffset,
    });

    if (path.length === 1) {
      const center = getCenter(path[0][0], path[0][1]);
      return {
        type: 'single',
        center,
        radius: tileSize * 0.38,
      };
    }

    const points = path.map(([r, c]) => getCenter(r, c));
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }

    return { type: 'path', d, points };
  }, [path, tileSize, gap]);

  const svgSize = useMemo(() => {
    const cellTotalSize = tileSize + gap;
    return gridSize * cellTotalSize - gap;
  }, [gridSize, tileSize, gap]);

  const strokeWidth = tileSize * 0.7;

  if (!ribbonPath) return null;

  // Color based on word type
  const color = isSpangram 
    ? 'var(--strands-spangram-locked, #f59e0b)'
    : isThemeWord 
      ? 'var(--strands-word-locked, #22c55e)'
      : 'var(--strands-bonus-locked, #8b5cf6)';

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`lockedGradient-${isSpangram ? 'spangram' : isThemeWord ? 'theme' : 'bonus'}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {ribbonPath.type === 'single' ? (
        <circle
          cx={ribbonPath.center.x}
          cy={ribbonPath.center.y}
          r={ribbonPath.radius}
          fill={`url(#lockedGradient-${isSpangram ? 'spangram' : isThemeWord ? 'theme' : 'bonus'})`}
        />
      ) : (
        <path
          d={ribbonPath.d}
          fill="none"
          stroke={`url(#lockedGradient-${isSpangram ? 'spangram' : isThemeWord ? 'theme' : 'bonus'})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
