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
  disabled = false
}) => {
  const emojiButtonRef = useRef(null);

  return (
    <div className="emoji-reactions">
      <div className="reactions-left">
        {reactions && Object.entries(reactions).map(([emoji, reactionData]) => {
          if (reactionData.count <= 0) return null;

          const hasUserReacted = reactionData.users && reactionData.users[userId];

          return (
            <div
              className={`emoji-reaction ${hasUserReacted ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              key={emoji}
              data-testid="emoji-reaction"
              onClick={disabled ? undefined : (e) => addReaction(e, emoji)}
              title={disabled ? "Reactions disabled until cards are revealed" : (hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction")}
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
        <button
          className={`add-reaction-button ${disabled ? 'disabled' : ''}`}
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
          title={disabled ? "Reactions disabled until cards are revealed" : "Add reaction"}
          ref={emojiButtonRef}
          disabled={disabled}
        >+</button>
      </div>
      {!disabled && (
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
