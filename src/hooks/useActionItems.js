import { ref, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';
import { withRetry } from '../utils/firebaseRetry';
import { generateId } from '../utils/ids';

/**
 * Hook for action items operations.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @returns {Object} Action items operations
 */
export const useActionItems = ({ boardId, user }) => {
  const createActionItem = useCallback(
    ({ description, sourceCardId, sourceColumnId }) => {
      if (!boardId || !user) return;

      const newId = generateId();
      const itemRef = ref(database, `boards/${boardId}/actionItems/${newId}`);

      return withRetry(() =>
        set(itemRef, {
          description,
          assignee: '',
          dueDate: null,
          status: 'open',
          sourceCardId,
          sourceColumnId,
          createdBy: user.uid,
          created: Date.now()
        })
      );
    },
    [boardId, user]
  );

  const updateActionItemStatus = useCallback(
    (itemId, status) => {
      if (!boardId || !user) return;
      const statusRef = ref(database, `boards/${boardId}/actionItems/${itemId}/status`);
      return withRetry(() => set(statusRef, status));
    },
    [boardId, user]
  );

  const updateActionItemAssignee = useCallback(
    (itemId, assignee) => {
      if (!boardId || !user) return;
      const assigneeRef = ref(database, `boards/${boardId}/actionItems/${itemId}/assignee`);
      return withRetry(() => set(assigneeRef, assignee));
    },
    [boardId, user]
  );

  const updateActionItemDueDate = useCallback(
    (itemId, dueDate) => {
      if (!boardId || !user) return;
      const dueDateRef = ref(database, `boards/${boardId}/actionItems/${itemId}/dueDate`);
      return withRetry(() => set(dueDateRef, dueDate));
    },
    [boardId, user]
  );

  const updateActionItemDescription = useCallback(
    (itemId, description) => {
      if (!boardId || !user) return;
      const descRef = ref(database, `boards/${boardId}/actionItems/${itemId}/description`);
      return withRetry(() => set(descRef, description));
    },
    [boardId, user]
  );

  const deleteActionItem = useCallback(
    (itemId) => {
      if (!boardId || !user) return;
      const itemRef = ref(database, `boards/${boardId}/actionItems/${itemId}`);
      return withRetry(() => remove(itemRef));
    },
    [boardId, user]
  );

  return {
    createActionItem,
    updateActionItemStatus,
    updateActionItemAssignee,
    updateActionItemDueDate,
    updateActionItemDescription,
    deleteActionItem
  };
};
