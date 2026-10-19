const LIST_MARKER = /^(?:[-*+•]\s+)?(?:\[[ xX]\]\s+)?(?:\d+[.)]\s+)?/;

/**
 * Splits pasted text into card contents: one per non-empty line,
 * with leading list markers ("- ", "* ", "• ", "1. ", "[ ] ") removed.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function parsePastedCards(text) {
  if (!text) {
    return [];
  }
  return text
    .split(/\r?\n|\r/)
    .map(line => line.trim().replace(LIST_MARKER, '').trim())
    .filter(Boolean);
}
