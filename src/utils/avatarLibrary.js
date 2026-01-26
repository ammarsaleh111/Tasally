/**
 * Avatar Library - 3D Avatar System
 * Collection of 50+ pre-made stylized avatars for player identity
 * 
 * Each avatar has:
 * - id: unique identifier
 * - name: display name
 * - emoji: fallback emoji representation
 * - category: grouping (characters, animals, robots, mascots, abstract)
 * - gradient: CSS gradient for the avatar background
 * - accentColor: primary color for highlights
 * - animation: idle animation style
 */

export const AVATAR_CATEGORIES = {
  characters: 'Characters',
  animals: 'Animals',
  robots: 'Robots',
  mascots: 'Mascots',
  abstract: 'Abstract',
  puzzle: 'Puzzle Creatures',
};

export const AVATARS = [
  // Characters (11)
  {
    id: 'char-explorer',
    name: 'Explorer',
    emoji: '🧑‍🚀',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#667eea',
    animation: 'float',
  },
  {
    id: 'char-wizard',
    name: 'Wizard',
    emoji: '🧙',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    accentColor: '#6B73FF',
    animation: 'sparkle',
  },
  {
    id: 'char-ninja',
    name: 'Ninja',
    emoji: '🥷',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    accentColor: '#414345',
    animation: 'sway',
  },
  {
    id: 'char-artist',
    name: 'Artist',
    emoji: '🧑‍🎨',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    accentColor: '#ff6b6b',
    animation: 'pulse',
  },
  {
    id: 'char-scientist',
    name: 'Scientist',
    emoji: '🧑‍🔬',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    accentColor: '#38ef7d',
    animation: 'float',
  },
  {
    id: 'char-chef',
    name: 'Chef',
    emoji: '🧑‍🍳',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    accentColor: '#ff9a9e',
    animation: 'bounce',
  },
  {
    id: 'char-pirate',
    name: 'Pirate',
    emoji: '🏴‍☠️',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    accentColor: '#2a5298',
    animation: 'sway',
  },
  {
    id: 'char-detective',
    name: 'Detective',
    emoji: '🕵️',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
    accentColor: '#8e9eab',
    animation: 'pulse',
  },
  {
    id: 'char-musician',
    name: 'Musician',
    emoji: '🎸',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    accentColor: '#ff0844',
    animation: 'bounce',
  },
  {
    id: 'char-athlete',
    name: 'Athlete',
    emoji: '⚽',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    accentColor: '#56ab2f',
    animation: 'float',
  },
  {
    id: 'char-superhero',
    name: 'Superhero',
    emoji: '🦸',
    category: 'characters',
    gradient: 'linear-gradient(135deg, #dd1818 0%, #333333 100%)',
    accentColor: '#dd1818',
    animation: 'sparkle',
  },

  // Animals (14)
  {
    id: 'animal-fox',
    name: 'Clever Fox',
    emoji: '🦊',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
    accentColor: '#f5af19',
    animation: 'sway',
  },
  {
    id: 'animal-owl',
    name: 'Wise Owl',
    emoji: '🦉',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #8B5A2B 0%, #D2691E 100%)',
    accentColor: '#D2691E',
    animation: 'blink',
  },
  {
    id: 'animal-panda',
    name: 'Chill Panda',
    emoji: '🐼',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%)',
    accentColor: '#bdc3c7',
    animation: 'bounce',
  },
  {
    id: 'animal-cat',
    name: 'Curious Cat',
    emoji: '🐱',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accentColor: '#fcb69f',
    animation: 'float',
  },
  {
    id: 'animal-dragon',
    name: 'Mini Dragon',
    emoji: '🐉',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #c31432 0%, #240b36 100%)',
    accentColor: '#c31432',
    animation: 'sparkle',
  },
  {
    id: 'animal-unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    accentColor: '#fbc2eb',
    animation: 'sparkle',
  },
  {
    id: 'animal-penguin',
    name: 'Cool Penguin',
    emoji: '🐧',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #005aa7 0%, #fffde4 100%)',
    accentColor: '#005aa7',
    animation: 'bounce',
  },
  {
    id: 'animal-koala',
    name: 'Sleepy Koala',
    emoji: '🐨',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #9795f0 0%, #fbc8d4 100%)',
    accentColor: '#9795f0',
    animation: 'sway',
  },
  {
    id: 'animal-lion',
    name: 'Brave Lion',
    emoji: '🦁',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    accentColor: '#fdbb2d',
    animation: 'pulse',
  },
  {
    id: 'animal-turtle',
    name: 'Wise Turtle',
    emoji: '🐢',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    accentColor: '#71b280',
    animation: 'float',
  },
  {
    id: 'animal-butterfly',
    name: 'Flutter Butterfly',
    emoji: '🦋',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    accentColor: '#fa709a',
    animation: 'sparkle',
  },
  {
    id: 'animal-octopus',
    name: 'Smart Octopus',
    emoji: '🐙',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#667eea',
    animation: 'sway',
  },
  {
    id: 'animal-eagle',
    name: 'Soaring Eagle',
    emoji: '🦅',
    category: 'animals',
    gradient: 'linear-gradient(135deg, #8b5a3c 0%, #f5deb3 100%)',
    accentColor: '#8b5a3c',
    animation: 'float',
  },

  // Robots (8)
  {
    id: 'robot-classic',
    name: 'Classic Bot',
    emoji: '🤖',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    accentColor: '#4facfe',
    animation: 'pulse',
  },
  {
    id: 'robot-retro',
    name: 'Retro Bot',
    emoji: '🔩',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#764ba2',
    animation: 'blink',
  },
  {
    id: 'robot-cute',
    name: 'Cute Bot',
    emoji: '💜',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    accentColor: '#ff7eb3',
    animation: 'bounce',
  },
  {
    id: 'robot-cyber',
    name: 'Cyber Bot',
    emoji: '⚡',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
    accentColor: '#00c6fb',
    animation: 'sparkle',
  },
  {
    id: 'robot-steampunk',
    name: 'Steam Bot',
    emoji: '⚙️',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
    accentColor: '#D2691E',
    animation: 'sway',
  },
  {
    id: 'robot-neon',
    name: 'Neon Bot',
    emoji: '🌈',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #fa71cd 0%, #c471f5 100%)',
    accentColor: '#fa71cd',
    animation: 'sparkle',
  },
  {
    id: 'robot-pixel',
    name: 'Pixel Bot',
    emoji: '👾',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    accentColor: '#30cfd0',
    animation: 'pulse',
  },
  {
    id: 'robot-future',
    name: 'Future Bot',
    emoji: '🚀',
    category: 'robots',
    gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    accentColor: '#5ee7df',
    animation: 'float',
  },

  // Mascots (8)
  {
    id: 'mascot-star',
    name: 'Star',
    emoji: '⭐',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accentColor: '#f5576c',
    animation: 'sparkle',
  },
  {
    id: 'mascot-ghost',
    name: 'Friendly Ghost',
    emoji: '👻',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #e0e5ec 0%, #a8b5c7 100%)',
    accentColor: '#a8b5c7',
    animation: 'float',
  },
  {
    id: 'mascot-alien',
    name: 'Alien Friend',
    emoji: '👽',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    accentColor: '#a8e063',
    animation: 'blink',
  },
  {
    id: 'mascot-monster',
    name: 'Fuzzy Monster',
    emoji: '👾',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    accentColor: '#8E2DE2',
    animation: 'bounce',
  },
  {
    id: 'mascot-flame',
    name: 'Flame Spirit',
    emoji: '🔥',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #ff512f 0%, #f09819 100%)',
    accentColor: '#f09819',
    animation: 'pulse',
  },
  {
    id: 'mascot-lightning',
    name: 'Lightning Bolt',
    emoji: '⚡',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
    accentColor: '#ffd700',
    animation: 'sparkle',
  },
  {
    id: 'mascot-cloud',
    name: 'Happy Cloud',
    emoji: '☁️',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
    accentColor: '#e0eafc',
    animation: 'float',
  },
  {
    id: 'mascot-rainbow',
    name: 'Rainbow',
    emoji: '🌈',
    category: 'mascots',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 50%, #56ab2f 100%)',
    accentColor: '#ff0844',
    animation: 'sparkle',
  },

  // Abstract (7)
  {
    id: 'abstract-orb',
    name: 'Crystal Orb',
    emoji: '🔮',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #9D50BB 0%, #6E48AA 100%)',
    accentColor: '#9D50BB',
    animation: 'float',
  },
  {
    id: 'abstract-diamond',
    name: 'Diamond',
    emoji: '💎',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    accentColor: '#89f7fe',
    animation: 'sparkle',
  },
  {
    id: 'abstract-moon',
    name: 'Moon',
    emoji: '🌙',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    accentColor: '#3498db',
    animation: 'sway',
  },
  {
    id: 'abstract-sun',
    name: 'Sun',
    emoji: '☀️',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%)',
    accentColor: '#f7b733',
    animation: 'pulse',
  },
  {
    id: 'abstract-galaxy',
    name: 'Galaxy',
    emoji: '🌌',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    accentColor: '#004e92',
    animation: 'sparkle',
  },
  {
    id: 'abstract-aurora',
    name: 'Aurora',
    emoji: '🌠',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #00d2ff 0%, #928dab 100%)',
    accentColor: '#00d2ff',
    animation: 'float',
  },
  {
    id: 'abstract-prism',
    name: 'Prism',
    emoji: '💠',
    category: 'abstract',
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
    accentColor: '#ff6a00',
    animation: 'pulse',
  },

  // Puzzle Creatures (7)
  {
    id: 'puzzle-word',
    name: 'Word Wizard',
    emoji: '📖',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    accentColor: '#2575fc',
    animation: 'float',
  },
  {
    id: 'puzzle-number',
    name: 'Number Ninja',
    emoji: '🔢',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    accentColor: '#38ef7d',
    animation: 'pulse',
  },
  {
    id: 'puzzle-brain',
    name: 'Brain Master',
    emoji: '🧠',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #c44569 100%)',
    accentColor: '#ff6b6b',
    animation: 'sparkle',
  },
  {
    id: 'puzzle-bee',
    name: 'Spelling Bee',
    emoji: '🐝',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
    accentColor: '#f5af19',
    animation: 'bounce',
  },
  {
    id: 'puzzle-crossword',
    name: 'Crossword Champ',
    emoji: '📰',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #403b4a 0%, #e7e9bb 100%)',
    accentColor: '#403b4a',
    animation: 'sway',
  },
  {
    id: 'puzzle-connections',
    name: 'Connection Keeper',
    emoji: '🔗',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #dd5e89 0%, #f7bb97 100%)',
    accentColor: '#dd5e89',
    animation: 'pulse',
  },
  {
    id: 'puzzle-trivia',
    name: 'Trivia Titan',
    emoji: '💡',
    category: 'puzzle',
    gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    accentColor: '#ffd89b',
    animation: 'sparkle',
  },
];

// Default avatar for new users
export const DEFAULT_AVATAR_ID = 'char-explorer';

/**
 * Get avatar by ID
 */
export function getAvatarById(avatarId) {
  return AVATARS.find(a => a.id === avatarId) || AVATARS.find(a => a.id === DEFAULT_AVATAR_ID);
}

/**
 * Get avatars by category
 */
export function getAvatarsByCategory(category) {
  if (category === 'all') return AVATARS;
  return AVATARS.filter(a => a.category === category);
}

/**
 * Get all avatar categories
 */
export function getAllCategories() {
  return Object.entries(AVATAR_CATEGORIES).map(([key, label]) => ({
    key,
    label,
    count: AVATARS.filter(a => a.category === key).length,
  }));
}

/**
 * Validate avatar ID exists
 */
export function isValidAvatarId(avatarId) {
  return AVATARS.some(a => a.id === avatarId);
}
