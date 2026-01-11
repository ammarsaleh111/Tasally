import COMMON_WORDS from '@/data/dictionary/common-english-words.json';

let localDictionarySet = null;

function ensureDictionarySet() {
  if (!localDictionarySet) {
    // Use lowercase words for normalization
    localDictionarySet = new Set(COMMON_WORDS.map(word => word.toLowerCase()));
  }
  return localDictionarySet;
}

export function isWordInLocalDictionary(word) {
  if (!word) return false;
  return ensureDictionarySet().has(word.toLowerCase());
}

export function addWordToLocalDictionary(word) {
  if (!word) return;
  ensureDictionarySet().add(word.toLowerCase());
}

export function getLocalDictionarySize() {
  return ensureDictionarySet().size;
}
