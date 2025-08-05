import { useBoardContext } from '../context/BoardContext';
import { areInteractionsVisible } from '../utils/workflowUtils';

const TotalVoteCounter = () => {
  const { 
    votesPerUser, 
    getTotalVotesRemaining, 
    activeUsers,
    workflowPhase, 
    retrospectiveMode, 
    votingEnabled 
  } = useBoardContext();

  // Don't show if voting is disabled or interactions aren't visible
  if (!votingEnabled || !areInteractionsVisible(workflowPhase, retrospectiveMode) || !activeUsers) {
    return null;
  }

  const totalVotesRemaining = getTotalVotesRemaining();
  const totalPossibleVotes = activeUsers * votesPerUser;

  return (
    <div className="total-vote-counter">
      <div className="total-vote-counter-content">
        <span className="total-vote-counter-label">Total votes remaining:</span>
        <span className={`total-vote-counter-value ${totalVotesRemaining === 0 ? 'total-vote-counter-depleted' : ''}`}>
          {totalVotesRemaining}/{totalPossibleVotes}
        </span>
      </div>
    </div>
  );
};

export default TotalVoteCounter;
