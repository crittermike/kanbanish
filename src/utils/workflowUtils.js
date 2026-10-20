/**
 * Utility functions for workflow phase management
 */

// Workflow phase constants
export const WORKFLOW_PHASES = {
  HEALTH_CHECK: 'HEALTH_CHECK',
  HEALTH_CHECK_RESULTS: 'HEALTH_CHECK_RESULTS',
  CREATION: 'CREATION',
  GROUPING: 'GROUPING',
  INTERACTIONS: 'INTERACTIONS',
  RESULTS: 'RESULTS',
  POLL: 'POLL',
  POLL_RESULTS: 'POLL_RESULTS'
};

/**
 * Whether a card was added during the current run of the steps. Without a run
 * start time (older boards, boards created from templates) every card counts.
 * @param {Object} card
 * @param {number|null} flowStartedAt
 * @returns {boolean}
 */
export const isCardFromCurrentRun = (card, flowStartedAt) =>
  !flowStartedAt || (card?.created || 0) >= flowStartedAt;

/**
 * Whether a group holds at least one card added at or after `since`.
 * @param {Object} column - Column data with cards
 * @param {Object} group - Group data with cardIds
 * @param {number} since
 * @returns {boolean}
 */
export const hasCardAddedSince = (column, group, since) =>
  (group.cardIds || []).some(cardId => isCardFromCurrentRun(column.cards?.[cardId], since));

/**
 * Determines if grouping is allowed in the current workflow phase
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isGroupingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return false;
  } // Only allow when retrospective mode is active
  return workflowPhase === WORKFLOW_PHASES.GROUPING;
};

/**
 * Determines if vote interactions are allowed.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Allow when retrospective mode is disabled (normal behavior)
  return workflowPhase === WORKFLOW_PHASES.INTERACTIONS;
};

/**
 * Determines if reactions should be visible.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areReactionsVisible = (workflowPhase, retrospectiveMode = false) => {
  return areReviewToolsVisible(workflowPhase, retrospectiveMode);
};

/**
 * Determines if reactions can be added or removed.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areReactionsAllowed = (workflowPhase, retrospectiveMode = false) => {
  return areReviewToolsVisible(workflowPhase, retrospectiveMode);
};

/**
 * Determines if interactions should be visible
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always visible when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.INTERACTIONS ||
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if review-oriented tools (detail view, comments, labels, colors)
 * should be visible for revealed cards.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areReviewToolsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  }
  return workflowPhase === WORKFLOW_PHASES.GROUPING ||
         workflowPhase === WORKFLOW_PHASES.INTERACTIONS ||
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if comments can be added or edited in the current workflow phase.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areCommentsAllowed = (workflowPhase, retrospectiveMode = false) => {
  return areReviewToolsVisible(workflowPhase, retrospectiveMode);
};

/**
 * Determines if review metadata (labels, colors) can be edited.
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardMetadataEditingAllowed = (workflowPhase, retrospectiveMode = false) => {
  return areReviewToolsVisible(workflowPhase, retrospectiveMode);
};

/**
 * Determines if others' interactions should be visible (revealed)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areOthersInteractionsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always visible when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if cards should be obfuscated (hidden)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const shouldObfuscateCards = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return false;
  } // Never obfuscate when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.CREATION;
};

/**
 * Determines if cards have been revealed (no longer obfuscated)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areCardsRevealed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always revealed when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.GROUPING ||
         workflowPhase === WORKFLOW_PHASES.INTERACTIONS ||
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if interactions have been revealed (are in frozen state)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsRevealed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return false;
  } // Never revealed when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if card creation/editing is allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardEditingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always allow when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.CREATION ||
         workflowPhase === WORKFLOW_PHASES.GROUPING;
};

/**
 * Determines if card creation (adding new cards) is allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardCreationAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always allow when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.CREATION;
};

/**
 * Determines if card dragging is allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardDraggingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return true;
  } // Always allow when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.GROUPING;
};

/**
 * Gets the disabled reason for an action
 * @param {string} action - The action being attempted
 * @param {string} workflowPhase - Current workflow phase
 * @returns {string|null}
 */
export const getWorkflowDisabledReason = (action, workflowPhase) => {
  switch (action) {
    case 'grouping':
      if (!isGroupingAllowed(workflowPhase)) {
        return 'Grouping is only allowed during the grouping phase';
      }
      break;
    case 'interactions':
      if (!areInteractionsAllowed(workflowPhase)) {
        return 'Interactions are only allowed during the interactions phase';
      }
      break;
    case 'editing':
      if (!isCardEditingAllowed(workflowPhase)) {
        return 'Card editing is only allowed during creation and grouping phases';
      }
      break;
    case 'dragging':
      if (!isCardDraggingAllowed(workflowPhase)) {
        return 'Card dragging is only allowed during the grouping phase';
      }
      break;
    default:
      return null;
  }
  return null;
};

/**
 * One-line explanation of what to do in a phase
 * @param {string} workflowPhase - Current workflow phase
 * @returns {string}
 */
export const getPhaseDescription = workflowPhase => {
  switch (workflowPhase) {
    case WORKFLOW_PHASES.HEALTH_CHECK:
      return 'Rate how things are going in each area.';
    case WORKFLOW_PHASES.HEALTH_CHECK_RESULTS:
      return 'See how everyone rated each area.';
    case WORKFLOW_PHASES.CREATION:
      return 'Add cards to any column. Other people\'s cards stay hidden until Group.';
    case WORKFLOW_PHASES.GROUPING:
      return 'Drag cards onto each other to group similar ones.';
    case WORKFLOW_PHASES.INTERACTIONS:
      return 'Vote on the cards that matter most. Votes stay hidden until Discuss.';
    case WORKFLOW_PHASES.RESULTS:
      return 'Talk through the top-voted cards one at a time.';
    case WORKFLOW_PHASES.POLL:
      return 'Rate how useful this was.';
    case WORKFLOW_PHASES.POLL_RESULTS:
      return 'See how useful everyone found this.';
    default:
      return 'Unknown phase';
  }
};

/**
 * Determines if polling is allowed in the current workflow phase
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isPollAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return false;
  } // Only allow when retrospective mode is active
  return workflowPhase === WORKFLOW_PHASES.POLL;
};

/**
 * Determines if poll results should be visible
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const arePollResultsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) {
    return false;
  } // Only visible when retrospective mode is active
  return workflowPhase === WORKFLOW_PHASES.POLL_RESULTS;
};
