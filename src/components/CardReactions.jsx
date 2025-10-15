import React from 'react';
import {
  shouldUseDisabledStyling,
  getReactionDisabledMessage
} from '../utils/retrospectiveModeUtils';

const CardReactions = React.memo(({
  reactions,
  userId,
  addReaction,
  disabled = false,
  disabledReason = 'cards-not-revealed'
}) => {
  // Use utility functions for consistent logic
  const useDisabledStyling = shouldUseDisabledStyling(disabled, disabledReason);
  const isFrozen = disabledReason === 'frozen';

  // Check if there are any reactions to display
  const hasReactions = reactions && Object.entries(reactions).some(([, reactionData]) => reactionData.count > 0);
  
  // Hide the entire reactions bar if there are no reactions
  // This saves vertical space on cards
  if (!hasReactions) {
    return null;
  }

  return (
    <div className="emoji-reactions">
      <div className="reactions-left">
        {reactions && Object.entries(reactions).map(([emoji, reactionData]) => {
          if (reactionData.count <= 0) {
            return null;
          }

          const hasUserReacted = reactionData.users && reactionData.users[userId];

          return (
            <div
              className={`emoji-reaction ${hasUserReacted ? 'active' : ''} ${useDisabledStyling ? 'disabled' : ''} ${isFrozen ? 'frozen' : ''}`}
              key={emoji}
              data-testid="emoji-reaction"
              onClick={disabled ? undefined : e => addReaction(e, emoji)}
              title={disabled ? getReactionDisabledMessage(disabledReason) : (hasUserReacted ? 'Click to remove your reaction' : 'Click to add your reaction')}
            >
              <span className="emoji">{emoji}</span>
              <span className="count">{reactionData.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default CardReactions;
