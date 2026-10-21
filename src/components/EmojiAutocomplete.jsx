import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Dropdown list that shows matching emoji shortcodes while the user
 * types `:shortcode` in a textarea or input.
 *
 * Rendered via portal so it is not clipped by parent overflow.
 */
const EmojiAutocomplete = React.memo(
  ({ suggestions = [], selectedIndex, onSelect, inputRef, loading, error }) => {
    if (!suggestions?.length && !loading && !error) return null;

    // Position the dropdown near the input element
    const rect = inputRef?.current?.getBoundingClientRect();
    if (!rect) return null;

    const style = {
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: Math.min(rect.width, 260),
    };

    return ReactDOM.createPortal(
      <div
        className="emoji-autocomplete"
        style={style}
        role={suggestions.length ? 'listbox' : 'status'}
        aria-label="Emoji suggestions"
        data-testid="emoji-autocomplete"
      >
        {loading && <div className="emoji-autocomplete-item">Loading emojis...</div>}
        {error && (
          <div className="emoji-autocomplete-item emoji-search-error" role="alert">
            Emoji search unavailable. <button className="emoji-search-reload" onMouseDown={e => e.preventDefault()} onClick={() => window.location.reload()}>Reload</button>
          </div>
        )}
        {suggestions.map(({ shortcode, emoji }, index) => (
          <div
            key={shortcode}
            role="option"
            aria-selected={index === selectedIndex}
            className={`emoji-autocomplete-item${
              index === selectedIndex ? ' selected' : ''
            }`}
            data-testid="emoji-autocomplete-item"
            onMouseDown={(e) => {
              // mouseDown instead of click so it fires before the input blurs
              e.preventDefault();
              onSelect(index);
            }}
          >
            <span className="emoji-autocomplete-char">{emoji}</span>
            <span className="emoji-autocomplete-code">:{shortcode}:</span>
          </div>
        ))}
      </div>,
      document.body
    );
  }
);

EmojiAutocomplete.displayName = 'EmojiAutocomplete';

export default EmojiAutocomplete;
