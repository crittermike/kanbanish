import { ref, get, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';
import { withRetry } from '../utils/firebaseRetry';
import { generateId } from '../utils/ids';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

const DEFAULT_BOARD_TITLE = 'Untitled Board';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

// Safety bound when walking a series chain (e.g. for cycle detection), so a
// corrupt chain in the database can never make us loop forever.
const MAX_CHAIN_WALK = 500;

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

    // If the current board already had a successor, detach its back-pointer so
    // it doesn't keep claiming this board as its predecessor.
    const oldNextId = currentData.nextBoardId;
    if (oldNextId) {
      await withRetry(
        () => remove(ref(database, `boards/${oldNextId}/previousBoardId`)),
        { operationName: 'Detach replaced next board' }
      );
    }

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
   * Refuses links that would create a cycle (the current board already appears
   * earlier in the target's chain), and detaches any pointers the new link
   * replaces so no dangling back-references are left behind.
   *
   * @param {string} previousBoardId - The board ID to link as the previous board
   * @returns {Promise<boolean>} True when linked, false on invalid input/missing board/cycle
   */
  const linkToPreviousBoard = useCallback(
    async (previousBoardId) => {
      if (!boardId || !user) return false;
      const trimmed = (previousBoardId || '').trim();
      if (!trimmed || trimmed === boardId) return false;

      // Make sure the target board actually exists before linking.
      const targetSnapshot = await get(ref(database, `boards/${trimmed}`));
      if (!targetSnapshot.exists()) return false;
      const targetData = targetSnapshot.val() || {};

      // Cycle guard: walk the target's predecessor chain — if the current
      // board is already an ancestor, this link would make the series loop.
      let ancestorId = targetData.previousBoardId;
      for (let hops = 0; ancestorId && hops < MAX_CHAIN_WALK; hops++) {
        if (ancestorId === boardId) return false;
        const ancestorSnapshot = await get(
          ref(database, `boards/${ancestorId}/previousBoardId`)
        );
        ancestorId = ancestorSnapshot.val();
      }

      // If this board already had a different predecessor, detach that board's
      // forward pointer so it no longer claims this board as its successor.
      const oldPreviousSnapshot = await get(
        ref(database, `boards/${boardId}/previousBoardId`)
      );
      const oldPreviousId = oldPreviousSnapshot.val();
      if (oldPreviousId && oldPreviousId !== trimmed) {
        await withRetry(
          () => remove(ref(database, `boards/${oldPreviousId}/nextBoardId`)),
          { operationName: 'Detach replaced previous board' }
        );
      }

      // If the target already had a different successor, detach its
      // back-pointer for the same reason.
      const oldTargetNextId = targetData.nextBoardId;
      if (oldTargetNextId && oldTargetNextId !== boardId) {
        await withRetry(
          () => remove(ref(database, `boards/${oldTargetNextId}/previousBoardId`)),
          { operationName: "Detach target's replaced next board" }
        );
      }

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
   * Detach the current board from its series, removing its own pointers. When
   * the board sits in the middle of a chain, its two neighbours are spliced
   * together so the rest of the series stays intact; at either end, the lone
   * neighbour's reciprocal pointer is simply removed.
   *
   * @returns {Promise<void>}
   */
  const unlinkFromSeries = useCallback(async () => {
    if (!boardId || !user) return;

    const currentSnapshot = await get(ref(database, `boards/${boardId}`));
    const currentData = currentSnapshot.val() || {};
    const { previousBoardId, nextBoardId } = currentData;

    if (previousBoardId && nextBoardId) {
      // Middle of the chain: splice the neighbours together.
      await withRetry(
        () => set(ref(database, `boards/${previousBoardId}/nextBoardId`), nextBoardId),
        { operationName: 'Splice previous neighbour forward' }
      );
      await withRetry(
        () => set(ref(database, `boards/${nextBoardId}/previousBoardId`), previousBoardId),
        { operationName: 'Splice next neighbour backward' }
      );
    } else if (previousBoardId) {
      await withRetry(
        () => remove(ref(database, `boards/${previousBoardId}/nextBoardId`)),
        { operationName: 'Unlink previous neighbour' }
      );
    } else if (nextBoardId) {
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
