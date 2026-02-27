/**
 * ID generation utilities.
 */

/**
 * Generates a random ID string.
 * @returns {string} A random alphanumeric ID (approximately 26 characters)
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
