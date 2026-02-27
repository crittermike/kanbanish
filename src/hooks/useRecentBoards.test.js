import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, beforeEach, expect } from 'vitest';
import { useRecentBoards } from './useRecentBoards';

const STORAGE_KEY = 'kanbanish_recent_boards';

describe('useRecentBoards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('returns empty array initially when localStorage is empty', () => {
    const { result } = renderHook(() => useRecentBoards());
    expect(result.current.recentBoards).toEqual([]);
  });

  test('addBoard adds a new board', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'My Board', cardCount: 5 });
    });

    expect(result.current.recentBoards).toHaveLength(1);
    expect(result.current.recentBoards[0]).toMatchObject({
      id: 'board-1',
      title: 'My Board',
      cardCount: 5,
      pinned: false
    });
    expect(result.current.recentBoards[0].lastVisited).toBeGreaterThan(0);
  });

  test('addBoard uses default title when none provided', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1' });
    });

    expect(result.current.recentBoards[0].title).toBe('Untitled Board');
    expect(result.current.recentBoards[0].cardCount).toBe(0);
  });

  test('addBoard updates existing board lastVisited', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'First' });
    });

    const firstVisited = result.current.recentBoards[0].lastVisited;


    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Updated Title' });
    });

    expect(result.current.recentBoards).toHaveLength(1);
    expect(result.current.recentBoards[0].title).toBe('Updated Title');
    expect(result.current.recentBoards[0].lastVisited).toBeGreaterThanOrEqual(firstVisited);
  });

  test('removeBoard removes a board', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Board 1' });
      result.current.addBoard({ id: 'board-2', title: 'Board 2' });
    });

    act(() => {
      result.current.removeBoard('board-1');
    });

    expect(result.current.recentBoards).toHaveLength(1);
    expect(result.current.recentBoards[0].id).toBe('board-2');
  });

  test('togglePin pins and unpins a board', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Board 1' });
    });

    expect(result.current.recentBoards[0].pinned).toBe(false);

    act(() => {
      result.current.togglePin('board-1');
    });

    expect(result.current.recentBoards[0].pinned).toBe(true);

    act(() => {
      result.current.togglePin('board-1');
    });

    expect(result.current.recentBoards[0].pinned).toBe(false);
  });

  test('updateBoardMeta updates title and cardCount without changing lastVisited', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Old Title', cardCount: 0 });
    });

    const originalLastVisited = result.current.recentBoards[0].lastVisited;

    act(() => {
      result.current.updateBoardMeta('board-1', { title: 'New Title', cardCount: 10 });
    });

    expect(result.current.recentBoards[0].title).toBe('New Title');
    expect(result.current.recentBoards[0].cardCount).toBe(10);
    expect(result.current.recentBoards[0].lastVisited).toBe(originalLastVisited);
  });

  test('clearAll removes all boards', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1' });
      result.current.addBoard({ id: 'board-2' });
      result.current.addBoard({ id: 'board-3' });
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.recentBoards).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  test('sorts pinned boards first, then by lastVisited desc', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Oldest' });
    });
    act(() => {
      result.current.addBoard({ id: 'board-2', title: 'Middle' });
    });
    act(() => {
      result.current.addBoard({ id: 'board-3', title: 'Newest' });
    });

    // Pin the oldest board
    act(() => {
      result.current.togglePin('board-1');
    });

    // Pinned board should be first
    expect(result.current.recentBoards[0].id).toBe('board-1');
    expect(result.current.recentBoards[0].pinned).toBe(true);

    // Then newest unpinned before older unpinned
    expect(result.current.recentBoards[1].id).toBe('board-3');
    expect(result.current.recentBoards[2].id).toBe('board-2');
  });

  test('trims to 20 boards max', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addBoard({ id: `board-${i}`, title: `Board ${i}` });
      }
    });

    expect(result.current.recentBoards.length).toBeLessThanOrEqual(20);
  });

  test('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentBoards());

    act(() => {
      result.current.addBoard({ id: 'board-1', title: 'Saved Board' });
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('board-1');
  });

  test('loads from localStorage on init', () => {
    const boards = [
      { id: 'pre-existing', title: 'Pre-existing Board', lastVisited: Date.now(), cardCount: 3, pinned: false }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));

    const { result } = renderHook(() => useRecentBoards());

    expect(result.current.recentBoards).toHaveLength(1);
    expect(result.current.recentBoards[0].id).toBe('pre-existing');
  });
});
