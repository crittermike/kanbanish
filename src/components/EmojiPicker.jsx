import React from 'react';
import ReactDOM from 'react-dom';
import { COMMON_EMOJIS } from '../utils/helpers';

const EmojiPicker = React.memo(({
  position,
  onEmojiSelect,
  onClose,
  hasUserReactedWithEmoji
}) => {
  return ReactDOM.createPortal(
    <div
      className="emoji-picker"
      onClick={e => e.stopPropagation()}
      data-testid="emoji-picker"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {COMMON_EMOJIS.map(emoji => (
        <button
          key={emoji}
          className={`emoji-option ${hasUserReactedWithEmoji(emoji) ? 'selected' : ''}`}
          data-testid="emoji-option"
          onClick={e => {
            e.stopPropagation();
            onEmojiSelect(e, emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>,
    document.body
  );
});

export default EmojiPicker;
