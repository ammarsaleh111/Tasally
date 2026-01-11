'use client';

import React from 'react';
import Modal from './Modal';

/**
 * Game-specific How To Play content configurations
 * Each game defines its own rules, examples, and tips
 */
export const GAME_INSTRUCTIONS = {
  wordle: {
    title: 'How To Play Wordle',
    description: 'Guess the hidden word in 6 tries.',
    rules: [
      'Each guess must be a valid 5 letter word',
      'Hit the enter button to submit the guess',
      'After your submission, the color of the tiles will change',
    ],
    examples: [
      {
        word: ['G', 'A', 'M', 'E', 'S'],
        highlights: [{ index: 0, type: 'correct' }],
        explanation: 'The letter G is in the word and in the correct spot.',
      },
      {
        word: ['H', 'O', 'T', 'E', 'L'],
        highlights: [{ index: 1, type: 'present' }],
        explanation: 'The letter O is in the word but in the wrong spot.',
      },
      {
        word: ['C', 'L', 'I', 'C', 'K'],
        highlights: [{ index: 2, type: 'absent' }],
        explanation: 'The letter I is not in the word in any spot.',
      },
    ],
    tips: ['A new puzzle is available each day!'],
  },
  
  connections: {
    title: 'How To Play Connections',
    description: 'Group 16 words into 4 categories of 4 words each.',
    rules: [
      'Find groups of 4 items that share something in common',
      'Select 4 items and tap Submit to check your answer',
      'Find all 4 groups without making 4 mistakes',
      'Categories are color-coded by difficulty (Yellow → Purple)',
    ],
    examples: [],
    tips: [
      'Yellow is easiest, purple is hardest',
      'Watch for tricky word associations',
    ],
  },
  
  strands: {
    title: 'How To Play Strands',
    description: 'Find all theme words hidden in the letter grid.',
    rules: [
      'Find words related to the daily theme',
      'Connect adjacent letters (including diagonals) to spell words',
      'Each letter can only be used once per word',
      'Find the SPANGRAM - a special theme word that touches two opposite sides of the board',
      'All theme words together will use every letter in the grid exactly once',
    ],
    examples: [],
    tips: [
      'Start by reading the theme hint at the top',
      'The Spangram is usually longer and spans the entire board',
      'Non-theme words you find will earn hint credits',
      'Use hints to reveal letters of unfound theme words',
    ],
  },
  
  crossword: {
    title: 'How To Play Crossword',
    description: 'Fill in the grid by solving clues for across and down words.',
    rules: [
      'Click a cell to select it, then type your answer',
      'Use Tab or arrows to move between cells',
      'Click a clue to jump to that word',
      'Complete all words to solve the puzzle',
    ],
    examples: [],
    tips: [
      'Start with clues you know for sure',
      'Cross-checking letters helps verify answers',
    ],
  },
  
  trivia: {
    title: 'How To Play Trivia',
    description: 'Answer 10 questions to test your knowledge.',
    rules: [
      'Read each question carefully',
      'Select one of the multiple choice answers',
      'You cannot change your answer after selecting',
      'Try to answer all questions correctly',
    ],
    examples: [],
    tips: [
      'Take your time - there\'s no timer pressure',
      'Questions span various topics and difficulties',
    ],
  },
  
  numbers: {
    title: 'How To Play Numbers',
    description: 'Use 6 numbers and basic operations to reach the target.',
    rules: [
      'Combine numbers using +, -, ×, ÷',
      'Each number can only be used once',
      'You don\'t have to use all numbers',
      'Get as close to the target as possible',
    ],
    examples: [],
    tips: [
      'Start with large numbers to get close quickly',
      'Use smaller numbers for fine-tuning',
    ],
  },
  
  waffle: {
    title: 'How To Play Waffle',
    description: 'Swap letters to solve all words in the waffle grid.',
    rules: [
      'The grid contains 6 words - 3 across and 3 down',
      'Swap letters to make all words valid',
      'Green letters are already in the correct position',
      'Yellow letters are in the word but wrong position',
    ],
    examples: [],
    tips: [
      'Start by placing green letters correctly',
      'Fewer swaps = better score',
    ],
  },
  
  combinations: {
    title: 'How To Play Combinations',
    description: 'Create words using letter fragments.',
    rules: [
      'Combine 2-3 letter fragments to form words',
      'Each fragment can only be used once',
      'Words must be valid English words',
      'Score points based on word length',
    ],
    examples: [],
    tips: [
      'Look for common prefixes and suffixes',
      'Longer words score more points',
    ],
  },
  
  spelling: {
    title: 'How To Play Spelling Bee',
    description: 'Create words using the given letters.',
    rules: [
      'Use the center letter in every word',
      'Words must be at least 4 letters',
      'Letters can be reused',
      'No proper nouns, hyphenated words, or obscure terms',
    ],
    examples: [],
    tips: [
      'Find the pangram - a word using ALL letters',
      'Shuffle letters for a fresh perspective',
    ],
  },
};

/**
 * UnifiedHowToPlay - Standard How To Play modal for ALL games
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} gameName - Game identifier (wordle, connections, etc.)
 */
const UnifiedHowToPlay = ({ isOpen, onClose, gameName }) => {
  const content = GAME_INSTRUCTIONS[gameName] || {
    title: 'How To Play',
    description: 'Learn how to play this game.',
    rules: [],
    examples: [],
    tips: [],
  };

  return (
    <Modal 
      isOpen={isOpen} 
      title={content.title}
      actions={
        <button
          onClick={onClose}
          className="w-full py-3 bg-button-primary text-button-text rounded-lg hover:bg-button-primary-hover transition-all font-bold"
        >
          Got it!
        </button>
      }
    >
      <div className="space-y-4 text-left">
        {/* Description */}
        <p className="text-foreground font-medium">{content.description}</p>

        {/* Rules */}
        {content.rules.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-foreground">Rules:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-muted ml-2">
              {content.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples (for Wordle-style games) */}
        {content.examples.length > 0 && (
          <div className="border-t border-border-default pt-4">
            <h3 className="font-bold mb-3 text-foreground">Examples:</h3>
            {content.examples.map((example, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex gap-1 mb-2">
                  {example.word.map((letter, i) => {
                    const highlight = example.highlights.find(h => h.index === i);
                    let bgClass = 'border-border-default text-foreground';
                    if (highlight?.type === 'correct') {
                      bgClass = 'bg-wordle-correct border-wordle-correct text-white';
                    } else if (highlight?.type === 'present') {
                      bgClass = 'bg-wordle-present border-wordle-present text-white';
                    } else if (highlight?.type === 'absent') {
                      bgClass = 'bg-wordle-absent border-wordle-absent text-white';
                    }
                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 border-2 flex items-center justify-center text-lg font-bold ${bgClass}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-text-muted">{example.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {content.tips.length > 0 && (
          <div className="border-t border-border-default pt-4">
            <h3 className="font-bold text-foreground mb-2">💡 Tips:</h3>
            <ul className="space-y-1 text-sm text-text-muted">
              {content.tips.map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UnifiedHowToPlay;
