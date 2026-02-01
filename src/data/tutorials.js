export const GLOBAL_TUTORIAL = {
  id: 'global',
  title: 'Getting Started',
  steps: [
    {
      title: 'Welcome to Ammar Times',
      body: 'Daily brain games in one place. Short sessions, clear progress, and a calm pace.',
      illustration: 'W',
    },
    {
      title: 'Games',
      body: 'Each game has its own rules and tutorial. Try a new one anytime.',
      illustration: 'G',
    },
    {
      title: 'Progress and Badges',
      body: 'Wins, streaks, badges, and leaderboards track your progress across games.',
      illustration: 'P',
    },
    {
      title: 'Help and Tutorials',
      body: 'Use the How to Play button inside any game to replay tutorials.',
      illustration: 'H',
      highlight: { selector: '[data-tutorial="how-to-play"]' },
    },
    {
      title: 'Ready',
      body: 'Pick a game and start playing when you are ready.',
      illustration: '!',
    },
  ],
};

export const GAME_TUTORIALS = {
  wordle: {
    id: 'wordle',
    title: 'How to Play Wordle',
    steps: [
      {
        title: 'Goal',
        body: 'Guess the hidden word in 6 tries.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="wordle-board"]' },
      },
      {
        title: 'Controls',
        body: 'Type letters with your keyboard or tap the on-screen keys, then press Enter.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="wordle-controls"]' },
        gesture: 'Type or tap',
      },
      {
        title: 'Rules',
        body: 'Tile colors give feedback: green is correct spot, yellow is wrong spot, gray is not in the word.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="wordle-board"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Solve within 6 attempts to win. Your streaks and stats are tracked.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Earn badges and compare results on leaderboards.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  connections: {
    id: 'connections',
    title: 'How to Play Connections',
    steps: [
      {
        title: 'Goal',
        body: 'Group 16 words into 4 related sets of 4.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="connections-grid"]' },
      },
      {
        title: 'Controls',
        body: 'Tap words to select 4, then tap Submit to check your group.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="connections-controls"]' },
        gesture: 'Tap to select',
      },
      {
        title: 'Rules',
        body: 'You have 4 mistakes total. Yellow is easiest and purple is hardest.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="connections-mistakes"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Solve all groups to win. Fewer mistakes is a better result.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  strands: {
    id: 'strands',
    title: 'How to Play Strands',
    steps: [
      {
        title: 'Goal',
        body: 'Find all theme words hidden in the grid.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="strands-theme"]' },
      },
      {
        title: 'Controls',
        body: 'Drag across adjacent letters to form words.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="strands-grid"]' },
        gesture: 'Drag across letters',
      },
      {
        title: 'Rules',
        body: 'Find the spangram that touches two sides. Each letter is used once per word.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="strands-grid"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Complete all theme words to win. Hints help when you are stuck.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="strands-hint"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  crossword: {
    id: 'crossword',
    title: 'How to Play Crossword',
    steps: [
      {
        title: 'Goal',
        body: 'Fill the grid by solving clues across and down.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="crossword-grid"]' },
      },
      {
        title: 'Controls',
        body: 'Click a cell to type. Tap a clue to jump to its word.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="crossword-clues"]' },
        gesture: 'Tap or type',
      },
      {
        title: 'Rules',
        body: 'Complete all words to solve the puzzle. The timer tracks your time.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="crossword-timer"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Faster solves improve your stats and streaks.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Earn badges for wins and share your results.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  trivia: {
    id: 'trivia',
    title: 'How to Play Trivia',
    steps: [
      {
        title: 'Goal',
        body: 'Answer 10 questions correctly.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="trivia-question"]' },
      },
      {
        title: 'Controls',
        body: 'Tap one answer choice per question.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="trivia-options"]' },
        gesture: 'Tap to answer',
      },
      {
        title: 'Rules',
        body: 'Answers lock in once selected. Your total time is tracked.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="trivia-timer"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Score is based on correct answers.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="trivia-score"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  numbers: {
    id: 'numbers',
    title: 'How to Play Numbers',
    steps: [
      {
        title: 'Goal',
        body: 'Use the numbers and operations to reach the target.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="numbers-target"]' },
      },
      {
        title: 'Controls',
        body: 'Select two numbers, then choose an operator to combine them.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="numbers-choices"]' },
        gesture: 'Tap numbers',
      },
      {
        title: 'Rules',
        body: 'Each number can be used once. You can stop when one number remains.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="numbers-operators"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Exact hits are wins. Close results still count toward stats.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  waffle: {
    id: 'waffle',
    title: 'How to Play Waffle',
    steps: [
      {
        title: 'Goal',
        body: 'Swap letters to solve every word in the grid.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="waffle-grid"]' },
      },
      {
        title: 'Controls',
        body: 'Tap two letters to swap them.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="waffle-grid"]' },
        gesture: 'Tap to swap',
      },
      {
        title: 'Rules',
        body: 'You have a limited number of moves. Colors show correctness.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="waffle-moves"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Fewer moves is better. Perfect solves earn bonuses.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  combinations: {
    id: 'combinations',
    title: 'How to Play Combinations',
    steps: [
      {
        title: 'Goal',
        body: 'Combine letter fragments to form valid words.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="combinations-fragments"]' },
      },
      {
        title: 'Controls',
        body: 'Select fragments, then submit the word you built.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="combinations-actions"]' },
        gesture: 'Tap to select',
      },
      {
        title: 'Rules',
        body: 'Longer words score more. Bonus words give extra points.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="combinations-score"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Reach the target score to win.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="stats-button"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
  spelling: {
    id: 'spelling',
    title: 'How to Play Spelling Bee',
    steps: [
      {
        title: 'Goal',
        body: 'Make as many words as you can using the given letters.',
        illustration: 'G',
        highlight: { selector: '[data-tutorial="spelling-grid"]' },
      },
      {
        title: 'Controls',
        body: 'Tap letters or type to build words, then press Enter.',
        illustration: 'C',
        highlight: { selector: '[data-tutorial="spelling-actions"]' },
        gesture: 'Tap or type',
      },
      {
        title: 'Rules',
        body: 'Use the center letter in every word. Words are at least 4 letters.',
        illustration: 'R',
        highlight: { selector: '[data-tutorial="spelling-grid"]' },
      },
      {
        title: 'Scoring and Wins',
        body: 'Longer words score more. Pangrams earn bonuses.',
        illustration: 'S',
        highlight: { selector: '[data-tutorial="spelling-score"]' },
      },
      {
        title: 'Rewards',
        body: 'Badges and leaderboards track your performance.',
        illustration: 'B',
        highlight: { selector: '[data-tutorial="badges-button"]' },
      },
    ],
  },
};
