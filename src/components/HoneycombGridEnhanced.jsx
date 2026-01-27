'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * Enhanced HoneycombGrid Component
 * 
 * Features:
 * - Hexagonal letter layout for Spelling Bee game
 * - Beautiful "connecting string" path drawn BEHIND letters
 * - Smooth SVG path with rounded corners
 * - Support for both click and drag selection
 * - Desktop mouse and mobile touch support via Pointer Events
 */
export default function HoneycombGridEnhanced({ 
  centerLetter, 
  outerLetters, 
  onLetterClick, 
  onWordChange,
  currentWord = '',
  disabled = false 
}) {
  const containerRef = useRef(null);
  const [letterPositions, setLetterPositions] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [pointerPos, setPointerPos] = useState(null);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [clickedLetter, setClickedLetter] = useState(null);
  
  // All letters in order: center first, then outer
  const allLetters = useMemo(() => [centerLetter, ...outerLetters], [centerLetter, outerLetters]);

  // Calculate letter positions after layout
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const positions = {};
      
      // Get all hex buttons
      const buttons = container.querySelectorAll('[data-letter]');
      buttons.forEach((btn) => {
        const letter = btn.getAttribute('data-letter');
        const rect = btn.getBoundingClientRect();
        positions[letter] = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });
      
      setLetterPositions(positions);
    };

    // Update positions after a short delay to ensure layout is complete
    const timer = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [outerLetters, centerLetter]);

  // Find which letter is at a given position
  const getLetterAtPosition = useCallback((x, y) => {
    const threshold = 50; // Pixel radius for hit detection
    let closestLetter = null;
    let closestDistance = Infinity;
    
    for (const [letter, pos] of Object.entries(letterPositions)) {
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      if (distance < threshold && distance < closestDistance) {
        closestDistance = distance;
        closestLetter = letter;
      }
    }
    
    return closestLetter;
  }, [letterPositions]);

  // Handle pointer down (start selection)
  const handlePointerDown = useCallback((e, letter) => {
    if (disabled) return;
    
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    
    setIsDragging(true);
    setSelectedLetters([letter]);
    setClickedLetter(letter);
    
    // Get pointer position relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPointerPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    
    setTimeout(() => setClickedLetter(null), 200);
  }, [disabled]);

  // Handle pointer move (extend selection)
  const handlePointerMove = useCallback((e) => {
    if (!isDragging || disabled || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPointerPos({ x, y });
    
    // Check if we're over a new letter
    const letter = getLetterAtPosition(x, y);
    if (letter && !selectedLetters.includes(letter)) {
      setSelectedLetters(prev => [...prev, letter]);
      setClickedLetter(letter);
      setTimeout(() => setClickedLetter(null), 200);
    }
  }, [isDragging, disabled, getLetterAtPosition, selectedLetters]);

  // Handle pointer up (end selection and submit)
  const handlePointerUp = useCallback((e) => {
    if (!isDragging) return;
    
    e.target.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    setPointerPos(null);
    
    // Build word from selected letters and notify parent
    if (selectedLetters.length > 0) {
      const word = selectedLetters.join('');
      onWordChange?.(word);
    }
    
    // Animate path fade out
    setTimeout(() => {
      setSelectedLetters([]);
    }, 150);
  }, [isDragging, selectedLetters, onWordChange]);

  // Handle simple click (add single letter)
  const handleLetterClick = useCallback((letter) => {
    if (disabled) return;
    
    setClickedLetter(letter);
    onLetterClick?.(letter);
    
    // Add to selection for visual feedback
    setSelectedLetters(prev => [...prev, letter]);
    setTimeout(() => setClickedLetter(null), 200);
    
    // Clear selection path after brief delay
    setTimeout(() => {
      setSelectedLetters([]);
    }, 300);
  }, [disabled, onLetterClick]);

  // Derive selection from current word when not dragging (for keyboard input)
  // We use useMemo instead of useEffect to avoid cascading renders
  const displayedLetters = useMemo(() => {
    if (isDragging) {
      return selectedLetters;
    }
    if (currentWord) {
      return currentWord.split('');
    }
    return [];
  }, [currentWord, isDragging, selectedLetters]);

  const pathString = useMemo(() => {
    if (displayedLetters.length === 0) return '';
    
    const points = displayedLetters
      .map(letter => letterPositions[letter])
      .filter(Boolean);
    
    if (points.length === 0) return '';
    
    // Start path
    let d = `M ${points[0].x} ${points[0].y}`;
    
    // Add line segments
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      d += ` L ${curr.x} ${curr.y}`;
    }
    
    // Add preview segment to current pointer position
    if (isDragging && pointerPos && points.length > 0) {
      d += ` L ${pointerPos.x} ${pointerPos.y}`;
    }
    
    return d;
  }, [displayedLetters, letterPositions, isDragging, pointerPos]);

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center select-none touch-none"
      style={{ height: '280px' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* SVG Path Layer - BEHIND letters */}
      <svg 
        className="absolute inset-0 z-[1] pointer-events-none overflow-visible"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Glow filter for subtle effect */}
          <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Main path with glow */}
        {pathString && (
          <>
            {/* Glow layer */}
            <path
              d={pathString}
              fill="none"
              stroke="hsl(var(--accent) / 0.3)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-opacity duration-150"
              style={{ opacity: selectedLetters.length > 0 ? 1 : 0 }}
            />
            {/* Main stroke */}
            <path
              d={pathString}
              fill="none"
              stroke="hsl(var(--accent) / 0.6)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-opacity duration-150"
              style={{ opacity: selectedLetters.length > 0 ? 1 : 0 }}
            />
          </>
        )}
        
        {/* Letter dots at selection points */}
        {displayedLetters.map((letter, index) => {
          const pos = letterPositions[letter];
          if (!pos) return null;
          return (
            <circle
              key={`${letter}-${index}`}
              cx={pos.x}
              cy={pos.y}
              r="8"
              fill="hsl(var(--accent))"
              className="transition-all duration-150"
              style={{ opacity: 0.8 }}
            />
          );
        })}
      </svg>

      {/* Center Hexagon */}
      <div className="absolute z-[2]">
        <HexButton
          letter={centerLetter}
          isCenter={true}
          onClick={() => handleLetterClick(centerLetter)}
          onPointerDown={(e) => handlePointerDown(e, centerLetter)}
          isClicked={clickedLetter === centerLetter}
          isSelected={displayedLetters.includes(centerLetter)}
          disabled={disabled}
        />
      </div>

      {/* Outer Hexagons in circle pattern */}
      {outerLetters.map((letter, index) => {
        const angle = (index * 60) - 90; // Start from top, 60° apart
        const radius = 90; // Distance from center
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <div
            key={`${letter}-${index}`}
            className="absolute z-[2]"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <HexButton
              letter={letter}
              isCenter={false}
              onClick={() => handleLetterClick(letter)}
              onPointerDown={(e) => handlePointerDown(e, letter)}
              isClicked={clickedLetter === letter}
              isSelected={displayedLetters.includes(letter)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Individual hexagon button
 */
function HexButton({ letter, isCenter, onClick, onPointerDown, isClicked, isSelected, disabled }) {
  return (
    <button
      data-letter={letter}
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className={`
        relative w-16 h-16 flex items-center justify-center
        text-2xl font-bold uppercase
        transition-all duration-200
        ${isClicked ? 'scale-125' : isSelected ? 'scale-110' : 'scale-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-125'}
        ${isCenter 
          ? 'bg-wordle-present text-background hover:bg-button-primary' 
          : 'bg-key text-key-fg hover:bg-key-hover'
        }
        ${isSelected && !isCenter ? 'ring-2 ring-wordle-present ring-offset-2 ring-offset-background' : ''}
      `}
      style={{
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        touchAction: 'none',
      }}
      aria-label={`Letter ${letter}${isCenter ? ' (center)' : ''}`}
    >
      <span className="relative z-10 pointer-events-none">{letter}</span>
    </button>
  );
}
