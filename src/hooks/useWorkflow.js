import { useCallback } from 'react';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

/**
 * Hook for workflow phase transitions and results navigation.
 *
 * Manages the retrospective workflow: phase progression, going back,
 * and navigating the sorted results view.
 *
 * @param {Object} params
 * @param {Function} params.updateBoardSettings - Function to update board settings in Firebase
 * @param {Object} params.columns - Board columns data
 * @param {string} params.workflowPhase - Current workflow phase
 * @param {number} params.resultsViewIndex - Current results view index
 * @param {Function} params.removeAllGrouping - Function to remove all card groups
 * @returns {Object} Workflow operations
 */
export const useWorkflow = ({
  updateBoardSettings, columns, workflowPhase,
  resultsViewIndex, removeAllGrouping
}) => {
  const startGroupingPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.GROUPING,
      retrospectiveMode: true
    });
  }, [updateBoardSettings]);

  const startInteractionsPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.INTERACTIONS
    });
  }, [updateBoardSettings]);

  const startInteractionRevealPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.INTERACTION_REVEAL
    });
  }, [updateBoardSettings]);

  const startResultsPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.RESULTS,
      resultsViewIndex: 0
    });
  }, [updateBoardSettings]);

  const startPollPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.POLL
    });
  }, [updateBoardSettings]);

  const startPollResultsPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.POLL_RESULTS
    });
  }, [updateBoardSettings]);

  const goToCreationPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.CREATION,
      retrospectiveMode: false,
      resultsViewIndex: 0
    });
  }, [updateBoardSettings]);

  const startHealthCheckPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
    });
  }, [updateBoardSettings]);

  const startHealthCheckResultsPhase = useCallback(() => {
    updateBoardSettings({
      workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK_RESULTS
    });
  }, [updateBoardSettings]);

  const goToPreviousPhase = useCallback(() => {
    switch (workflowPhase) {
      case WORKFLOW_PHASES.CREATION:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
        });
        break;
      case WORKFLOW_PHASES.GROUPING: {
        // When going back to CREATION from GROUPING, warn about losing group data
        const hasGroups = Object.values(columns).some(column =>
          column.groups && Object.keys(column.groups).length > 0
        );

        if (hasGroups) {
          const confirmMessage = 'Going back to the creation phase will remove all card grouping. This cannot be undone. Are you sure you want to continue?';
          if (!window.confirm(confirmMessage)) {
            return; // User cancelled
          }

          // Remove all grouping before transitioning
          removeAllGrouping()
            .then(() => {
              updateBoardSettings({
                workflowPhase: WORKFLOW_PHASES.CREATION
              });
            })
            .catch(error => {
              console.error('Failed to remove grouping:', error);
            });
        } else {
          // No groups to remove, just transition
          updateBoardSettings({
            workflowPhase: WORKFLOW_PHASES.CREATION
          });
        }
        break;
      }
      case WORKFLOW_PHASES.INTERACTIONS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.GROUPING
        });
        break;
      case WORKFLOW_PHASES.INTERACTION_REVEAL:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.INTERACTIONS
        });
        break;
      case WORKFLOW_PHASES.RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.INTERACTION_REVEAL
        });
        break;
      case WORKFLOW_PHASES.POLL:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.RESULTS
        });
        break;
      case WORKFLOW_PHASES.POLL_RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.POLL
        });
        break;
      default:
        // If we're in CREATION or any unknown phase, do nothing
        break;
    }
  }, [workflowPhase, columns, updateBoardSettings, removeAllGrouping]);

  // Get sorted items (cards and groups) for results view
  const getSortedItemsForResults = useCallback(() => {
    const allItems = [];

    Object.keys(columns).forEach(columnId => {
      const columnData = columns[columnId];

      // Add individual cards (not in groups)
      Object.keys(columnData.cards || {}).forEach(cardId => {
        const card = columnData.cards[cardId];
        if (!card.groupId) {
          allItems.push({
            type: 'card',
            id: cardId,
            columnId,
            data: card,
            votes: card.votes || 0
          });
        }
      });

      // Add groups
      Object.keys(columnData.groups || {}).forEach(groupId => {
        const group = columnData.groups[groupId];
        allItems.push({
          type: 'group',
          id: groupId,
          columnId,
          data: group,
          votes: group.votes || 0
        });
      });
    });

    // Sort by votes (descending)
    return allItems.sort((a, b) => b.votes - a.votes);
  }, [columns]);

  // Results navigation
  const navigateResults = useCallback(direction => {
    if (workflowPhase !== WORKFLOW_PHASES.RESULTS) {
      return;
    }

    const sortedItems = getSortedItemsForResults();
    const maxIndex = sortedItems.length - 1;

    let newIndex = resultsViewIndex;
    if (direction === 'next' && resultsViewIndex < maxIndex) {
      newIndex = resultsViewIndex + 1;
    } else if (direction === 'prev' && resultsViewIndex > 0) {
      newIndex = resultsViewIndex - 1;
    }

    updateBoardSettings({ resultsViewIndex: newIndex });
  }, [workflowPhase, resultsViewIndex, getSortedItemsForResults, updateBoardSettings]);

  return {
    startGroupingPhase,
    startInteractionsPhase,
    startInteractionRevealPhase,
    startResultsPhase,
    startPollPhase,
    startPollResultsPhase,
    goToCreationPhase,
    goToPreviousPhase,
    startHealthCheckPhase,
    startHealthCheckResultsPhase,
    navigateResults,
    getSortedItemsForResults
  };
};
