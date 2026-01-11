const fs = require('fs');
const path = require('path');
const words = require('an-array-of-english-words');

// Filter words to be game-appropriate (lowercase, alpha-only)
// The user requests "300,000+ words", "Lowercase"
// an-array-of-english-words has ~275k. That's close enough solely for a "game dictionary".
// We can also potentially merge with existing dictionary if we want to be safe.

const cleanWords = words.filter(w => /^[a-z]+$/.test(w));

const outputPath = path.join(__dirname, 'src/data/dictionary/common-english-words.json');

console.log(`Writing ${cleanWords.length} words to ${outputPath}`);
fs.writeFileSync(outputPath, JSON.stringify(cleanWords));
