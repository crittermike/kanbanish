/**
 * Utility functions for reveal mode state management
 */

/**
 * Determines the current phase of the three-phase reveal mode
 * @param {boolean} revealMode - Whether reveal mode is enabled
 * @param {boolean} cardsRevealed - Whether cards have been revealed
 * @param {boolean} interactionsRevealed - Whether interactions have been revealed (frozen)
 * @returns {string} - 'normal' | 'hidden' | 'interactive' | 'frozen'
 */
export const getRevealPhase = (revealMode, cardsRevealed, interactionsRevealed) => {
  if (!revealMode) return 'normal';
  if (!cardsRevealed) return 'hidden';
  if (!interactionsRevealed) return 'interactive';
  return 'frozen';
};

/**
 * Determines if content should be obfuscated (hidden with █ characters)
 * @param {boolean} revealMode - Whether reveal mode is enabled
 * @param {boolean} cardsRevealed - Whether cards have been revealed
 * @param {boolean} isCreator - Whether the current user is the creator
 * @returns {boolean}
 */
export const shouldObfuscateContent = (revealMode, cardsRevealed, isCreator = false) => {
  return revealMode && !cardsRevealed && !isCreator;
};

/**
 * Determines if interactions should be disabled
 * @param {boolean} revealMode - Whether reveal mode is enabled
 * @param {boolean} cardsRevealed - Whether cards have been revealed
 * @param {boolean} interactionsRevealed - Whether interactions have been revealed (frozen)
 * @returns {boolean}
 */
export const areInteractionsDisabled = (revealMode, cardsRevealed, interactionsRevealed) => {
  return (revealMode && !cardsRevealed) || interactionsRevealed;
};

/**
 * Gets the disabled reason for interactions
 * @param {boolean} revealMode - Whether reveal mode is enabled
 * @param {boolean} cardsRevealed - Whether cards have been revealed
 * @param {boolean} interactionsRevealed - Whether interactions have been revealed (frozen)
 * @returns {string|null} - 'cards-not-revealed' | 'frozen' | null
 */
export const getDisabledReason = (revealMode, cardsRevealed, interactionsRevealed) => {
  if (!areInteractionsDisabled(revealMode, cardsRevealed, interactionsRevealed)) {
    return null;
  }
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
export const shouldHideFeature = (disabledReason) => {
  return disabledReason === 'frozen';
};

/**
 * Gets appropriate disabled message for reactions
 * @param {string} disabledReason - The reason for being disabled
 * @returns {string}
 */
export const getReactionDisabledMessage = (disabledReason) => {
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
export const getCommentDisabledMessage = (disabledReason) => {
  switch (disabledReason) {
    case 'frozen':
      return null; // Silent behavior in frozen state
    case 'cards-not-revealed':
    default:
      return 'Comments are disabled until cards are revealed';
  }
};
