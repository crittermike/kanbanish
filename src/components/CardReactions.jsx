import React, { useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import { MessageSquare } from 'react-feather';

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
  revealMode = false,
  cardsRevealed = false
}) => {
  const emojiButtonRef = useRef(null);

  // Determine if comments button should be shown
  // Hide comments button only in Phase 1 of reveal mode (reveal mode on, cards not revealed)
  const shouldShowCommentsButton = !(revealMode && !cardsRevealed);

  // Determine the appropriate disabled message based on the reason
  const getDisabledMessage = () => {
    switch (disabledReason) {
      case 'frozen':
        return 'Interactions are now frozen - no more changes allowed';
      case 'cards-not-revealed':
      default:
        return 'Reactions disabled until cards are revealed';
    }
  };

  // Determine styling approach based on disabled reason
  // In frozen state (Phase 3), keep normal appearance but disable interactions
  // In cards-not-revealed state (Phase 1), use disabled styling
  const shouldUseDisabledStyling = disabled && disabledReason !== 'frozen';

  return (
    <div className="emoji-reactions">
      <div className="reactions-left">
        {reactions && Object.entries(reactions).map(([emoji, reactionData]) => {
          if (reactionData.count <= 0) return null;

          const hasUserReacted = reactionData.users && reactionData.users[userId];

          return (
            <div
              className={`emoji-reaction ${hasUserReacted ? 'active' : ''} ${shouldUseDisabledStyling ? 'disabled' : ''} ${disabledReason === 'frozen' ? 'frozen' : ''}`}
              key={emoji}
              data-testid="emoji-reaction"
              onClick={disabled ? undefined : (e) => addReaction(e, emoji)}
              title={disabled ? getDisabledMessage() : (hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction")}
              style={disabledReason === 'frozen' ? { pointerEvents: 'none', cursor: 'default' } : undefined}
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
        {disabledReason !== 'frozen' && (
          <button
            className={`add-reaction-button ${shouldUseDisabledStyling ? 'disabled' : ''}`}
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
            title={disabled ? getDisabledMessage() : "Add reaction"}
            ref={emojiButtonRef}
            disabled={shouldUseDisabledStyling}
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
