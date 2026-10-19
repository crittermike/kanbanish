import { useBoardContext } from '../context/BoardContext';
import { WORKFLOW_PHASES } from '../utils/workflowUtils';

/**
 * Determines whether the current user's "votes left" counter should show.
 * It only appears during the Vote step.
 */
export const useVoteCounterVisibility = () => {
  const { votingEnabled, retrospectiveMode, workflowPhase, user } = useBoardContext();

  const isUserVoteCounterVisible = !!votingEnabled &&
    !!retrospectiveMode &&
    workflowPhase === WORKFLOW_PHASES.INTERACTIONS &&
    !!user;

  return { isUserVoteCounterVisible };
};
