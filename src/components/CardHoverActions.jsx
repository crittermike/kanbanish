import React, { useRef } from 'react';
import { MessageSquare, Smile, Edit2 } from 'react-feather';
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
  reactionDisabled = false,
  reactionDisabledReason = 'cards-not-revealed',
  showEmojiAction = true,
  showCommentAction = true,
  onEdit
}) => {
  const emojiButtonRef = useRef(null);

  const useReactionDisabledStyling = shouldUseDisabledStyling(reactionDisabled, reactionDisabledReason);
  const hideReactionAction = !showEmojiAction || shouldHideFeature(reactionDisabledReason);

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

      {onEdit && (
        <button
          className="card-hover-action edit-action"
          onClick={e => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit card"
          aria-label="Edit card"
        >
          <Edit2 size={16} aria-hidden="true" />
        </button>
      )}

      {!hideReactionAction && (
        <button
          className={`card-hover-action emoji-action ${useReactionDisabledStyling ? 'disabled' : ''}`}
          onClick={reactionDisabled ? undefined : e => {
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
          title={reactionDisabled ? getReactionDisabledMessage(reactionDisabledReason) : 'Add reaction'}
          aria-label="Add reaction"
          ref={emojiButtonRef}
          disabled={useReactionDisabledStyling}
        >
          <Smile size={16} aria-hidden="true" />
        </button>
      )}

      {showCommentAction && (
        <button
          className="card-hover-action comment-action"
          onClick={e => {
            e.stopPropagation();
            setShowEmojiPicker(false);
            toggleComments();
          }}
          title="Toggle comments"
          aria-label="Toggle comments"
        >
          <MessageSquare size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default CardHoverActions;
