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
  boardFrozen
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
              onClick={(e) => !boardFrozen && addReaction && addReaction(e, emoji)}
              title={boardFrozen ? "Board is frozen" : hasUserReacted ? "Click to remove your reaction" : "Click to add your reaction"}
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
            if (boardFrozen) return;
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
          title={boardFrozen ? "Board is frozen" : "Add reaction"}
          ref={emojiButtonRef}
          style={boardFrozen ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >+</button>
      </div>
      <div className="reactions-right">
        <button
          className="comments-btn"
          onClick={(e) => {
            if (boardFrozen) return;
            e.stopPropagation();
            toggleComments && toggleComments();
          }}
          title={boardFrozen ? "Board is frozen" : "Toggle comments"}
          style={boardFrozen ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <MessageSquare size={16} />
          <span>{commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
});

export default CardReactions;
