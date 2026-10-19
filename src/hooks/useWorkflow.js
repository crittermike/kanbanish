import { useCallback } from 'react';
import { WORKFLOW_PHASES, hasCardAddedSince } from '../utils/workflowUtils';

/**
 * Hook for workflow phase transitions and results navigation.
 *
 * Manages the Add → Group → Vote → Discuss steps (with optional health check
 * and poll): starting and ending a run, moving between steps, and navigating
 * the sorted results view. `retrospectiveMode` means a run is in progress.
 *
 * @param {Object} params
 * @param {Function} params.updateBoardSettings - Function to update board settings in Firebase
 * @param {Object} params.columns - Board columns data
 * @param {string} params.workflowPhase - Current workflow phase
 * @param {number} params.resultsViewIndex - Current results view index
 * @param {Function} params.removeAllGrouping - Function to remove card groups
 * @param {boolean} params.flowHealthCheck - Start runs with a health check
 * @param {boolean} params.flowPoll - End runs with a poll
 * @param {number|null} params.flowStartedAt - When the current run started
 * @param {Function} params.resetHealthCheck - Clears health check answers
 * @param {Function} params.resetPoll - Clears poll answers
 * @returns {Object} Workflow operations
 */
export const useWorkflow = ({
  updateBoardSettings, columns, workflowPhase,
  resultsViewIndex, removeAllGrouping,
  flowHealthCheck = false, flowPoll = false, flowStartedAt = null,
  resetHealthCheck, resetPoll
}) => {
  const startFlow = useCallback(() => {
    // Answers from a previous run don't carry over
    resetHealthCheck?.();
    resetPoll?.();
    updateBoardSettings({
      retrospectiveMode: true,
      votingEnabled: true,
      workflowPhase: flowHealthCheck ? WORKFLOW_PHASES.HEALTH_CHECK : WORKFLOW_PHASES.CREATION,
      resultsViewIndex: 0,
      flowStartedAt: Date.now()
    });
  }, [updateBoardSettings, flowHealthCheck, resetHealthCheck, resetPoll]);

  // Groups and votes stay on the board
  const endFlow = useCallback(() => {
    updateBoardSettings({
      retrospectiveMode: false,
      workflowPhase: WORKFLOW_PHASES.CREATION,
      resultsViewIndex: 0
    });
  }, [updateBoardSettings]);

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

  const goToNextPhase = useCallback(() => {
    switch (workflowPhase) {
      case WORKFLOW_PHASES.HEALTH_CHECK:
        startHealthCheckResultsPhase();
        break;
      case WORKFLOW_PHASES.HEALTH_CHECK_RESULTS:
        updateBoardSettings({ workflowPhase: WORKFLOW_PHASES.CREATION });
        break;
      case WORKFLOW_PHASES.CREATION:
        startGroupingPhase();
        break;
      case WORKFLOW_PHASES.GROUPING:
        startInteractionsPhase();
        break;
      case WORKFLOW_PHASES.INTERACTIONS:
        startResultsPhase();
        break;
      case WORKFLOW_PHASES.RESULTS:
        if (flowPoll) {
          startPollPhase();
        } else {
          endFlow();
        }
        break;
      case WORKFLOW_PHASES.POLL:
        startPollResultsPhase();
        break;
      case WORKFLOW_PHASES.POLL_RESULTS:
        endFlow();
        break;
      default:
        break;
    }
  }, [
    workflowPhase, flowPoll, updateBoardSettings, startHealthCheckResultsPhase, startGroupingPhase,
    startInteractionsPhase, startResultsPhase, startPollPhase, startPollResultsPhase, endFlow
  ]);

  const goToPreviousPhase = useCallback(() => {
    switch (workflowPhase) {
      case WORKFLOW_PHASES.HEALTH_CHECK_RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK
        });
        break;
      case WORKFLOW_PHASES.CREATION:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.HEALTH_CHECK_RESULTS
        });
        break;
      case WORKFLOW_PHASES.GROUPING: {
        // Going back to Add undoes this run's grouping; groups from earlier runs stay
        const hasGroups = Object.values(columns).some(column =>
          Object.values(column.groups || {}).some(group =>
            !flowStartedAt || hasCardAddedSince(column, group, flowStartedAt)
          )
        );

        if (hasGroups) {
          const confirmMessage = 'Going back to Add will undo grouping. This cannot be undone. Continue?';
          if (!window.confirm(confirmMessage)) {
            return; // User cancelled
          }

          // Remove all grouping before transitioning
          removeAllGrouping(flowStartedAt)
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
      case WORKFLOW_PHASES.RESULTS:
        updateBoardSettings({
          workflowPhase: WORKFLOW_PHASES.INTERACTIONS
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
        // HEALTH_CHECK is the first step; unknown phases do nothing
        break;
    }
  }, [workflowPhase, columns, flowStartedAt, updateBoardSettings, removeAllGrouping]);

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
    startResultsPhase,
    startPollPhase,
    startPollResultsPhase,
    startFlow,
    endFlow,
    goToNextPhase,
    goToPreviousPhase,
    startHealthCheckPhase,
    startHealthCheckResultsPhase,
    navigateResults,
    getSortedItemsForResults
  };
};
