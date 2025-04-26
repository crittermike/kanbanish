import React, { useRef } from 'react';
import EmojiPicker from './EmojiPicker';

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
  setEmojiPickerPosition
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
              className={`emoji-reaction ${hasUserReacted ? 'active' : ''}`} 
              key={emoji} 
              data-testid="emoji-reaction"
              onClick={(e) => addReaction(e, emoji)}
              title={hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction"}
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
          className="add-reaction-button"
          onClick={(e) => {
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
          title="Add reaction"
          ref={emojiButtonRef}
        >+</button>
      </div>
      <div className="reactions-right">
        <button
          className="comments-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleComments();
          }}
          title="Toggle comments"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
          </svg>
          <span>{commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
});

export default CardReactions;
