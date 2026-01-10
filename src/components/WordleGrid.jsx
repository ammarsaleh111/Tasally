import React from 'react';
import { LETTER_STATUS } from '../games/wordle/wordleLogic';

const WordleGrid = ({ guesses, currentGuess, turn, status, length = 5 }) => {
  const empties = 
    guesses.length < 6 ? Array.from(Array(5 - guesses.length)) : [];

  return (
    <div className="grid grid-rows-6 gap-1.5 mb-6">
      {guesses.map((guess, i) => (
        <CompletedRow key={i} guess={guess} length={length} />
      ))}
      {guesses.length < 6 && <CurrentRow guess={currentGuess} length={length} />}
      {empties.map((_, i) => (
        <EmptyRow key={i} length={length} />
      ))}
    </div>
  );
};

const getGridColsStyle = (length) => {
    switch(length) {
        case 4: return 'grid-cols-4';
        case 6: return 'grid-cols-6';
        default: return 'grid-cols-5';
    }
}

const CompletedRow = ({ guess, length }) => {
  // guess object structure: { word: "HELLO", evaluation: ["correct", "absent", ...] }
  
  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5`}>
      {guess.word.split('').map((letter, i) => (
        <div
          key={i}
          className={`
            w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white capitalize
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
};

const CurrentRow = ({ guess, length }) => {
  const splitGuess = guess.split('');
  const emptyCount = Math.max(0, length - splitGuess.length);
  const emptyCells = Array.from(Array(emptyCount));

  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5`}>
      {splitGuess.map((letter, i) => (
        <div
          key={i}
          className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-border-active flex items-center justify-center text-2xl sm:text-3xl font-bold text-foreground capitalize animate-pulse-short"
        >
          {letter}
        </div>
      ))}
      {emptyCells.map((_, i) => (
        <div
          key={i}
          className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-border-default flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
};

const EmptyRow = ({ length }) => {
  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5`}>
      {Array.from(Array(length)).map((_, i) => (
        <div
          key={i}
          className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-border-default flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
};

export default WordleGrid;
