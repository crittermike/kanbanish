import React from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';

const VotingControls = React.memo(({
  votes,
  onUpvote,
  onDownvote,
  showDownvoteButton = true,
  disabled = false,
  disabledReason = 'voting-disabled',
  userVote = 0,
  limitReached = false,
  downvoteRemovesVote = false,
  orientation = 'vertical'
}) => {
  const upActive = userVote > 0;
  const downActive = userVote < 0;
  const upBlocked = limitReached && !upActive;

  const getButtonTitle = action => {
    if (disabled) {
      return disabledReason === 'frozen'
        ? 'Voting is frozen - no more changes allowed'
        : 'Voting disabled until cards are revealed';
    }
    if (action === 'upvote') {
      return upBlocked ? 'No votes left' : 'Upvote';
    }
    return downvoteRemovesVote ? 'Remove vote' : 'Downvote';
  };

  const count = votes || 0;
  const hasDown = showDownvoteButton && !disabled;
  const classes = [
    'votes',
    `votes-${orientation}`,
    hasDown && 'has-down',
    upActive && 'voted-up',
    downActive && 'voted-down',
    disabled && 'disabled'
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        className={`vote-button upvote-button${upActive ? ' active' : ''}${upBlocked ? ' blocked' : ''}`}
        onClick={disabled ? undefined : onUpvote}
        title={getButtonTitle('upvote')}
        disabled={disabled}
        aria-label="Upvote"
        aria-pressed={upActive}
      >
        <ChevronUp size={16} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <span className={`vote-count${count === 0 ? ' zero' : ''}`}>{count}</span>
      {hasDown && (
        <button
          className={`vote-button downvote-button${downActive ? ' active' : ''}`}
          onClick={onDownvote}
          title={getButtonTitle('downvote')}
          aria-label={downvoteRemovesVote ? 'Remove vote' : 'Downvote'}
          aria-pressed={downvoteRemovesVote ? undefined : downActive}
        >
          <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default VotingControls;
