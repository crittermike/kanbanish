import { useBoardContext } from '../context/BoardContext';
import { areInteractionsVisible } from '../utils/workflowUtils';

const VoteCounter = () => {
  const { 
    user, 
    votesPerUser, 
    getUserVoteCount, 
    workflowPhase, 
    retrospectiveMode, 
    votingEnabled 
  } = useBoardContext();

  // Don't show if voting is disabled or interactions aren't visible
  if (!votingEnabled || !areInteractionsVisible(workflowPhase, retrospectiveMode) || !user) {
    return null;
  }

  const usedVotes = getUserVoteCount(user.uid);
  const remainingVotes = Math.max(0, votesPerUser - usedVotes);

  return (
    <div className="vote-counter">
      <div className="vote-counter-content">
        <span className="vote-counter-label">Your votes remaining:</span>
        <span className={`vote-counter-value ${remainingVotes === 0 ? 'vote-counter-depleted' : ''}`}>
          {remainingVotes}/{votesPerUser}
        </span>
      </div>
    </div>
  );
};

export default VoteCounter;
