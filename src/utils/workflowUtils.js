/**
 * Utility functions for workflow phase management
 */

// Workflow phase constants
export const WORKFLOW_PHASES = {
  CREATION: 'CREATION',
  GROUPING: 'GROUPING', 
  INTERACTIONS: 'INTERACTIONS',
  INTERACTION_REVEAL: 'INTERACTION_REVEAL',
  RESULTS: 'RESULTS'
};

/**
 * Determines if grouping is allowed in the current workflow phase
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isGroupingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return false; // Only allow when retrospective mode is active
  return workflowPhase === WORKFLOW_PHASES.GROUPING;
};

/**
 * Determines if interactions (voting, comments, reactions) are allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Allow when retrospective mode is disabled (normal behavior)
  return workflowPhase === WORKFLOW_PHASES.INTERACTIONS;
};

/**
 * Determines if interactions should be visible
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Always visible when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.INTERACTIONS ||
         workflowPhase === WORKFLOW_PHASES.INTERACTION_REVEAL || 
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if others' interactions should be visible (revealed)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areOthersInteractionsVisible = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Always visible when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.INTERACTION_REVEAL || 
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if cards should be obfuscated (hidden)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const shouldObfuscateCards = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return false; // Never obfuscate when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.CREATION || 
         workflowPhase === WORKFLOW_PHASES.GROUPING;
};

/**
 * Determines if cards have been revealed (no longer obfuscated)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areCardsRevealed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Always revealed when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.INTERACTIONS || 
         workflowPhase === WORKFLOW_PHASES.INTERACTION_REVEAL || 
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if interactions have been revealed (are in frozen state)
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const areInteractionsRevealed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return false; // Never revealed when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.INTERACTION_REVEAL || 
         workflowPhase === WORKFLOW_PHASES.RESULTS;
};

/**
 * Determines if card creation/editing is allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardEditingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Always allow when retrospective mode is disabled
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
  if (!retrospectiveMode) return true; // Always allow when retrospective mode is disabled
  return workflowPhase === WORKFLOW_PHASES.CREATION;
};

/**
 * Determines if card dragging is allowed
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @returns {boolean}
 */
export const isCardDraggingAllowed = (workflowPhase, retrospectiveMode = false) => {
  if (!retrospectiveMode) return true; // Always allow when retrospective mode is disabled
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
 * Gets the current phase description
 * @param {string} workflowPhase - Current workflow phase
 * @returns {string}
 */
export const getPhaseDescription = (workflowPhase) => {
  switch (workflowPhase) {
    case WORKFLOW_PHASES.CREATION:
      return 'Create and add cards to the board';
    case WORKFLOW_PHASES.GROUPING:
      return 'Group related cards together';
    case WORKFLOW_PHASES.INTERACTIONS:
      return 'Add comments, votes, and reactions';
    case WORKFLOW_PHASES.INTERACTION_REVEAL:
      return 'Review all interactions and feedback';
    case WORKFLOW_PHASES.RESULTS:
      return 'View top-voted items';
    default:
      return 'Unknown phase';
  }
};
