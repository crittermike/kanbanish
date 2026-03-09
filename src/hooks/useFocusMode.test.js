import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useFocusMode, { flattenCards } from './useFocusMode';

describe('flattenCards', () => {
  it('returns empty array for null/undefined columns', () => {
    expect(flattenCards(null, false)).toEqual([]);
    expect(flattenCards(undefined, false)).toEqual([]);
    expect(flattenCards({}, false)).toEqual([]);
  });

  it('flattens ungrouped cards from sorted columns', () => {
    const columns = {
      'b_col2': {
        title: 'Done',
        cards: {
          'card3': { content: 'Card 3', votes: 0 }
        }
      },
      'a_col1': {
        title: 'To Do',
        cards: {
          'card1': { content: 'Card 1', votes: 2 },
          'card2': { content: 'Card 2', votes: 5 }
        }
      }
    };

    const result = flattenCards(columns, false);
    expect(result).toHaveLength(3);
    // Column a_col1 should come first (alphabetical column keys)
    expect(result[0].columnTitle).toBe('To Do');
    expect(result[2].columnTitle).toBe('Done');
  });

  it('sorts cards by votes when sortByVotes is true', () => {
    const columns = {
      'a_col1': {
        title: 'To Do',
        cards: {
          'card1': { content: 'Low', votes: 1 },
          'card2': { content: 'High', votes: 10 },
          'card3': { content: 'Mid', votes: 5 }
        }
      }
    };

    const result = flattenCards(columns, true);
    expect(result[0].cardData.content).toBe('High');
    expect(result[1].cardData.content).toBe('Mid');
    expect(result[2].cardData.content).toBe('Low');
  });

  it('includes grouped cards with group metadata', () => {
    const columns = {
      'a_col1': {
        title: 'To Do',
        cards: {
          'card1': { content: 'Grouped card', votes: 0, groupId: 'group1' },
          'card2': { content: 'Ungrouped card', votes: 0 }
        },
        groups: {
          'group1': { name: 'My Group', cardIds: ['card1'] }
        }
      }
    };

    const result = flattenCards(columns, false);
    expect(result).toHaveLength(2);

    const grouped = result.find(c => c.cardId === 'card1');
    expect(grouped.groupId).toBe('group1');
    expect(grouped.groupName).toBe('My Group');

    const ungrouped = result.find(c => c.cardId === 'card2');
    expect(ungrouped.groupId).toBeUndefined();
  });

  it('skips columns with no cards', () => {
    const columns = {
      'a_col1': { title: 'Empty', cards: null },
      'b_col2': { title: 'Has Cards', cards: { 'card1': { content: 'Hello', votes: 0 } } }
    };

    const result = flattenCards(columns, false);
    expect(result).toHaveLength(1);
    expect(result[0].columnTitle).toBe('Has Cards');
  });
});

describe('useFocusMode', () => {
  const mockColumns = {
    'a_col1': {
      title: 'To Do',
      cards: {
        'card1': { content: 'First', votes: 3 },
        'card2': { content: 'Second', votes: 1 }
      }
    },
    'b_col2': {
      title: 'Done',
      cards: {
        'card3': { content: 'Third', votes: 0 }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  it('starts inactive with index 0', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalCards).toBe(3);
    expect(result.current.autoPlayActive).toBe(false);
  });

  it('enters and exits focus mode', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    expect(result.current.isActive).toBe(true);
    expect(result.current.currentIndex).toBe(0);

    act(() => { result.current.exit(); });
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('navigates forward and backward', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });

    act(() => { result.current.goNext(); });
    expect(result.current.currentIndex).toBe(1);

    act(() => { result.current.goNext(); });
    expect(result.current.currentIndex).toBe(2);

    // Should not go past last card
    act(() => { result.current.goNext(); });
    expect(result.current.currentIndex).toBe(2);

    act(() => { result.current.goPrev(); });
    expect(result.current.currentIndex).toBe(1);

    // Should not go before first card
    act(() => { result.current.goPrev(); });
    act(() => { result.current.goPrev(); });
    expect(result.current.currentIndex).toBe(0);
  });

  it('jumps to specific index', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    act(() => { result.current.goToIndex(2); });
    expect(result.current.currentIndex).toBe(2);

    // Clamps out-of-range values
    act(() => { result.current.goToIndex(100); });
    expect(result.current.currentIndex).toBe(2);

    act(() => { result.current.goToIndex(-5); });
    expect(result.current.currentIndex).toBe(0);
  });

  it('returns correct currentCard', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    expect(result.current.currentCard.cardData.content).toBe('First');

    act(() => { result.current.goNext(); });
    expect(result.current.currentCard.cardData.content).toBe('Second');
  });

  it('locks body scroll when active', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    expect(document.body.style.overflow).toBe('hidden');

    act(() => { result.current.exit(); });
    expect(document.body.style.overflow).toBe('');
  });

  it('handles keyboard navigation', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });

    // ArrowRight -> next
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(1);

    // ArrowLeft -> prev
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(result.current.currentIndex).toBe(0);

    // End -> last card
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    });
    expect(result.current.currentIndex).toBe(2);

    // Home -> first card
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    });
    expect(result.current.currentIndex).toBe(0);

    // Space -> toggle auto-play
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    });
    expect(result.current.autoPlayActive).toBe(true);

    // Escape -> exit
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.isActive).toBe(false);
  });

  it('does not respond to keyboard when inactive', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    // Focus mode is inactive
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('auto-play advances cards on interval', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    act(() => { result.current.toggleAutoPlay(); });
    expect(result.current.autoPlayActive).toBe(true);

    // Advance by one interval (default 5000ms)
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.currentIndex).toBe(1);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.currentIndex).toBe(2);

    // Should stop at last card and disable auto-play
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.autoPlayActive).toBe(false);
  });

  it('stops auto-play on exit', () => {
    const { result } = renderHook(() => useFocusMode({ columns: mockColumns, sortByVotes: false }));

    act(() => { result.current.enter(); });
    act(() => { result.current.toggleAutoPlay(); });
    expect(result.current.autoPlayActive).toBe(true);

    act(() => { result.current.exit(); });
    expect(result.current.autoPlayActive).toBe(false);
  });

  it('clamps index when cards are removed', () => {
    const { result, rerender } = renderHook(
      (props) => useFocusMode(props),
      { initialProps: { columns: mockColumns, sortByVotes: false } }
    );

    act(() => { result.current.enter(); });
    act(() => { result.current.goToIndex(2); });
    expect(result.current.currentIndex).toBe(2);

    // Remove cards so there's only 1
    const smallerColumns = {
      'a_col1': {
        title: 'To Do',
        cards: { 'card1': { content: 'Only one', votes: 0 } }
      }
    };

    rerender({ columns: smallerColumns, sortByVotes: false });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalCards).toBe(1);
  });

  it('handles empty columns gracefully', () => {
    const { result } = renderHook(() => useFocusMode({ columns: {}, sortByVotes: false }));
    expect(result.current.totalCards).toBe(0);
    expect(result.current.currentCard).toBeNull();
  });
});
