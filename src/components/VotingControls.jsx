import React from 'react';
import { ChevronUp, ChevronDown } from 'react-feather';

const VotingControls = React.memo(({ votes, onUpvote, onDownvote, showDownvoteButton = true, disabled = false }) => {
  return (
    <div className="votes">
      <button 
        className={`vote-button ${disabled ? 'disabled' : ''}`} 
        onClick={!disabled ? onUpvote : undefined} 
        title={disabled ? "Voting disabled" : "Upvote"}
        disabled={disabled}
      >
        <ChevronUp size={16} />
      </button>
      <span className="vote-count">{votes || 0}</span>
      {showDownvoteButton && (
        <button 
          className={`vote-button ${disabled ? 'disabled' : ''}`} 
          onClick={!disabled ? onDownvote : undefined} 
          title={disabled ? "Voting disabled" : "Downvote"}
          disabled={disabled}
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
});

export default VotingControls;
