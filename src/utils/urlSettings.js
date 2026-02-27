/**
 * URL query-string parsing utilities for board settings and UI preferences.
 */

/**
 * Parse a boolean-like query param value.
 * Accepts: true/false/1/0/yes/no/on/off (case-insensitive)
 * @param {string} value - The string value to parse
 * @returns {boolean|undefined} The parsed boolean, or undefined if unrecognized
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
 *
 * @param {string} queryString - The URL query string to parse
 * @returns {{ boardSettings: object, uiPrefs: object }}
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
