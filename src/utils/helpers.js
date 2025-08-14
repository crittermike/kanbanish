/**
 * Helper functions for the Kanban application
 */

/**
 * Generates a random ID string
 * @returns {string} A random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Shows a notification message
 * @param {string} message The message to show
 */
export function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');

  if (notification && notificationMessage) {
    notificationMessage.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

/**
 * Generates a comprehensive but curated list of emojis from Unicode ranges
 * @returns {string[]} Array of emoji characters
 */
function generateEmojiList() {
  const emojis = [];
  
  // Helper function to check if a character renders as an emoji
  const isLikelyValidEmoji = (codePoint) => {
    // Skip certain ranges that are less likely to be standard emojis
    // or might not render properly across all systems
    const skipRanges = [
      [0x1F1E6, 0x1F1FF], // Regional indicators (flags) - often need combinations
      [0x1F3FB, 0x1F3FF], // Skin tone modifiers
      [0x1F9B0, 0x1F9B3], // Some newer emojis that may not be widely supported
    ];
    
    return !skipRanges.some(([start, end]) => codePoint >= start && codePoint <= end);
  };

  // Emoticons range (U+1F600–U+1F64F) - faces and people
  for (let i = 0x1F600; i <= 0x1F64F; i++) {
    if (isLikelyValidEmoji(i)) {
      emojis.push(String.fromCodePoint(i));
    }
  }

  // Miscellaneous Symbols and Pictographs (U+1F300–U+1F5FF) - weather, objects, etc.
  for (let i = 0x1F300; i <= 0x1F5FF; i++) {
    if (isLikelyValidEmoji(i)) {
      emojis.push(String.fromCodePoint(i));
    }
  }

  // Transport and Map Symbols (U+1F680–U+1F6FF) - vehicles, signs, etc.
  for (let i = 0x1F680; i <= 0x1F6FF; i++) {
    if (isLikelyValidEmoji(i)) {
      emojis.push(String.fromCodePoint(i));
    }
  }

  // Supplemental Symbols and Pictographs (U+1F900–U+1F9FF) - newer emojis
  for (let i = 0x1F900; i <= 0x1F9EF; i++) { // Limited range for compatibility
    if (isLikelyValidEmoji(i)) {
      emojis.push(String.fromCodePoint(i));
    }
  }

  // Select common symbols from Miscellaneous Symbols (U+2600–U+26FF)
  const commonSymbols = [
    0x2600, 0x2601, 0x2602, 0x2603, 0x2604, 0x2605, // weather and stars
    0x2614, 0x2615, 0x2618, 0x261D, 0x2620, 0x2622, 0x2623, // common symbols
    0x2626, 0x262A, 0x262E, 0x262F, 0x2638, 0x2639, 0x263A, // religious/faces
    0x2640, 0x2642, 0x2648, 0x2649, 0x264A, 0x264B, 0x264C, 0x264D, 0x264E, 0x264F, // zodiac
    0x2650, 0x2651, 0x2652, 0x2653, 0x2660, 0x2663, 0x2665, 0x2666, // zodiac and cards
    0x2668, 0x267B, 0x267E, 0x267F, 0x2692, 0x2693, 0x2694, 0x2695, 0x2696, 0x2697, // misc
    0x2699, 0x269B, 0x269C, 0x26A0, 0x26A1, 0x26AA, 0x26AB, 0x26B0, 0x26B1, // warning etc
    0x26BD, 0x26BE, 0x26C4, 0x26C5, 0x26C8, 0x26CE, 0x26CF, 0x26D1, 0x26D3, 0x26D4, // sports/weather
    0x26E9, 0x26EA, 0x26F0, 0x26F1, 0x26F2, 0x26F3, 0x26F4, 0x26F5, 0x26F7, 0x26F8, 0x26F9, 0x26FA, // buildings/activities
    0x26FD // fuel pump
  ];
  
  commonSymbols.forEach(codePoint => {
    emojis.push(String.fromCodePoint(codePoint));
  });

  // Add some popular standalone emojis and combinations that are commonly used
  const additionalEmojis = [
    '❤️', '💔', '💯', '💪', '🙏', '👍', '👎', '👏', '🙌', '🤝',
    '👀', '🧠', '💡', '⚡', '✨', '⭐', '🏆', '🎉', '🚀', '🌈',
    '✅', '❌', '❗', '❓', '⚠️', '🔥', '💰', '💎', '🎯', '🎪'
  ];

  additionalEmojis.forEach(emoji => {
    if (!emojis.includes(emoji)) {
      emojis.push(emoji);
    }
  });

  return emojis;
}

/**
 * Common emoji set for reactions - now generated from Unicode ranges
 */
export const COMMON_EMOJIS = generateEmojiList();

/**
 * Parse a boolean-like query param value.
 * Accepts: true/false/1/0/yes/no/on/off (case-insensitive)
 */
export function parseBool(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return undefined;
}

/**
 * Extracts supported settings from a query string for initial board creation and UI prefs.
 * Returns an object with boardSettings (persisted on new board) and uiPrefs (non-persisted).
 *
 * Supported query params:
 * - voting: boolean (enable voting)
 * - downvotes: boolean (allow downvoting)
 * - multivote: boolean (allow multiple votes per item)
 * - votes: number (votes per user)
 * - retro: boolean (retrospective mode on)
 * - sort: 'votes' | 'chrono' (UI preference)
 * - theme: 'dark' | 'light' (UI preference)
 */
export function parseUrlSettings(queryString) {
  try {
    const search = typeof queryString === 'string' ? queryString : '';
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);

  // Board settings (persisted on new board creation only)
  const boardSettings = {};

    const voting = parseBool(params.get('voting'));
    if (voting !== undefined) boardSettings.votingEnabled = voting;

    const downvotes = parseBool(params.get('downvotes'));
    if (downvotes !== undefined) boardSettings.downvotingEnabled = downvotes;

    const multivote = parseBool(params.get('multivote'));
    if (multivote !== undefined) boardSettings.multipleVotesAllowed = multivote;

    const votes = params.get('votes');
    if (votes != null && votes !== '') {
      const n = parseInt(votes, 10);
      if (!Number.isNaN(n) && n > 0 && n < 1000) boardSettings.votesPerUser = n;
    }

    const retro = parseBool(params.get('retro'));
    if (retro !== undefined) boardSettings.retrospectiveMode = retro;

    const sort = params.get('sort');
    if (typeof sort === 'string') {
      const s = sort.trim().toLowerCase();
      if (s === 'votes') boardSettings.sortByVotes = true;
      if (s === 'chrono' || s === 'chronological' || s === 'time') boardSettings.sortByVotes = false;
    }

    // UI-only preferences (not persisted as board settings)
    const uiPrefs = {};

    const theme = params.get('theme');
    if (typeof theme === 'string') {
      const t = theme.trim().toLowerCase();
      if (t === 'dark') uiPrefs.darkMode = true;
      if (t === 'light') uiPrefs.darkMode = false;
    }

  return { boardSettings, uiPrefs };
  } catch {
    return { boardSettings: {}, uiPrefs: {} };
  }
}
