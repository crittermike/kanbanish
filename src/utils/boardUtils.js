import { ref, set } from 'firebase/database';
import { database } from './firebase';
import { generateId } from './ids';
import { parseUrlSettings } from './urlSettings';
import { WORKFLOW_PHASES } from './workflowUtils';

/**
 * Adds a new column to the board
 *
 * @param {string} boardId - The ID of the board
 * @param {string} title - The title of the column (default: 'New Column')
 * @returns {Promise} - A promise that resolves when the column is added
 */
export function addColumn(boardId, title = 'New Column') {
  if (!boardId) {
    return Promise.reject(new Error('Board ID is required'));
  }

  const columnId = generateId();
  const columnData = {
    title,
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
 * @returns {Promise<string>} - A promise that resolves with the new card ID when the card is added
 */
export function addCard(boardId, columnId, content, user = null, displayName = '', userColor = '') {
  if (!boardId) {
    return Promise.reject(new Error('Board ID is required'));
  }
  if (!columnId) {
    return Promise.reject(new Error('Column ID is required'));
  }
  if (!content || !content.trim()) {
    return Promise.reject(new Error('Card content is required'));
  }

  const cardId = generateId();
  const cardData = {
    content: content.trim(),
    votes: 0,
    created: Date.now(),
    createdBy: user ? user.uid : null, // Add creator information
    displayName: displayName || '',
    userColor: userColor || '' // Used for author avatar (not card border)
  };

  // Create a direct reference to the card path
  const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}`);

  // Return the promise for the caller to handle notifications, and include the cardId
  return set(cardRef, cardData).then(() => cardId);
}

/**
 * Creates a new board from a template definition.
 *
 * @param {Object} params
 * @param {string[]} params.columns - Column titles for the new board
 * @param {string} [params.templateName] - Template name (used for board title)
 * @param {Object} params.user - Firebase user object with uid
 * @param {string} [params.queryString] - URL query string for settings overrides
 * @param {Object} [params.settingsOverrides] - Direct settings overrides (e.g. from wizard)
 * @returns {Promise<string>} Resolves with the new board ID
 */
export function createBoardFromTemplate({ columns, templateName = null, user, queryString = '', settingsOverrides = {} }) {
  if (!user || !user.uid) {
    return Promise.reject(new Error('User is required'));
  }

  const boardTitle = templateName ? `${templateName} Board` : 'Untitled Board';
  const parsed = parseUrlSettings(queryString);

  const newBoardId = generateId();
  const newBoardRef = ref(database, `boards/${newBoardId}`);

  const columnsToCreate = columns || ['To Do', 'In Progress', 'Done'];
  const columnsObj = {};
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';

  columnsToCreate.forEach((columnTitle, index) => {
    const prefix = index < 26 ? alphabet[index] : `col${index}`;
    columnsObj[`${prefix}_${generateId()}`] = {
      title: columnTitle,
      cards: {}
    };
  });

  // Only allow a safe subset of settings to be overridden on creation
  const allowedOverrideKeys = ['votingEnabled', 'downvotingEnabled', 'multipleVotesAllowed', 'votesPerUser', 'retrospectiveMode', 'sortByVotes', 'showDisplayNames', 'actionItemsEnabled'];
  const sanitizedOverrides = {};
  if (parsed.boardSettings && typeof parsed.boardSettings === 'object') {
    allowedOverrideKeys.forEach(k => {
      if (parsed.boardSettings[k] !== undefined) {
        sanitizedOverrides[k] = parsed.boardSettings[k];
      }
    });
  }

  // Apply direct overrides (e.g. from the board setup wizard)
  if (settingsOverrides && typeof settingsOverrides === 'object') {
    allowedOverrideKeys.forEach(k => {
      if (settingsOverrides[k] !== undefined) {
        sanitizedOverrides[k] = settingsOverrides[k];
      }
    });
  }

  const initialData = {
    title: boardTitle,
    created: Date.now(),
    owner: user.uid,
    columns: columnsObj,
    settings: {
      votingEnabled: true,
      downvotingEnabled: true,
      multipleVotesAllowed: false,
      sortByVotes: false,
      retrospectiveMode: false,
      workflowPhase: WORKFLOW_PHASES.CREATION,
      resultsViewIndex: 0,
      ...sanitizedOverrides
    }
  };

  return set(newBoardRef, initialData).then(() => newBoardId);
}
