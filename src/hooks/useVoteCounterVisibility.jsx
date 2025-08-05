import { useBoardContext } from '../context/BoardContext';
import { areInteractionsVisible } from '../utils/workflowUtils';

/**
 * Custom hook to determine if vote counters should be visible
 * Centralizes the common visibility logic for both VoteCounter and TotalVoteCounter
 */
export const useVoteCounterVisibility = () => {
  const { 
    votingEnabled, 
    retrospectiveMode, 
    workflowPhase, 
    user, 
    activeUsers 
  } = useBoardContext();

  // Base visibility conditions that apply to all vote counters
  const isBaseVisible = votingEnabled && 
                       retrospectiveMode && 
                       areInteractionsVisible(workflowPhase, retrospectiveMode);

  // Individual user vote counter visibility (requires logged in user)
  const isUserVoteCounterVisible = isBaseVisible && !!user;

  // Total vote counter visibility (requires active users)
  const isTotalVoteCounterVisible = isBaseVisible && !!activeUsers;

  return {
    isUserVoteCounterVisible,
    isTotalVoteCounterVisible,
    isBaseVisible,
    votingEnabled,
    retrospectiveMode,
    workflowPhase,
    user,
    activeUsers
  };
};
