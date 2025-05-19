/**
 * Helper functions for handling voting logic
 */

/**
 * Determines how to process a vote change based on current state and settings
 * 
 * @param {Object} options - The voting options
 * @param {number} options.userCurrentVote - The user's current vote value (0, 1, or -1)
 * @param {number} options.requestedDelta - The requested vote change (1 for upvote, -1 for downvote)
 * @param {boolean} options.multipleVotesAllowed - Whether multiple votes are allowed per user
 * @param {number} options.currentTotalVotes - The current total votes on the card
 * @returns {Object} An object containing { 
 *   delta: the actual vote change to apply,
 *   isVoteRemoval: whether this is removing a vote,
 *   message: message to display,
 *   shouldReturn: whether to exit early without database updates
 * }
 */
export function determineVoteChange({
  userCurrentVote,
  requestedDelta,
  multipleVotesAllowed,
  currentTotalVotes
}) {
  // Prevent negative total votes
  if (requestedDelta < 0 && currentTotalVotes <= 0) {
    return {
      delta: 0,
      isVoteRemoval: false,
      message: "Can't have negative votes",
      shouldReturn: true
    };
  }

  // If multiple votes are not allowed
  if (!multipleVotesAllowed) {
    // If the user is trying to vote in the same direction they already voted
    if (userCurrentVote === requestedDelta) {
      return {
        delta: 0,
        isVoteRemoval: false,
        message: "You've already voted",
        shouldReturn: true
      };
    }
    
    // If the user already voted and is now voting in opposite direction,
    // just reset their vote (remove previous vote, don't add new one)
    if (userCurrentVote !== 0) {
      return {
        delta: -userCurrentVote, // Cancel their previous vote only
        isVoteRemoval: true,
        message: "Vote removed",
        shouldReturn: false
      };
    }
  }

  // Default case: apply the requested vote change
  return {
    delta: requestedDelta,
    isVoteRemoval: false,
    message: requestedDelta > 0 ? "Upvoted card" : "Downvoted card",
    shouldReturn: false
  };
}

/**
 * Calculates the new user vote value based on current vote and settings
 * 
 * @param {Object} options - The vote calculation options
 * @param {number} options.userCurrentVote - The user's current vote value
 * @param {number} options.delta - The vote change to apply
 * @param {boolean} options.multipleVotesAllowed - Whether multiple votes are allowed
 * @returns {number} The new user vote value
 */
export function calculateNewUserVote({
  userCurrentVote,
  delta,
  multipleVotesAllowed
}) {
  if (multipleVotesAllowed) {
    // For multiple votes: increment their current vote
    return userCurrentVote + delta;
  } else {
    // For single votes only:
    // If they had a previous vote and are voting opposite, clear their vote
    // If they had no previous vote, set to new direction
    return (userCurrentVote !== 0 && delta === -userCurrentVote) ? 0 : delta;
  }
}