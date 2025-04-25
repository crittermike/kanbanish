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
