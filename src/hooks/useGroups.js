import { ref, set, remove } from 'firebase/database';
import { useCallback } from 'react';
import { database } from '../utils/firebase';
import { generateId } from '../utils/ids';

/**
 * Hook for card grouping operations.
 *
 * Handles creating groups, ungrouping cards, moving cards between
 * columns/groups, updating group names, and toggling group expansion.
 *
 * @param {Object} params
 * @param {string|null} params.boardId - Current board ID
 * @param {Object|null} params.user - Current Firebase user
 * @param {Object} params.columns - Board columns data
 * @returns {Object} Group operations
 */
export const useGroups = ({ boardId, user, columns }) => {
  // Move a card between columns or into/out of groups
  const moveCard = useCallback((cardId, sourceColumnId, targetColumnId, targetGroupId = null) => {
    if (!boardId || !user) {
      return;
    }

    // Get card data from source column (cards always live in column now)
    const cardData = columns[sourceColumnId]?.cards?.[cardId];
    if (!cardData) {
      console.error('Card not found');
      return;
    }

    const promises = [];

    // Handle moving within the same column (grouping/ungrouping)
    if (sourceColumnId === targetColumnId) {
      const currentGroupId = cardData.groupId;

      // If moving to the same group state, do nothing
      if (currentGroupId === targetGroupId) {
        return;
      }

      // Update the card's groupId
      const cardGroupRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}/groupId`);

      if (targetGroupId) {
        // Adding to a group
        promises.push(set(cardGroupRef, targetGroupId));

        // Add card ID to the target group's cardIds array (only if not already there)
        const targetGroup = columns[targetColumnId]?.groups?.[targetGroupId];
        if (targetGroup) {
          const currentCardIds = targetGroup.cardIds || [];
          if (!currentCardIds.includes(cardId)) {
            const newCardIds = [...currentCardIds, cardId];
            const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/groups/${targetGroupId}/cardIds`);
            promises.push(set(groupCardIdsRef, newCardIds));
          }
        }
      } else {
        // Removing from group
        promises.push(remove(cardGroupRef));
      }

      // Remove card ID from source group if it was in one
      if (currentGroupId) {
        const sourceGroup = columns[sourceColumnId]?.groups?.[currentGroupId];
        if (sourceGroup && sourceGroup.cardIds && sourceGroup.cardIds.includes(cardId)) {
          const newCardIds = sourceGroup.cardIds.filter(id => id !== cardId);
          const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/groups/${currentGroupId}/cardIds`);
          promises.push(set(groupCardIdsRef, newCardIds));
        }
      }
    } else {
      // Moving between different columns
      const sourceCardRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/cards/${cardId}`);
      const targetCardRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/cards/${cardId}`);

      // Create new card data, setting groupId if moving into a group
      const { groupId: _groupId, ...cardDataWithoutGroup } = cardData;
      const newCardData = targetGroupId
        ? { ...cardDataWithoutGroup, groupId: targetGroupId }
        : cardDataWithoutGroup;

      promises.push(remove(sourceCardRef));
      promises.push(set(targetCardRef, newCardData));

      // Add card to target group if specified
      if (targetGroupId) {
        const targetGroup = columns[targetColumnId]?.groups?.[targetGroupId];
        if (targetGroup) {
          const currentCardIds = targetGroup.cardIds || [];
          if (!currentCardIds.includes(cardId)) {
            const newCardIds = [...currentCardIds, cardId];
            const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${targetColumnId}/groups/${targetGroupId}/cardIds`);
            promises.push(set(groupCardIdsRef, newCardIds));
          }
        }
      }

      // Remove card from source group if it was in one
      if (cardData.groupId) {
        const sourceGroup = columns[sourceColumnId]?.groups?.[cardData.groupId];
        if (sourceGroup && sourceGroup.cardIds) {
          const newCardIds = sourceGroup.cardIds.filter(id => id !== cardId);
          const groupCardIdsRef = ref(database, `boards/${boardId}/columns/${sourceColumnId}/groups/${cardData.groupId}/cardIds`);
          promises.push(set(groupCardIdsRef, newCardIds));
        }
      }
    }

    // Execute all operations atomically
    return Promise.all(promises)
      .then(() => {
        console.log(`Card ${cardId} moved from ${sourceColumnId} to ${targetColumnId}${targetGroupId ? ` (group ${targetGroupId})` : ''}`);
      })
      .catch(error => {
        console.error('Error moving card:', error);
        throw error; // Re-throw so caller can handle it
      });
  }, [boardId, user, columns]);

  // Create a new group with selected cards
  const createCardGroup = useCallback((columnId, cardIds, groupName = 'New Group', targetCreatedTime = null) => {
    if (!boardId || !user || !cardIds.length) {
      return;
    }

    const groupId = generateId();
    const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);

    // Use target card's created time if provided, otherwise use current time
    const createdTime = targetCreatedTime || Date.now();

    // Create group with card ID references only
    const groupData = {
      name: groupName,
      created: createdTime,
      expanded: true,
      votes: 0,
      voters: {},
      cardIds // Just store the card IDs, not the card data
    };

    // Update each card to reference this group
    const cardUpdatePromises = cardIds.map(cardId => {
      const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
      return set(cardRef, groupId);
    });

    // Create the group and update cards atomically
    Promise.all([
      set(groupRef, groupData),
      ...cardUpdatePromises
    ])
      .then(() => {
        console.log(`Group ${groupId} created with ${cardIds.length} cards`);
      })
      .catch(error => {
        console.error('Error creating group:', error);
      });
  }, [boardId, user]);

  // Ungroup cards (remove group and clear groupId from cards)
  const ungroupCards = useCallback((columnId, groupId) => {
    if (!boardId || !user) {
      return;
    }

    const groupData = columns[columnId]?.groups?.[groupId];
    if (!groupData || !groupData.cardIds) {
      return;
    }

    const updatePromises = [];

    // Clear groupId from each card
    groupData.cardIds.forEach(cardId => {
      const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
      updatePromises.push(remove(cardRef));
    });

    // Remove the group
    const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);

    Promise.all([
      ...updatePromises,
      remove(groupRef)
    ])
      .then(() => {
        console.log(`Group ${groupId} ungrouped`);
      })
      .catch(error => {
        console.error('Error ungrouping cards:', error);
      });
  }, [boardId, user, columns]);

  // Remove all grouping from the board
  const removeAllGrouping = useCallback(() => {
    if (!boardId || !user) {
      return Promise.resolve();
    }

    const promises = [];

    // Loop through all columns and ungroup all groups
    Object.entries(columns).forEach(([columnId, column]) => {
      if (column.groups) {
        Object.entries(column.groups).forEach(([groupId, group]) => {
          if (group.cardIds) {
            // Clear groupId from each card in the group
            group.cardIds.forEach(cardId => {
              const cardRef = ref(database, `boards/${boardId}/columns/${columnId}/cards/${cardId}/groupId`);
              promises.push(remove(cardRef));
            });
          }

          // Remove the group itself
          const groupRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}`);
          promises.push(remove(groupRef));
        });
      }
    });

    return Promise.all(promises)
      .then(() => {
        console.log('All grouping removed from board');
      })
      .catch(error => {
        console.error('Error removing all grouping:', error);
        throw error;
      });
  }, [boardId, user, columns]);

  // Update group name
  const updateGroupName = useCallback((columnId, groupId, newName) => {
    if (!boardId || !user) {
      return;
    }

    const nameRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/name`);
    set(nameRef, newName)
      .then(() => {
        console.log('Group name updated');
      })
      .catch(error => {
        console.error('Error updating group name:', error);
      });
  }, [boardId, user]);

  // Toggle group expanded state
  const toggleGroupExpanded = useCallback((columnId, groupId, expanded) => {
    if (!boardId || !user) {
      return;
    }

    const expandedRef = ref(database, `boards/${boardId}/columns/${columnId}/groups/${groupId}/expanded`);
    set(expandedRef, expanded)
      .catch(error => {
        console.error('Error updating group expanded state:', error);
      });
  }, [boardId, user]);

  return {
    moveCard,
    createCardGroup,
    ungroupCards,
    removeAllGrouping,
    updateGroupName,
    toggleGroupExpanded
  };
};
