import React from 'react';
import { ChevronUp, ChevronDown } from 'react-feather';
import { useBoardContext } from '../context/BoardContext';

const VotingControls = React.memo(({ 
  votes, 
  onUpvote, 
  onDownvote, 
  hasUserVoted 
}) => {
  const { maxVotesPerUser, getRemainingVotes } = useBoardContext();
  const remainingVotes = getRemainingVotes();
  const isVoteLimitReached = maxVotesPerUser !== null && remainingVotes <= 0;
  
  return (
    <div className="votes">
      <button 
        className={`vote-button ${hasUserVoted ? 'voted' : ''}`} 
        onClick={onUpvote} 
        title={hasUserVoted ? "You already voted" : isVoteLimitReached ? `Vote limit reached (${maxVotesPerUser})` : "Upvote"}
        disabled={isVoteLimitReached && !hasUserVoted}
      >
        <ChevronUp size={16} />
      </button>
      <span className="vote-count">{votes || 0}</span>
      <button 
        className="vote-button" 
        onClick={onDownvote} 
        title={hasUserVoted ? "Remove your vote" : "Remove vote"}
        disabled={!hasUserVoted}
      >
        <ChevronDown size={16} />
      </button>
      {maxVotesPerUser !== null && (
        <span className="votes-remaining" title={`${remainingVotes} of ${maxVotesPerUser} votes remaining`}>
          ({remainingVotes}/{maxVotesPerUser})
        </span>
      )}
    </div>
  );
});

export default VotingControls;
