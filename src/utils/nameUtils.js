const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

export function isArabicName(name) {
  if (typeof name !== 'string') return false;
  return ARABIC_CHAR_REGEX.test(name);
}

export function getNameDirection(name) {
  return isArabicName(name) ? 'rtl' : 'ltr';
}

export function getDisplayInitial(name) {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return Array.from(trimmed)[0] || '';
}
