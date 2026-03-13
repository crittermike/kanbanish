import { useState, useCallback, useRef, useMemo } from 'react';
import { searchEmojiShortcodes } from '../utils/emojiShortcodes';

/**
 * Extracts the `:shortcode` token being typed at the cursor position.
 *
 * Looks backward from `cursorPos` for an unmatched `:` (no whitespace
 * between it and the cursor). Returns the text between the colon and the
 * cursor, or `null` if no active token is found.
 *
 * @param {string} text        Full textarea / input value
 * @param {number} cursorPos   Current cursor position (selectionStart)
 * @returns {{ query: string, startIndex: number } | null}
 */
function getActiveToken(text, cursorPos) {
  // Walk backwards from cursor to find a `:`
  const before = text.slice(0, cursorPos);
  const colonIdx = before.lastIndexOf(':');

  if (colonIdx === -1) return null;

  const fragment = before.slice(colonIdx + 1);

  // Must be non-empty, no spaces, and no more colons (which would mean
  // the user already closed the shortcode).
  if (
    fragment.length === 0 ||
    /\s/.test(fragment) ||
    fragment.includes(':')
  ) {
    return null;
  }

  // The colon should be at the start of the text or preceded by a space /
  // punctuation — not in the middle of a word.
  if (colonIdx > 0 && /\w/.test(before[colonIdx - 1])) {
    return null;
  }

  return { query: fragment, startIndex: colonIdx };
}

/**
 * Hook that powers emoji shortcode autocomplete for textareas and inputs.
 *
 * Usage:
 * ```jsx
 * const {
 *   suggestions, selectedIndex, onChange, onKeyDown, onSelect,
 *   isOpen, close,
 * } = useEmojiAutocomplete(value, setValue, textareaRef);
 * ```
 *
 * @param {string}   value       Controlled input value
 * @param {Function} setValue    State setter for the input value
 * @param {React.RefObject} inputRef  Ref to the textarea / input element
 * @returns {object}
 */
export default function useEmojiAutocomplete(value, setValue, inputRef) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tokenRef = useRef(null); // caches the active token

  // Derive suggestions from the current value + cursor position.
  // We store the token in a ref so onKeyDown can read it synchronously.
  const suggestions = useMemo(() => {
    const el = inputRef?.current;
    if (!el) return [];
    const token = getActiveToken(value, el.selectionStart ?? value.length);
    tokenRef.current = token;
    if (!token) return [];
    return searchEmojiShortcodes(token.query);
  }, [value, inputRef]);

  const isOpen = suggestions.length > 0;

  /** Replace the `:query` token with the selected emoji. */
  const applyEmoji = useCallback(
    (emoji) => {
      const token = tokenRef.current;
      if (!token) return;
      const before = value.slice(0, token.startIndex);
      const after = value.slice(
        token.startIndex + 1 + token.query.length // +1 for the ':'
      );
      const next = before + emoji + after;
      setValue(next);
      tokenRef.current = null;

      // Move cursor after the inserted emoji
      window.requestAnimationFrame(() => {
        const el = inputRef?.current;
        if (el) {
          const pos = before.length + emoji.length;
          el.selectionStart = pos;
          el.selectionEnd = pos;
          el.focus();
        }
      });
    },
    [value, setValue, inputRef]
  );

  /** Select an emoji from the suggestion list (by index). */
  const onSelect = useCallback(
    (index) => {
      const item = suggestions[index];
      if (item) applyEmoji(item.emoji);
    },
    [suggestions, applyEmoji]
  );

  const close = useCallback(() => {
    tokenRef.current = null;
    setSelectedIndex(0);
  }, []);

  /**
   * Keyboard handler — should be called from the textarea / input's
   * `onKeyDown`. It intercepts arrow keys, Enter/Tab, and Escape only
   * when the autocomplete popup is open.
   */
  const onKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(selectedIndex);
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [isOpen, suggestions.length, selectedIndex, onSelect, close]
  );

  /**
   * onChange wrapper — keeps selectedIndex in sync when the query changes.
   * Call the parent's onChange/setValue *before* this, or just use this as
   * the onChange handler (it calls setValue internally when needed).
   */
  const onChange = useCallback(() => {
    // Reset selection when query changes
    setSelectedIndex(0);
  }, []);

  return {
    suggestions,
    selectedIndex,
    isOpen,
    onChange,
    onKeyDown,
    onSelect,
    close,
  };
}
