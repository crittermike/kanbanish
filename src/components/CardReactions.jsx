import React, { useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import { MessageSquare } from 'react-feather';
import { 
  shouldUseDisabledStyling, 
  shouldHideFeature, 
  getReactionDisabledMessage 
} from '../utils/retrospectiveModeUtils';
import { areInteractionsVisible } from '../utils/workflowUtils';

const CardReactions = React.memo(({
  reactions,
  userId,
  showEmojiPicker,
  setShowEmojiPicker,
  setShowComments,
  addReaction,
  hasUserReactedWithEmoji,
  commentCount,
  toggleComments,
  emojiPickerPosition,
  setEmojiPickerPosition,
  disabled = false,
  disabledReason = 'cards-not-revealed',
  retrospectiveMode = false,
  workflowPhase = 'CREATION'
}) => {
  const emojiButtonRef = useRef(null);

  // Determine if comments button should be shown based on workflow phase
  // Comments are visible when interactions are visible
  const shouldShowCommentsButton = areInteractionsVisible(workflowPhase, retrospectiveMode);

  // Use utility functions for consistent logic
  const useDisabledStyling = shouldUseDisabledStyling(disabled, disabledReason);
  const hideAddButton = shouldHideFeature(disabledReason);
  const isFrozen = disabledReason === 'frozen';

  return (
    <div className="emoji-reactions">
      <div className="reactions-left">
        {reactions && Object.entries(reactions).map(([emoji, reactionData]) => {
          if (reactionData.count <= 0) return null;

          const hasUserReacted = reactionData.users && reactionData.users[userId];

          return (
            <div
              className={`emoji-reaction ${hasUserReacted ? 'active' : ''} ${useDisabledStyling ? 'disabled' : ''} ${isFrozen ? 'frozen' : ''}`}
              key={emoji}
              data-testid="emoji-reaction"
              onClick={disabled ? undefined : (e) => addReaction(e, emoji)}
              title={disabled ? getReactionDisabledMessage(disabledReason) : (hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction")}
            >
              <span className="emoji">{emoji}</span>
              <span className="count">{reactionData.count}</span>
            </div>
          );
        })}
        {showEmojiPicker && (
          <EmojiPicker
            position={emojiPickerPosition}
            onEmojiSelect={addReaction}
            onClose={() => setShowEmojiPicker(false)}
            hasUserReactedWithEmoji={hasUserReactedWithEmoji}
          />
        )}
        {/* Hide add reaction button when interactions are frozen */}
        {!hideAddButton && (
          <button
            className={`add-reaction-button ${useDisabledStyling ? 'disabled' : ''}`}
            onClick={disabled ? undefined : (e) => {
              e.stopPropagation();
              if (emojiButtonRef.current) {
                const buttonRect = emojiButtonRef.current.getBoundingClientRect();
                setEmojiPickerPosition({
                  top: buttonRect.bottom + window.scrollY + 5,
                  left: buttonRect.left + window.scrollX
                });
              }
              setShowEmojiPicker(!showEmojiPicker);
              setShowComments(false);
            }}
            title={disabled ? getReactionDisabledMessage(disabledReason) : "Add reaction"}
            ref={emojiButtonRef}
            disabled={useDisabledStyling}
          >+</button>
        )}
      </div>
      {shouldShowCommentsButton && (
        <div className="reactions-right">
          <button
            className="comments-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleComments();
            }}
            title="Toggle comments"
          >
            <MessageSquare size={16} />
            <span>{commentCount || 0}</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default CardReactions;
