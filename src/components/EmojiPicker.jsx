import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import useEmojiData from '../hooks/useEmojiData';
import { COMMON_EMOJIS } from '../utils/emoji';

const EmojiPicker = React.memo(({
  position,
  onEmojiSelect,
  onClose,
  hasUserReactedWithEmoji
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useEmojiData(true);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) {
      return COMMON_EMOJIS;
    }

    return data?.search(searchTerm).map(result => result.emoji) || [];
  }, [searchTerm, data]);

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
          aria-label="Search emojis"
        />
      </div>
      <div className="emoji-picker-grid">
        {filteredEmojis.map(emoji => (
          <button
            key={emoji}
            className={`emoji-option ${hasUserReactedWithEmoji(emoji) ? 'selected' : ''}`}
            data-testid="emoji-option"
            aria-label={data?.getLabel(emoji) || emoji}
            onClick={e => {
              e.stopPropagation();
              onEmojiSelect(e, emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
        {searchTerm.trim() && loading && (
          <div className="emoji-picker-no-results" role="status">Loading emojis...</div>
        )}
        {error && (
          <div className="emoji-picker-no-results emoji-search-error" role="alert">
            Emoji search unavailable. <button className="emoji-search-reload" onClick={() => window.location.reload()}>Reload</button>
          </div>
        )}
        {filteredEmojis.length === 0 && searchTerm.trim() && !loading && !error && (
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
