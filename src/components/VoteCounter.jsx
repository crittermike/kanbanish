import { useBoardContext } from '../context/BoardContext';
import { useVoteCounterVisibility } from '../hooks/useVoteCounterVisibility';
import BaseVoteCounter from './BaseVoteCounter';

const VoteCounter = () => {
  const { isUserVoteCounterVisible } = useVoteCounterVisibility();
  const { user, votesPerUser, getUserVoteCount } = useBoardContext();

  if (!isUserVoteCounterVisible) {
    return null;
  }

  const usedVotes = getUserVoteCount(user.uid);
  const remainingVotes = Math.max(0, votesPerUser - usedVotes);

  return (
    <BaseVoteCounter
      className="vote-counter"
      label="Your votes remaining:"
      value={remainingVotes}
      total={votesPerUser}
      isDepleted={remainingVotes === 0}
    />
  );
};

export default VoteCounter;
