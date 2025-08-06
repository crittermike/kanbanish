import { useBoardContext } from '../context/BoardContext';
import { useVoteCounterVisibility } from '../hooks/useVoteCounterVisibility';
import BaseVoteCounter from './BaseVoteCounter';

const TotalVoteCounter = () => {
  const { isTotalVoteCounterVisible } = useVoteCounterVisibility();
  const { votesPerUser, getTotalVotesRemaining, activeUsers } = useBoardContext();

  if (!isTotalVoteCounterVisible) {
    return null;
  }

  const totalVotesRemaining = getTotalVotesRemaining();
  const totalPossibleVotes = activeUsers * votesPerUser;

  return (
    <BaseVoteCounter
      className="total-vote-counter"
      label="Total votes remaining:"
      value={totalVotesRemaining}
      total={totalPossibleVotes}
      isDepleted={totalVotesRemaining === 0}
    />
  );
};

export default TotalVoteCounter;
