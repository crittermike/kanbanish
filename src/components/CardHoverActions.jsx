import React, { useRef } from 'react';
import { MessageSquare, Smile } from 'react-feather';
import {
  shouldUseDisabledStyling,
  shouldHideFeature,
  getReactionDisabledMessage
} from '../utils/retrospectiveModeUtils';
import EmojiPicker from './EmojiPicker';

const CardHoverActions = React.memo(({
  showEmojiPicker,
  setShowEmojiPicker,
  setShowComments,
  toggleComments,
  setEmojiPickerPosition,
  emojiPickerPosition,
  addReaction,
  hasUserReactedWithEmoji,
  commentCount = 0,
  disabled = false,
  disabledReason = 'cards-not-revealed'
}) => {
  const emojiButtonRef = useRef(null);

  // Use utility functions for consistent logic
  const useDisabledStyling = shouldUseDisabledStyling(disabled, disabledReason);
  const hideAddButton = shouldHideFeature(disabledReason);

  return (
    <div className="card-hover-actions">
      {showEmojiPicker && (
        <EmojiPicker
          position={emojiPickerPosition}
          onEmojiSelect={addReaction}
          onClose={() => setShowEmojiPicker(false)}
          hasUserReactedWithEmoji={hasUserReactedWithEmoji}
        />
      )}
      {!hideAddButton && (
        <button
          className={`card-hover-action emoji-action ${useDisabledStyling ? 'disabled' : ''}`}
          onClick={disabled ? undefined : e => {
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
          title={disabled ? getReactionDisabledMessage(disabledReason) : 'Add reaction'}
          aria-label="Add reaction"
          ref={emojiButtonRef}
          disabled={useDisabledStyling}
        >
          <Smile size={16} aria-hidden="true" />
        </button>
      )}
      {/* Show comment button on hover only */}
      <button
        className={`card-hover-action comment-action ${commentCount > 0 ? 'has-comments' : ''}`}
        onClick={e => {
          e.stopPropagation();
          toggleComments();
        }}
        title="Toggle comments"
      >
        <MessageSquare size={16} />
        {commentCount > 0 && <span className="comment-count">{commentCount}</span>}
      </button>
    </div>
  );
});

export default CardHoverActions;
