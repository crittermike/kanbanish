import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Dropdown list that shows matching emoji shortcodes while the user
 * types `:shortcode` in a textarea or input.
 *
 * Rendered via portal so it is not clipped by parent overflow.
 */
const EmojiAutocomplete = React.memo(
  ({ suggestions, selectedIndex, onSelect, inputRef }) => {
    if (!suggestions || suggestions.length === 0) return null;

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
        role="listbox"
        aria-label="Emoji suggestions"
        data-testid="emoji-autocomplete"
      >
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
