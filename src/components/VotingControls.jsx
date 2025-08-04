import React from 'react';
import { ChevronUp, ChevronDown } from 'react-feather';

const VotingControls = React.memo(({ votes, onUpvote, onDownvote, showDownvoteButton = true, disabled = false, disabledReason = 'voting-disabled' }) => {
  // Determine the appropriate title based on the disabled reason
  const getButtonTitle = action => {
    if (!disabled) {
      return action === 'upvote' ? 'Upvote' : 'Downvote';
    }

    switch (disabledReason) {
      case 'frozen':
        return 'Voting is frozen - no more changes allowed';
      case 'cards-not-revealed':
      default:
        return 'Voting disabled until cards are revealed';
    }
  };

  return (
    <div className="votes">
      <button
        className={`vote-button ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? undefined : onUpvote}
        title={getButtonTitle('upvote')}
        disabled={disabled}
      >
        <ChevronUp size={16} />
      </button>
      <span className="vote-count">{votes || 0}</span>
      {showDownvoteButton && (
        <button
          className={`vote-button ${disabled ? 'disabled' : ''}`}
          onClick={disabled ? undefined : onDownvote}
          title={getButtonTitle('downvote')}
          disabled={disabled}
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
});

export default VotingControls;
