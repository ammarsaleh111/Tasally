'use client';

import React, { useState } from 'react';
import Toast from './Toast';

const ShareResults = ({ gameName, result, puzzleNumber }) => {
  const [showToast, setShowToast] = useState(false);

  const generateShareText = () => {
    const lines = [`Ammar Times ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} ${puzzleNumber || ''}`];

    switch (gameName) {
      case 'wordle':
        lines.push(generateWordleGrid(result));
        break;
      case 'connections':
        lines.push(generateConnectionsGrid(result));
        break;
      case 'crossword':
        lines.push(generateCrosswordText(result));
        break;
      case 'numbers':
        lines.push(generateNumbersText(result));
        break;
      case 'trivia':
        lines.push(generateTriviaText(result));
        break;
      case 'strands':
        lines.push(generateStrandsText(result));
        break;
    }

    return lines.join('\n');
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    try {
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        await navigator.share({
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setShowToast(true);
      }
    } catch (error) {
      // Fallback: try clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setShowToast(true);
      } catch (clipboardError) {
        console.error('Failed to share:', clipboardError);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="w-full py-3 bg-[var(--button-primary)] text-[var(--button-text)] rounded-lg hover:bg-[var(--button-primary-hover)] transition-all font-bold flex items-center justify-center gap-2"
      >
        <span>📤</span>
        <span>Share Results</span>
      </button>

      {showToast && (
        <Toast
          message="Results copied to clipboard!"
          onExited={() => setShowToast(false)}
        />
      )}
    </>
  );
};

// Generate Wordle grid
function generateWordleGrid(result) {
  if (!result || !result.guesses) return '';

  const lines = result.guesses.map((guess) => {
    return guess.evaluation
      .map((status) => {
        switch (status) {
          case 'correct':
            return '🟩';
          case 'present':
            return '🟨';
          default:
            return '⬛';
        }
      })
      .join('');
  });

  return lines.join('\n');
}

// Generate Connections grid
function generateConnectionsGrid(result) {
  if (!result || !result.solvedGroups) return '';

  const colorMap = {
    0: '🟨', // Yellow
    1: '🟩', // Green
    2: '🟦', // Blue
    3: '🟪', // Purple
  };

  const lines = result.solvedGroups.map((groupIndex) => {
    return colorMap[groupIndex] || '⬛';
  });

  return lines.join('\n');
}

// Generate Crossword text
function generateCrosswordText(result) {
  if (!result || !result.time) return '';

  const minutes = Math.floor(result.time / 60);
  const seconds = result.time % 60;
  const timeStr = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`;

  return `🧩 ${timeStr}`;
}

// Generate Numbers text
function generateNumbersText(result) {
  if (!result) return '';

  const exact = result.exact ? '🎯 Exact!' : `📊 ${result.difference || 0} away`;
  return exact;
}

// Generate Trivia text
function generateTriviaText(result) {
  if (!result || result.score === undefined) return '';

  return `🎓 ${result.score}/10`;
}

// Generate Strands text
function generateStrandsText(result) {
  if (!result) return '';
  const wordsFound = result.wordsFound ?? 0;
  const totalWords = result.totalWords ?? 0;
  const header = `🧵 ${wordsFound}/${totalWords}${result.spangram ? ' + Spangram' : ''}`;
  const bar = '🟦'.repeat(Math.max(0, wordsFound));
  return [header, bar].join('\n');
}

export default ShareResults;
