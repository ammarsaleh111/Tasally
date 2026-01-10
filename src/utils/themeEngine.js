/**
 * Theme Engine for Ammar Times
 * Manages seasonal, weekly, and event-based themes across all games
 */

// Theme definitions
export const THEMES = {
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    startDate: '2026-10-25',
    endDate: '2026-10-31',
    colors: {
      primary: '#ff6b35',
      secondary: '#8b5cf6',
      accent: '#f97316',
      background: '#1a0f1f',
    },
    emoji: '🎃',
    banner: {
      text: '🎃 Halloween Special 🎃',
      backgroundColor: '#ff6b35',
      textColor: '#000000'
    },
    games: {
      wordle: {
        wordList: 'halloween', // Reference to themed word list
        description: 'Spooky words only!'
      },
      trivia: {
        questionSet: 'halloween',
        description: 'Horror & Halloween trivia'
      },
      connections: {
        puzzleSet: 'halloween',
        description: 'Scary connections'
      }
    }
  },
  
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    startDate: '2026-12-20',
    endDate: '2026-12-26',
    colors: {
      primary: '#dc2626',
      secondary: '#059669',
      accent: '#fbbf24',
      background: '#0f1419',
    },
    emoji: '🎄',
    banner: {
      text: '🎄 Merry Christmas! 🎅',
      backgroundColor: '#dc2626',
      textColor: '#ffffff'
    },
    games: {
      wordle: {
        wordList: 'christmas',
        description: 'Holiday words!'
      },
      trivia: {
        questionSet: 'christmas',
        description: 'Christmas trivia'
      },
      connections: {
        puzzleSet: 'christmas',
        description: 'Holiday connections'
      }
    }
  },

  sports: {
    id: 'sports',
    name: 'Sports Week',
    startDate: '2026-02-01',
    endDate: '2026-02-07',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#0f1419',
    },
    emoji: '⚽',
    banner: {
      text: '⚽ Sports Week - Test Your Athletic Knowledge! 🏀',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff'
    },
    games: {
      wordle: {
        wordList: 'sports',
        description: 'Sports terms!'
      },
      trivia: {
        questionSet: 'sports',
        description: 'All about sports!'
      },
      numbers: {
        description: 'Calculate sports stats!'
      }
    }
  },

  ramadan: {
    id: 'ramadan',
    name: 'Ramadan',
    startDate: '2026-02-17',
    endDate: '2026-03-18',
    colors: {
      primary: '#8b5cf6',
      secondary: '#fbbf24',
      accent: '#06b6d4',
      background: '#0f1419',
    },
    emoji: '🌙',
    banner: {
      text: '🌙 Ramadan Kareem ✨',
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff'
    },
    games: {
      wordle: {
        wordList: 'ramadan',
        description: 'Islamic terms'
      },
      trivia: {
        questionSet: 'ramadan',
        description: 'Islamic knowledge'
      }
    }
  },

  worldcup: {
    id: 'worldcup',
    name: 'World Cup',
    startDate: '2026-06-01',
    endDate: '2026-07-15',
    colors: {
      primary: '#fbbf24',
      secondary: '#3b82f6',
      accent: '#dc2626',
      background: '#0f1419',
    },
    emoji: '🏆',
    banner: {
      text: '🏆 World Cup 2026! ⚽',
      backgroundColor: '#fbbf24',
      textColor: '#000000'
    },
    games: {
      wordle: {
        wordList: 'worldcup',
        description: 'Football terms!'
      },
      trivia: {
        questionSet: 'worldcup',
        description: 'World Cup trivia!'
      },
      connections: {
        puzzleSet: 'worldcup',
        description: 'Football connections'
      }
    }
  },

  music: {
    id: 'music',
    name: 'Music Week',
    startDate: '2026-03-15',
    endDate: '2026-03-21',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f1419',
    },
    emoji: '🎵',
    banner: {
      text: '🎵 Music Week - Feel the Rhythm! 🎶',
      backgroundColor: '#ec4899',
      textColor: '#ffffff'
    },
    games: {
      wordle: {
        wordList: 'music',
        description: 'Musical terms!'
      },
      trivia: {
        questionSet: 'music',
        description: 'Music trivia!'
      }
    }
  },

  oscars: {
    id: 'oscars',
    name: 'Oscar Week',
    startDate: '2026-03-01',
    endDate: '2026-03-08',
    colors: {
      primary: '#fbbf24',
      secondary: '#000000',
      accent: '#dc2626',
      background: '#0f1419',
    },
    emoji: '🎬',
    banner: {
      text: '🎬 Oscar Week - Lights, Camera, Action! 🏆',
      backgroundColor: '#fbbf24',
      textColor: '#000000'
    },
    games: {
      trivia: {
        questionSet: 'oscars',
        description: 'Movie & Oscar trivia!'
      },
      connections: {
        puzzleSet: 'movies',
        description: 'Film connections'
      }
    }
  }
};

/**
 * Get the active theme for today's date
 * @returns {object|null} Active theme or null
 */
export const getActiveTheme = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  for (const theme of Object.values(THEMES)) {
    if (todayStr >= theme.startDate && todayStr <= theme.endDate) {
      return theme;
    }
  }
  
  return null;
};

/**
 * Check if a specific theme is active
 * @param {string} themeId
 * @returns {boolean}
 */
export const isThemeActive = (themeId) => {
  const activeTheme = getActiveTheme();
  return activeTheme?.id === themeId;
};

/**
 * Get theme configuration for a specific game
 * @param {string} gameId - 'wordle', 'trivia', 'connections', etc.
 * @returns {object|null}
 */
export const getGameTheme = (gameId) => {
  const activeTheme = getActiveTheme();
  if (!activeTheme) return null;
  
  return activeTheme.games[gameId] || null;
};

/**
 * Get all upcoming themes
 * @returns {array}
 */
export const getUpcomingThemes = () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return Object.values(THEMES)
    .filter(theme => theme.startDate > todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
};

/**
 * Apply theme colors to CSS variables
 * @param {object} theme
 */
export const applyThemeColors = (theme) => {
  if (!theme || typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
  }
};

/**
 * Reset theme colors
 */
export const resetThemeColors = () => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  ['primary', 'secondary', 'accent', 'background'].forEach(key => {
    root.style.removeProperty(`--theme-${key}`);
  });
};

/**
 * Get theme banner component props
 * @returns {object|null}
 */
export const getThemeBanner = () => {
  const activeTheme = getActiveTheme();
  return activeTheme?.banner || null;
};

/**
 * Check if today is within a themed event
 * @returns {boolean}
 */
export const hasActiveTheme = () => {
  return getActiveTheme() !== null;
};
