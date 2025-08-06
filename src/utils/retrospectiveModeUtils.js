/**
 * Utility functions for reveal mode state management
 */

import { areCardsRevealed, areInteractionsRevealed } from './workflowUtils';

/**
 * Determines the current phase of the three-phase reveal mode
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @param {string} workflowPhase - Current workflow phase
 * @returns {string} - 'normal' | 'hidden' | 'interactive' | 'frozen'
 */
export const getRevealPhase = (retrospectiveMode, workflowPhase) => {
  if (!retrospectiveMode) {
    return 'normal';
  }

  const cardsRevealed = areCardsRevealed(workflowPhase, retrospectiveMode);
  const interactionsRevealed = areInteractionsRevealed(workflowPhase, retrospectiveMode);

  if (!cardsRevealed) {
    return 'hidden';
  }
  if (!interactionsRevealed) {
    return 'interactive';
  }
  return 'frozen';
};

/**
 * Determines if content should be obfuscated (hidden with █ characters)
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @param {string} workflowPhase - Current workflow phase
 * @param {boolean} isCreator - Whether the current user is the creator
 * @returns {boolean}
 */
export const shouldObfuscateContent = (retrospectiveMode, workflowPhase, isCreator = false) => {
  const cardsRevealed = areCardsRevealed(workflowPhase, retrospectiveMode);
  return retrospectiveMode && !cardsRevealed && !isCreator;
};

/**
 * Determines if interactions should be disabled
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @param {string} workflowPhase - Current workflow phase
 * @returns {boolean}
 */
export const areInteractionsDisabled = (retrospectiveMode, workflowPhase) => {
  const cardsRevealed = areCardsRevealed(workflowPhase, retrospectiveMode);
  const interactionsRevealed = areInteractionsRevealed(workflowPhase, retrospectiveMode);
  return (retrospectiveMode && !cardsRevealed) || interactionsRevealed;
};

/**
 * Gets the disabled reason for interactions
 * @param {boolean} retrospectiveMode - Whether retrospective mode is enabled
 * @param {string} workflowPhase - Current workflow phase
 * @returns {string|null} - 'cards-not-revealed' | 'frozen' | null
 */
export const getDisabledReason = (retrospectiveMode, workflowPhase) => {
  if (!areInteractionsDisabled(retrospectiveMode, workflowPhase)) {
    return null;
  }
  const interactionsRevealed = areInteractionsRevealed(workflowPhase, retrospectiveMode);
  return interactionsRevealed ? 'frozen' : 'cards-not-revealed';
};

/**
 * Determines if styling should use disabled appearance
 * @param {boolean} disabled - Whether interactions are disabled
 * @param {string} disabledReason - The reason for being disabled
 * @returns {boolean}
 */
export const shouldUseDisabledStyling = (disabled, disabledReason) => {
  return disabled && disabledReason !== 'frozen';
};

/**
 * Determines if the feature should be hidden (rather than just disabled)
 * @param {string} disabledReason - The reason for being disabled
 * @returns {boolean}
 */
export const shouldHideFeature = disabledReason => {
  return disabledReason === 'frozen';
};

/**
 * Gets appropriate disabled message for reactions
 * @param {string} disabledReason - The reason for being disabled
 * @returns {string}
 */
export const getReactionDisabledMessage = disabledReason => {
  switch (disabledReason) {
    case 'frozen':
      return 'Interactions are now frozen - no more changes allowed';
    case 'cards-not-revealed':
    default:
      return 'Reactions disabled until cards are revealed';
  }
};

/**
 * Gets appropriate disabled message for comments
 * @param {string} disabledReason - The reason for being disabled
 * @returns {string|null} - null for frozen state to maintain silent behavior
 */
export const getCommentDisabledMessage = disabledReason => {
  switch (disabledReason) {
    case 'frozen':
      return null; // Silent behavior in frozen state
    case 'cards-not-revealed':
    default:
      return 'Comments are disabled until cards are revealed';
  }
};
