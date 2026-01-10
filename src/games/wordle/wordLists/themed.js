// Halloween-themed word list for Wordle
export const HALLOWEEN_WORDS = [
  'GHOST', 'WITCH', 'SCARY', 'HAUNT', 'MAGIC',
  'SPELL', 'BLOOD', 'CREEP', 'DEVIL', 'DEMON',
  'SKULL', 'BONES', 'GRAVE', 'CRYPT', 'CURSE',
  'FRIGHT', 'EERIE', 'SPOOK', 'HOWL', 'BEAST',
  'DARK', 'NIGHT', 'MOON', 'BLACK', 'SHADE'
];

// Sports-themed word list
export const SPORTS_WORDS = [
  'SCORE', 'MATCH', 'FIELD', 'COACH', 'GOAL',
  'PITCH', 'SERVE', 'SHOOT', 'GUARD', 'BLOCK',
  'FOUL', 'TACKLE', 'PASS', 'DRIVE', 'SPRINT',
  'TRACK', 'MEDAL', 'CHAMP', 'ARENA', 'COURT',
  'RUGBY', 'BOXER', 'RACER', 'SWIMMER', 'DIVER'
];

// Christmas-themed word list
export const CHRISTMAS_WORDS = [
  'SANTA', 'MERRY', 'JOLLY', 'GIFTS', 'SLEIGH',
  'FROST', 'CAROL', 'BELLS', 'HOLLY', 'PEACE',
  'WREATH', 'ANGELS', 'LIGHT', 'STAR', 'NOEL',
  'CHEER', 'COCOA', 'CANDY', 'FEAST', 'MAGIC'
];

// Music-themed word list
export const MUSIC_WORDS = [
  'NOTES', 'TEMPO', 'CHORD', 'PIANO', 'DRUMS',
  'GUITAR', 'VOICE', 'MELODY', 'BASS', 'BEAT',
  'RHYTHM', 'SOUND', 'LYRIC', 'SONG', 'TUNE',
  'PITCH', 'SCALE', 'SHARP', 'FLAT', 'MAJOR'
];

// World Cup themed word list
export const WORLDCUP_WORDS = [
  'BRAZIL', 'TROPHY', 'FINAL', 'SOCCER', 'KICK',
  'DRIBBLE', 'HEADER', 'CORNER', 'PENALTY', 'GOALIE',
  'SQUAD', 'MATCH', 'GROUP', 'ROUND', 'MEDAL'
];

// Ramadan themed word list
export const RAMADAN_WORDS = [
  'FAITH', 'PEACE', 'PRAY', 'QURAN', 'MOON',
  'FAST', 'BLESS', 'MERCY', 'NIGHT', 'LIGHT',
  'GOOD', 'CHARITY', 'UNITY', 'HOLY', 'MONTH'
];

/**
 * Get themed word list by theme ID
 */
export const getThemedWordList = (themeId) => {
  const lists = {
    halloween: HALLOWEEN_WORDS,
    sports: SPORTS_WORDS,
    christmas: CHRISTMAS_WORDS,
    music: MUSIC_WORDS,
    worldcup: WORLDCUP_WORDS,
    ramadan: RAMADAN_WORDS,
  };
  
  return lists[themeId] || null;
};
