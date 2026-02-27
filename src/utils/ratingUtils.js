/**
 * Maps a numeric average (1-5) to a discrete rating level (1-5).
 * Used to select the appropriate CSS color class for score displays.
 *
 * @param {number} average - The average score (1.0 to 5.0)
 * @returns {number} The rating level (1-5)
 */
export function getScoreRatingLevel(average) {
  if (average >= 4.5) return 5;
  if (average >= 3.5) return 4;
  if (average >= 2.5) return 3;
  if (average >= 1.5) return 2;
  return 1;
}

/**
 * Maps a numeric average to a human-readable label.
 *
 * @param {number} average - The average score (1.0 to 5.0)
 * @returns {string} The label (e.g., "Great", "Good", "Okay", "Poor", "Terrible")
 */
export function getScoreLabel(average) {
  if (average >= 4.5) return 'Great';
  if (average >= 3.5) return 'Good';
  if (average >= 2.5) return 'Okay';
  if (average >= 1.5) return 'Poor';
  return 'Terrible';
}

/**
 * Maps a numeric average to a poll effectiveness label.
 *
 * @param {number} average - The average score (1.0 to 5.0)
 * @returns {string} The effectiveness label
 */
export function getEffectivenessLabel(average) {
  if (average >= 4.5) return 'Extremely Effective';
  if (average >= 3.5) return 'Very Effective';
  if (average >= 2.5) return 'Moderately Effective';
  if (average >= 1.5) return 'Slightly Effective';
  return 'Not Effective';
}
