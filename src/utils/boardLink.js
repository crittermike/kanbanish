/**
 * Extracts a board ID from user input that may be a full board URL or a bare ID.
 *
 * Accepts:
 *   - A full URL containing a `?board=<id>` query param
 *   - A protocol-less URL like `www.kanbanish.com/?board=<id>`
 *   - A bare board ID (no whitespace, not a URL)
 *
 * @param {string} input - The pasted URL or ID
 * @returns {string|null} The extracted board ID, or null if none could be found
 */
export function extractBoardId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const boardIdFromUrl = (candidate) => {
    try {
      const boardParam = new URL(candidate).searchParams.get('board');
      return boardParam ? boardParam.trim() : null;
    } catch {
      return null;
    }
  };

  // Try to parse as a URL and read the ?board= param — first as-is, then with
  // an assumed https:// prefix for protocol-less pastes.
  const direct = boardIdFromUrl(trimmed);
  if (direct) return direct;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    const prefixed = boardIdFromUrl(`https://${trimmed}`);
    if (prefixed) return prefixed;
  }

  // A bare ID can't contain whitespace, slashes, or query characters.
  if (/[\s/?#]/.test(trimmed)) return null;

  return trimmed;
}
