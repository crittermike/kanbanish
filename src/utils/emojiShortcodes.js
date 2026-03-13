/**
 * Emoji shortcode utilities for autocomplete.
 *
 * Builds a searchable shortcode index from the existing emoji keyword
 * data in emoji.js so users can type `:heart:`, `:fire:`, etc.
 */

import { COMMON_EMOJIS, getEmojiKeywords } from './emoji';

/**
 * Build a shortcode → emoji map from keyword data.
 *
 * For each emoji in COMMON_EMOJIS we derive a primary shortcode from
 * its first keyword (or joined keywords) and also index every keyword
 * individually so partial typing matches broadly.
 *
 * @returns {Map<string, string>} shortcode → emoji
 */
function buildShortcodeMap() {
  const map = new Map();

  for (const emoji of COMMON_EMOJIS) {
    const kws = getEmojiKeywords(emoji).filter(
      k => k !== emoji && k.length > 1
    );
    if (kws.length === 0) continue;

    // Primary shortcode: join the first two meaningful keywords with _
    const primary = kws.slice(0, 2).join('_');
    if (!map.has(primary)) {
      map.set(primary, emoji);
    }

    // Also register every individual keyword
    for (const kw of kws) {
      const key = kw.replace(/\s+/g, '_');
      if (!map.has(key)) {
        map.set(key, emoji);
      }
    }
  }

  return map;
}

/** Lazily-initialised shortcode map. */
let _shortcodeMap = null;
function getShortcodeMap() {
  if (!_shortcodeMap) {
    _shortcodeMap = buildShortcodeMap();
  }
  return _shortcodeMap;
}

/** Lazily-initialised sorted entries array. */
let _sortedEntries = null;
function getSortedEntries() {
  if (!_sortedEntries) {
    _sortedEntries = Array.from(getShortcodeMap().entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }
  return _sortedEntries;
}

/**
 * Search emoji shortcodes matching a query string.
 *
 * @param {string} query  Text the user typed after `:` (without the colon)
 * @param {number} [limit=8] Maximum number of results
 * @returns {Array<{shortcode: string, emoji: string}>} Matching entries
 */
export function searchEmojiShortcodes(query, limit = 8) {
  if (!query) return [];

  const lower = query.toLowerCase();
  const entries = getSortedEntries();
  const results = [];
  const seenEmojis = new Set();

  // First pass: collect matches, deduplicating by emoji character
  for (const [shortcode, emoji] of entries) {
    if (shortcode.includes(lower) && !seenEmojis.has(emoji)) {
      seenEmojis.add(emoji);
      results.push({ shortcode, emoji });
      if (results.length >= limit) break;
    }
  }

  // Sort: prefer "starts with" matches, then alphabetical
  results.sort((a, b) => {
    const aPrefix = a.shortcode.startsWith(lower) ? 0 : 1;
    const bPrefix = b.shortcode.startsWith(lower) ? 0 : 1;
    return aPrefix - bPrefix || a.shortcode.localeCompare(b.shortcode);
  });

  return results;
}
