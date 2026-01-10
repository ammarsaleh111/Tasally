import React from 'react';
import { LETTER_STATUS } from '../games/wordle/wordleLogic';

const WordleGrid = React.memo(({ guesses, currentGuess, turn, status, length = 5, isShaking = false }) => {
  const empties = 
    guesses.length < 6 ? Array.from(Array(6 - 1 - guesses.length)) : [];
  
  // Calculate grid max-width based on scaling to keep tiles roughly similar size
  const getMaxWidth = () => {
    switch(length) {
        case 4: return 'max-w-[280px]'; // Narrower for 4 letters
        case 6: return 'max-w-[400px]'; // Narrower for 6 letters
        default: return 'max-w-[340px]'; // Narrower for 5 letters
    }
  };

  return (
    <div className={`w-full ${getMaxWidth()} mx-auto gap-1.5 mb-6 flex flex-col`}>
      {guesses.map((guess, i) => (
        <CompletedRow key={i} guess={guess} length={length} />
      ))}
      {guesses.length < 6 && <CurrentRow guess={currentGuess} length={length} isShaking={isShaking} />}
      {empties.map((_, i) => (
        <EmptyRow key={i} length={length} />
      ))}
    </div>
  );
});

const getGridColsStyle = (length) => {
    switch(length) {
        case 4: return 'grid-cols-4';
        case 6: return 'grid-cols-6';
        default: return 'grid-cols-5';
    }
}

const CompletedRow = React.memo(({ guess, length }) => {
  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full`}>
      {guess.word.split('').map((letter, i) => (
        <div
          key={i}
          className={`
            aspect-square w-full border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold text-[var(--button-text)] capitalize
            ${guess.evaluation[i] === LETTER_STATUS.CORRECT ? 'bg-wordle-correct border-wordle-correct' : ''}
            ${guess.evaluation[i] === LETTER_STATUS.PRESENT ? 'bg-wordle-present border-wordle-present' : ''}
            ${guess.evaluation[i] === LETTER_STATUS.ABSENT ? 'bg-wordle-absent border-wordle-absent' : ''}
            animate-flip
          `}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
});

const CurrentRow = React.memo(({ guess, length, isShaking = false }) => {
  const splitGuess = guess.split('');
  const emptyCount = Math.max(0, length - splitGuess.length);
  const emptyCells = Array.from(Array(emptyCount));

  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full ${isShaking ? 'animate-shake' : ''}`}>
      {splitGuess.map((letter, i) => (
        <div
          key={i}
          className="aspect-square w-full border-2 border-border-active flex items-center justify-center text-2xl sm:text-3xl font-bold text-foreground capitalize animate-pop"
        >
          {letter}
        </div>
      ))}
      {emptyCells.map((_, i) => (
        <div
          key={i}
          className="aspect-square w-full border-2 border-border-default flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
});

const EmptyRow = React.memo(({ length }) => {
  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full`}>
      {Array.from(Array(length)).map((_, i) => (
        <div
          key={i}
          className="aspect-square w-full border-2 border-border-default flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
});

export default WordleGrid;
