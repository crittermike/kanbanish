import { ref, set } from 'firebase/database';
import { database } from './firebase';
import { generateId } from './helpers';

/**
 * Adds a new column to the board
 * 
 * @param {string} boardId - The ID of the board
 * @param {string} title - The title of the column (default: 'New Column')
 * @returns {Promise} - A promise that resolves when the column is added
 */
export function addColumn(boardId, title = 'New Column') {
  if (!boardId) return Promise.reject(new Error('Board ID is required'));

  const columnId = generateId();
  const columnData = {
    title: title,
    cards: {}
  };

  // Create a direct reference to the column path
  const columnRef = ref(database, `boards/${boardId}/columns/${columnId}`);

  // Return the promise for the caller to handle notifications
  return set(columnRef, columnData);
}

/**
 * Adds a new card to a column
 * 
 * @param {string} boardId - The ID of the board
 * @param {string} columnId - The ID of the column
 * @param {string} content - The content of the card
 * @param {object} user - The user object who created the card
 * @returns {Promise} - A promise that resolves when the card is added
 */
export function addCard(boardId, columnId, content, user = null) {
  if (!boardId) return Promise.reject(new Error('Board ID is required'));
  if (!columnId) return Promise.reject(new Error('Column ID is required'));
  if (!content || !content.trim()) return Promise.reject(new Error('Card content is required'));

  const cardId = generateId();
  const cardData = {
    content: content.trim(),
    votes: 0,
    created: Date.now(),
    createdBy: user ? user.uid : null // Add creator information
  };

  // Create a direct reference to the card path
  const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);

  // Return the promise for the caller to handle notifications
  return set(cardRef, cardData);
}