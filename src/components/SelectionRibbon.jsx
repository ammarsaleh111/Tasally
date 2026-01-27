'use client';

import React, { useId, useMemo } from 'react';

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
  gridRows,
  gridCols,
  tileSize = 48,
  gap = 4,
  color = 'var(--strands-ribbon)',
  opacity = 0.85,
  isSpangram = false,
  previewPoint = null,
}) {
  const gradientId = useId();
  const spangramId = useId();
  const glowId = useId();
  const shadowId = useId();

  const buildSmoothPath = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

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
    const d = buildSmoothPath(points);

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
  const resolvedRows = gridRows || gridSize;
  const resolvedCols = gridCols || gridSize;

  const svgSize = useMemo(() => {
    const cellTotalSize = tileSize + gap;
    return {
      width: resolvedCols * cellTotalSize - gap,
      height: resolvedRows * cellTotalSize - gap,
    };
  }, [resolvedCols, resolvedRows, tileSize, gap]);

  // Ribbon stroke width (70-80% of tile width)
  const strokeWidth = tileSize * 0.72;

  // Glow radius
  const glowRadius = tileSize * 0.22;

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
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      {/* Gradient definitions for premium look */}
      <defs>
        {/* Main ribbon gradient */}
        <linearGradient id={`ribbonGradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={ribbonColor} stopOpacity={opacity} />
          <stop offset="50%" stopColor={ribbonColor} stopOpacity={opacity * 0.9} />
          <stop offset="100%" stopColor={ribbonColor} stopOpacity={opacity} />
        </linearGradient>

        {/* Spangram shimmer gradient */}
        <linearGradient id={`spangramGradient-${spangramId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
          <stop offset="25%" stopColor="#fcd34d" stopOpacity={0.95} />
          <stop offset="50%" stopColor="#fde68a" stopOpacity={1} />
          <stop offset="75%" stopColor="#fcd34d" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9} />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`glowFilter-${glowId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow for ribbon */}
        <filter id={`ribbonShadow-${shadowId}`} x="-20%" y="-20%" width="140%" height="140%">
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
            filter={`url(#glowFilter-${glowId})`}
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
          fill={isSpangram ? `url(#spangramGradient-${spangramId})` : `url(#ribbonGradient-${gradientId})`}
          filter={`url(#ribbonShadow-${shadowId})`}
          className="animate-in zoom-in-50 duration-150"
        />
      ) : (
        // Multi-cell selection - render path
        <>
          <path
            d={ribbonPath.d}
            fill="none"
            stroke={isSpangram ? `url(#spangramGradient-${spangramId})` : `url(#ribbonGradient-${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#ribbonShadow-${shadowId})`}
            className="animate-in fade-in duration-100"
          />
          {previewPoint && ribbonPath.points && ribbonPath.points.length > 0 && (
            <path
              d={`M ${ribbonPath.points[ribbonPath.points.length - 1].x} ${ribbonPath.points[ribbonPath.points.length - 1].y} L ${previewPoint.x} ${previewPoint.y}`}
              fill="none"
              stroke={isSpangram ? `url(#spangramGradient-${spangramId})` : `url(#ribbonGradient-${gradientId})`}
              strokeWidth={strokeWidth * 0.55}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.35}
            />
          )}
        </>
      )}

      {/* Bridge nodes for subtle joins */}
      {ribbonPath.type === 'path' && ribbonPath.points?.length > 1 && (
        <g className="bridge-nodes">
          {ribbonPath.points.map((point, idx) => (
            <circle
              key={`node-${idx}`}
              cx={point.x}
              cy={point.y}
              r={strokeWidth * 0.18}
              fill={isSpangram ? `url(#spangramGradient-${spangramId})` : `url(#ribbonGradient-${gradientId})`}
              opacity={0.35}
            />
          ))}
        </g>
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
  gridRows,
  gridCols,
  tileSize = 48,
  gap = 4,
  isSpangram = false,
  isThemeWord = true,
}) {
  const gradientId = useId();
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
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return { type: 'path', d, points };
  }, [path, tileSize, gap]);

  const resolvedRows = gridRows || gridSize;
  const resolvedCols = gridCols || gridSize;

  const svgSize = useMemo(() => {
    const cellTotalSize = tileSize + gap;
    return {
      width: resolvedCols * cellTotalSize - gap,
      height: resolvedRows * cellTotalSize - gap,
    };
  }, [resolvedCols, resolvedRows, tileSize, gap]);

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
      viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`lockedGradient-${gradientId}`}>
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {ribbonPath.type === 'single' ? (
        <circle
          cx={ribbonPath.center.x}
          cy={ribbonPath.center.y}
          r={ribbonPath.radius}
          fill={`url(#lockedGradient-${gradientId})`}
        />
      ) : (
        <path
          d={ribbonPath.d}
          fill="none"
          stroke={`url(#lockedGradient-${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
