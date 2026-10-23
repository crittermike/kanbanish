import { useCallback } from 'react';
import { WORKFLOW_PHASES, hasCardAddedSince } from '../utils/workflowUtils';

const isHealthOrPoll = phase => [
  WORKFLOW_PHASES.HEALTH_CHECK, WORKFLOW_PHASES.HEALTH_CHECK_RESULTS,
  WORKFLOW_PHASES.POLL, WORKFLOW_PHASES.POLL_RESULTS
].includes(phase);

/**
 * Hook for workflow phase transitions and results navigation.
 *
 * Manages the Health → Add → Group → Vote → Discuss → Poll steps: starting
 * and ending a run, jumping between steps, and navigating the sorted results
 * view. `retrospectiveMode` means a run is in progress.
 *
 * @param {Object} params
 * @param {Function} params.updateBoardSettings - Function to update board settings in Firebase
 * @param {Object} params.columns - Board columns data
 * @param {string} params.workflowPhase - Current workflow phase
 * @param {boolean} params.retrospectiveMode - Whether a run is in progress
 * @param {number} params.resultsViewIndex - Current results view index
 * @param {Function} params.removeAllGrouping - Function to remove card groups
 * @param {number|null} params.flowStartedAt - When the current run started
 * @param {Function} params.resetPoll - Clears poll answers
 * @param {Function} params.resetHealthCheck - Clears health check answers
 * @param {Function} params.clearVotes - Clears card and group votes before a new run
 * @param {Function} params.showNotification - Displays errors to the user
 * @returns {Object} Workflow operations
 */
export const useWorkflow = ({
  updateBoardSettings, columns, workflowPhase, retrospectiveMode = false,
  resultsViewIndex, removeAllGrouping, flowStartedAt = null, resetPoll, resetHealthCheck,
  clearVotes, showNotification
}) => {
  // A new run starts with a fresh vote budget for everyone
  const startFlow = useCallback(async (phase = WORKFLOW_PHASES.CREATION, keepAnswers = false) => {
    try {
      await clearVotes();
    } catch (error) {
      console.error('Failed to clear votes before starting a run:', error);
      showNotification('Could not start the steps because votes could not be reset. Please try again.');
      return;
    }
    if (!keepAnswers) {
      resetHealthCheck?.();
      resetPoll?.();
    }
    updateBoardSettings({
      retrospectiveMode: true,
      votingEnabled: true,
      workflowPhase: phase,
      resultsViewIndex: 0,
      flowStartedAt: Date.now()
    });
  }, [updateBoardSettings, resetHealthCheck, resetPoll, clearVotes, showNotification]);

  // Groups and votes stay on the board
  const endFlow = useCallback(() => {
    updateBoardSettings({
      retrospectiveMode: false,
      workflowPhase: WORKFLOW_PHASES.CREATION,
      resultsViewIndex: 0
    });
  }, [updateBoardSettings]);

  // Jumps to a step, starting a run first if none is in progress
  const goToPhase = useCallback(phase => {
    if (!retrospectiveMode) {
      // A health check opened by a template carries on into the steps with its answers
      return startFlow(phase, isHealthOrPoll(workflowPhase));
    }
    if (phase === workflowPhase) {
      return;
    }
    if (phase === WORKFLOW_PHASES.RESULTS) {
      updateBoardSettings({ workflowPhase: phase, resultsViewIndex: 0 });
      return;
    }
    if (phase !== WORKFLOW_PHASES.CREATION) {
      updateBoardSettings({ workflowPhase: phase });
      return;
    }

    // Going back to Add undoes this run's grouping; groups from earlier runs stay
    const hasGroups = Object.values(columns || {}).some(column =>
      Object.values(column.groups || {}).some(group =>
        !flowStartedAt || hasCardAddedSince(column, group, flowStartedAt)
      )
    );
    if (!hasGroups) {
      updateBoardSettings({ workflowPhase: phase });
      return;
    }
    if (!window.confirm('Going back to Add will undo grouping. This cannot be undone. Continue?')) {
      return;
    }
    removeAllGrouping(flowStartedAt)
      .then(() => updateBoardSettings({ workflowPhase: phase }))
      .catch(error => {
        console.error('Failed to remove grouping:', error);
      });
  }, [retrospectiveMode, workflowPhase, columns, flowStartedAt, startFlow, updateBoardSettings, removeAllGrouping]);

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
    startFlow,
    endFlow,
    goToPhase,
    navigateResults,
    getSortedItemsForResults
  };
};
