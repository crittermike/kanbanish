import React from 'react';
import { Minus } from 'react-feather';

const VotingControls = React.memo(({ votes, onUpvote, onDownvote, showDownvoteButton = true, disabled = false, disabledReason = 'voting-disabled', active = false }) => {
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
    <div className={`votes vote-pill ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        className={`vote-button upvote-button ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? undefined : onUpvote}
        title={getButtonTitle('upvote')}
        disabled={disabled}
        aria-label="Upvote"
        aria-pressed={active}
      >
        <span className="vote-emoji" aria-hidden="true">👍</span>
        <span className="vote-count">{votes || 0}</span>
      </button>
      {showDownvoteButton && (
        <button
          className={`vote-button downvote-button ${disabled ? 'disabled' : ''}`}
          onClick={disabled ? undefined : onDownvote}
          title={getButtonTitle('downvote')}
          disabled={disabled}
          aria-label="Downvote"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default VotingControls;
