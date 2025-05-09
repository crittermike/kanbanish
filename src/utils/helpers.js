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
 * Common emoji set for reactions
 */
export const COMMON_EMOJIS = [
  // Faces & expressions
  '😄', '😍', '🤩', '😎', '🤔', '😂', '😭', '😅', '😬', '😲', '😱', '💀', 

  // Hands & gestures
  '👍', '👎', '👏', '🙌', '💪', '🤝', '🙏', '🫡',

  // Hearts
  '❤️', '💔', '💯',

  // Symbols & icons
  '✅', '❗', '⚠️', '❓', '✨', '⭐', '🏆', '💡', '⚡',

  // Eyes / observation
  '👀',

  // Brainy / thoughtful
  '🧠',

  // Fun / celebration
  '🎉', '🚀', '🌈', '🐳',

  // Food & drink
  '🍺', '🍔'
];
