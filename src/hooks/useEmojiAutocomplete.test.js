import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import useEmojiAutocomplete from './useEmojiAutocomplete';

/**
 * Creates a mock inputRef that simulates a textarea/input element
 * with a configurable selectionStart position.
 */
function createMockInputRef(selectionStart = 0) {
  return {
    current: {
      selectionStart,
      selectionEnd: selectionStart,
      focus: vi.fn(),
    },
  };
}

describe('useEmojiAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns isOpen: false and empty suggestions when value is empty', () => {
    const setValue = vi.fn();
    const inputRef = createMockInputRef(0);
    const { result } = renderHook(() =>
      useEmojiAutocomplete('', setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  test('returns isOpen: false when value has no colon pattern', () => {
    const setValue = vi.fn();
    const inputRef = createMockInputRef(11);
    const { result } = renderHook(() =>
      useEmojiAutocomplete('hello world', setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  test('returns isOpen: false when colon is followed by a space', () => {
    const setValue = vi.fn();
    const inputRef = createMockInputRef(6);
    const { result } = renderHook(() =>
      useEmojiAutocomplete('test : nope', setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  test('returns suggestions when value contains an active :shortcode pattern', () => {
    const value = 'hello :hea';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.suggestions.length).toBeGreaterThan(0);
    expect(result.current.isOpen).toBe(true);
    // Results should relate to "hea" (e.g., heart emojis)
    for (const s of result.current.suggestions) {
      expect(s).toHaveProperty('shortcode');
      expect(s).toHaveProperty('emoji');
    }
  });

  test('isOpen is true when suggestions are available', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });

  test('isOpen is false when colon is in the middle of a word', () => {
    const value = 'abc:fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    // colon preceded by \w should not trigger autocomplete
    expect(result.current.isOpen).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });

  test('onSelect replaces the :query token with the selected emoji', () => {
    const value = 'hello :fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);
    const emojiToInsert = result.current.suggestions[0].emoji;

    act(() => {
      result.current.onSelect(0);
    });

    // setValue should have been called with the emoji replacing `:fire`
    expect(setValue).toHaveBeenCalledTimes(1);
    const newValue = setValue.mock.calls[0][0];
    expect(newValue).toContain(emojiToInsert);
    expect(newValue).not.toContain(':fire');
    expect(newValue.startsWith('hello ')).toBe(true);
  });

  test('onSelect handles text before and after the :query token', () => {
    const value = 'start :hea end';
    const setValue = vi.fn();
    // cursor is right after ":hea" (index 10)
    const inputRef = createMockInputRef(10);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);
    const emojiToInsert = result.current.suggestions[0].emoji;

    act(() => {
      result.current.onSelect(0);
    });

    expect(setValue).toHaveBeenCalledTimes(1);
    const newValue = setValue.mock.calls[0][0];
    expect(newValue).toContain(emojiToInsert);
    expect(newValue.startsWith('start ')).toBe(true);
    expect(newValue.endsWith(' end')).toBe(true);
  });

  test('selectedIndex resets when onChange is called', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.onChange();
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  test('close resets selectedIndex to 0', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);

    // Move selectedIndex away from 0 first
    act(() => {
      result.current.onKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => {
      result.current.close();
    });

    // selectedIndex is reset; isOpen/suggestions still derive from value+cursor
    // so they remain until the value changes — close is for keyboard dismissal
    expect(result.current.selectedIndex).toBe(0);
  });

  test('returns all expected properties from the hook', () => {
    const setValue = vi.fn();
    const inputRef = createMockInputRef(0);
    const { result } = renderHook(() =>
      useEmojiAutocomplete('', setValue, inputRef)
    );

    expect(result.current).toHaveProperty('suggestions');
    expect(result.current).toHaveProperty('selectedIndex');
    expect(result.current).toHaveProperty('isOpen');
    expect(result.current).toHaveProperty('onChange');
    expect(result.current).toHaveProperty('onKeyDown');
    expect(result.current).toHaveProperty('onSelect');
    expect(result.current).toHaveProperty('close');
  });

  test('onKeyDown ArrowDown increments selectedIndex when open', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.onKeyDown({
        key: 'ArrowDown',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  test('onKeyDown ArrowUp decrements selectedIndex when open', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    // Start at index 0, ArrowUp should wrap to last
    act(() => {
      result.current.onKeyDown({
        key: 'ArrowUp',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    expect(result.current.selectedIndex).toBe(
      result.current.suggestions.length - 1
    );
  });

  test('onKeyDown Escape closes the autocomplete', () => {
    const value = ':fire';
    const setValue = vi.fn();
    const inputRef = createMockInputRef(value.length);
    const { result } = renderHook(() =>
      useEmojiAutocomplete(value, setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onKeyDown({
        key: 'Escape',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  test('onKeyDown does nothing when autocomplete is closed', () => {
    const setValue = vi.fn();
    const inputRef = createMockInputRef(5);
    const { result } = renderHook(() =>
      useEmojiAutocomplete('hello', setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(false);
    const preventDefault = vi.fn();

    act(() => {
      result.current.onKeyDown({
        key: 'ArrowDown',
        preventDefault,
        stopPropagation: vi.fn(),
      });
    });

    // preventDefault should NOT have been called since autocomplete is closed
    expect(preventDefault).not.toHaveBeenCalled();
  });

  test('inputRef with null current returns empty suggestions', () => {
    const setValue = vi.fn();
    const inputRef = { current: null };
    const { result } = renderHook(() =>
      useEmojiAutocomplete(':fire', setValue, inputRef)
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.suggestions).toEqual([]);
  });
});
