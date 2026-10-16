import { useBoardContext } from '../context/BoardContext';
import { useVoteCounterVisibility } from '../hooks/useVoteCounterVisibility';

const VoteCounter = () => {
  const { isUserVoteCounterVisible } = useVoteCounterVisibility();
  const { user, votesPerUser, getUserVoteCount } = useBoardContext();

  if (!isUserVoteCounterVisible || !votesPerUser) {
    return null;
  }

  const remainingVotes = Math.max(0, votesPerUser - getUserVoteCount(user.uid));
  const depletedClass = remainingVotes === 0 ? ' vote-counter-depleted' : '';

  return (
    <div className="vote-counter" data-testid="vote-counter">
      <div className="vote-counter-content">
        <span className={`vote-counter-value${depletedClass}`}>{remainingVotes}</span>{' '}
        <span className="vote-counter-label">{remainingVotes === 1 ? 'vote' : 'votes'} left</span>
      </div>
    </div>
  );
};

export default VoteCounter;
