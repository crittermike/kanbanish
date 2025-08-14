import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { COMMON_EMOJIS, getEmojiKeywords } from '../utils/helpers';

const EmojiPicker = React.memo(({
  position,
  onEmojiSelect,
  onClose,
  hasUserReactedWithEmoji
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) {
      return COMMON_EMOJIS;
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return COMMON_EMOJIS.filter(emoji => {
      const keywords = getEmojiKeywords(emoji);
      return keywords.some(keyword => 
        keyword.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm]);

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
      <div className="emoji-picker-search">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          data-testid="emoji-search-input"
          className="emoji-search-input"
          autoFocus
        />
      </div>
      <div className="emoji-picker-grid">
        {filteredEmojis.map(emoji => (
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
        {filteredEmojis.length === 0 && searchTerm.trim() && (
          <div className="emoji-picker-no-results" data-testid="emoji-no-results">
            No emojis found for &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});

export default EmojiPicker;
