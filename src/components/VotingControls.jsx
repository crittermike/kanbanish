import React from 'react';
import { ChevronUp, ChevronDown } from 'react-feather';

const VotingControls = React.memo(({ votes, onUpvote, onDownvote, showDownvoteButton = true }) => {
  return (
    <div className="votes">
      <button className="vote-button" onClick={onUpvote} title="Upvote">
        <ChevronUp size={16} />
      </button>
      <span className="vote-count">{votes || 0}</span>
      {showDownvoteButton && (
        <button className="vote-button" onClick={onDownvote} title="Downvote">
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
});

export default VotingControls;
