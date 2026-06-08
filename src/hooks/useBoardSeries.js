import { ref, get, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';
import { withRetry } from '../utils/firebaseRetry';
import { generateId } from '../utils/ids';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

const DEFAULT_BOARD_TITLE = 'Untitled Board';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Build a fresh columns object from an existing board's columns, preserving
 * order and titles but starting with no cards. Used to clone the "shape" of a
 * board when starting the next board in a series.
 *
 * @param {Object} sourceColumns - The source board's columns map
 * @returns {Object} A new columns map (empty cards, re-prefixed keys)
 */
function cloneColumnStructure(sourceColumns) {
  const columnsObj = {};
  const ordered = Object.entries(sourceColumns || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  ordered.forEach(([, column], index) => {
    const prefix = index < 26 ? ALPHABET[index] : `col${index}`;
    const newColumn = { title: column?.title || '', cards: {} };
    if (column?.defaultTimerSeconds) {
      newColumn.defaultTimerSeconds = column.defaultTimerSeconds;
    }
    columnsObj[`${prefix}_${generateId()}`] = newColumn;
  });

  return columnsObj;
}

/**
 * Hook for board series operations — linking boards into an ordered chain so
 * users can page back to previous boards (e.g. to review a prior retro's
 * commitments). Pointers are stored on the board nodes in Firebase so the
 * relationship is shared with everyone, not local to one browser.
 *
 *   boards/{boardId}/previousBoardId
 *   boards/{boardId}/nextBoardId
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @returns {Object} Series operations
 */
export const useBoardSeries = ({ boardId, user }) => {
  /**
   * Create the next board in the series: clones the current board's column
   * structure and settings (with empty cards), links the two boards together,
   * and returns the new board ID so the caller can navigate to it.
   *
   * @returns {Promise<string|null>} The new board ID, or null if unavailable
   */
  const startNextBoard = useCallback(async () => {
    if (!boardId || !user) return null;

    const currentSnapshot = await get(ref(database, `boards/${boardId}`));
    const currentData = currentSnapshot.val() || {};

    const newBoardId = generateId();

    // Clone settings verbatim to keep the same "shape", but reset the
    // transient workflow position so the new board starts fresh.
    const settings = { ...(currentData.settings || {}) };
    settings.workflowPhase = WORKFLOW_PHASES.CREATION;
    settings.resultsViewIndex = 0;

    const initialData = {
      title: currentData.title || DEFAULT_BOARD_TITLE,
      created: Date.now(),
      owner: user.uid,
      columns: cloneColumnStructure(currentData.columns),
      settings,
      previousBoardId: boardId
    };

    await withRetry(() => set(ref(database, `boards/${newBoardId}`), initialData), {
      operationName: 'Create next board in series'
    });

    // Link the current board forward to the new one.
    await withRetry(
      () => set(ref(database, `boards/${boardId}/nextBoardId`), newBoardId),
      { operationName: 'Link board to next' }
    );

    return newBoardId;
  }, [boardId, user]);

  /**
   * Link the current board to a previously-created board as its predecessor.
   * Sets a doubly-linked pointer pair so the pager can page in both directions.
   *
   * @param {string} previousBoardId - The board ID to link as the previous board
   * @returns {Promise<boolean>} True when linked, false on invalid input/missing board
   */
  const linkToPreviousBoard = useCallback(
    async (previousBoardId) => {
      if (!boardId || !user) return false;
      const trimmed = (previousBoardId || '').trim();
      if (!trimmed || trimmed === boardId) return false;

      // Make sure the target board actually exists before linking.
      const targetSnapshot = await get(ref(database, `boards/${trimmed}`));
      if (!targetSnapshot.exists()) return false;

      await withRetry(
        () => set(ref(database, `boards/${boardId}/previousBoardId`), trimmed),
        { operationName: 'Link board to previous' }
      );
      await withRetry(
        () => set(ref(database, `boards/${trimmed}/nextBoardId`), boardId),
        { operationName: 'Link previous board forward' }
      );

      return true;
    },
    [boardId, user]
  );

  /**
   * Detach the current board from its series, removing its own pointers and the
   * reciprocal pointers on its immediate neighbours.
   *
   * @returns {Promise<void>}
   */
  const unlinkFromSeries = useCallback(async () => {
    if (!boardId || !user) return;

    const currentSnapshot = await get(ref(database, `boards/${boardId}`));
    const currentData = currentSnapshot.val() || {};
    const { previousBoardId, nextBoardId } = currentData;

    if (previousBoardId) {
      await withRetry(
        () => remove(ref(database, `boards/${previousBoardId}/nextBoardId`)),
        { operationName: 'Unlink previous neighbour' }
      );
    }
    if (nextBoardId) {
      await withRetry(
        () => remove(ref(database, `boards/${nextBoardId}/previousBoardId`)),
        { operationName: 'Unlink next neighbour' }
      );
    }

    await withRetry(() => remove(ref(database, `boards/${boardId}/previousBoardId`)), {
      operationName: 'Remove own previous pointer'
    });
    await withRetry(() => remove(ref(database, `boards/${boardId}/nextBoardId`)), {
      operationName: 'Remove own next pointer'
    });
  }, [boardId, user]);

  return {
    startNextBoard,
    linkToPreviousBoard,
    unlinkFromSeries
  };
};
