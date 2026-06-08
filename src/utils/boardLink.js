/**
 * Extracts a board ID from user input that may be a full board URL or a bare ID.
 *
 * Accepts:
 *   - A full URL containing a `?board=<id>` query param
 *   - A bare board ID (no whitespace, not a URL)
 *
 * @param {string} input - The pasted URL or ID
 * @returns {string|null} The extracted board ID, or null if none could be found
 */
export function extractBoardId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try to parse as a URL and read the ?board= param.
  try {
    const url = new URL(trimmed);
    const boardParam = url.searchParams.get('board');
    if (boardParam) return boardParam.trim();
  } catch {
    // Not a URL — fall through to bare-ID handling.
  }

  // A bare ID can't contain whitespace, slashes, or query characters.
  if (/[\s/?#]/.test(trimmed)) return null;

  return trimmed;
}
