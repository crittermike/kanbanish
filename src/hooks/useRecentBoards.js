import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'kanbanish_recent_boards';
const MAX_RECENT_BOARDS = 20;

/**
 * Read recent boards from localStorage.
 * @returns {Array} Array of board objects sorted by lastVisited desc, pinned first
 */
function loadBoards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Persist boards array to localStorage.
 * @param {Array} boards
 */
function saveBoards(boards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/**
 * Sort boards: pinned first, then by lastVisited descending.
 * @param {Array} boards
 * @returns {Array}
 */
function sortBoards(boards) {
  return [...boards].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.lastVisited || 0) - (a.lastVisited || 0);
  });
}

/**
 * Hook for managing recent boards in localStorage.
 *
 * Each board entry has shape:
 * {
 *   id: string,          // board ID
 *   title: string,       // board title
 *   lastVisited: number, // timestamp
 *   cardCount: number,   // number of cards
 *   pinned: boolean      // whether board is pinned
 * }
 *
 * @returns {{
 *   recentBoards: Array,
 *   addBoard: (board: {id: string, title?: string, cardCount?: number}) => void,
 *   removeBoard: (boardId: string) => void,
 *   togglePin: (boardId: string) => void,
 *   updateBoardMeta: (boardId: string, meta: {title?: string, cardCount?: number}) => void,
 *   clearAll: () => void
 * }}
 */
export function useRecentBoards() {
  const [recentBoards, setRecentBoards] = useState(() => sortBoards(loadBoards()));

  // Sync state when localStorage changes from another tab
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setRecentBoards(sortBoards(loadBoards()));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /**
   * Add or update a board in the recent list.
   * If board exists, updates lastVisited and merges metadata.
   * If new, adds it and trims to MAX_RECENT_BOARDS (unpinned only).
   */
  const addBoard = useCallback(({ id, title, cardCount }) => {
    setRecentBoards(prev => {
      const existing = prev.find(b => b.id === id);
      let updated;

      if (existing) {
        updated = prev.map(b =>
          b.id === id
            ? {
              ...b,
              lastVisited: Date.now(),
              ...(title !== undefined && { title }),
              ...(cardCount !== undefined && { cardCount })
            }
            : b
        );
      } else {
        const newBoard = {
          id,
          title: title || 'Untitled Board',
          lastVisited: Date.now(),
          cardCount: cardCount || 0,
          pinned: false
        };
        updated = [newBoard, ...prev];
      }

      // Trim: keep all pinned + most recent unpinned up to MAX_RECENT_BOARDS total
      const sorted = sortBoards(updated);
      const pinned = sorted.filter(b => b.pinned);
      const unpinned = sorted.filter(b => !b.pinned);
      const trimmed = [...pinned, ...unpinned].slice(0, MAX_RECENT_BOARDS);

      saveBoards(trimmed);
      return trimmed;
    });
  }, []);

  /**
   * Remove a board from the recent list.
   */
  const removeBoard = useCallback((boardId) => {
    setRecentBoards(prev => {
      const updated = prev.filter(b => b.id !== boardId);
      saveBoards(updated);
      return updated;
    });
  }, []);

  /**
   * Toggle pin status of a board.
   */
  const togglePin = useCallback((boardId) => {
    setRecentBoards(prev => {
      const updated = prev.map(b =>
        b.id === boardId ? { ...b, pinned: !b.pinned } : b
      );
      const sorted = sortBoards(updated);
      saveBoards(sorted);
      return sorted;
    });
  }, []);

  /**
   * Update metadata (title, cardCount) for an existing board without changing lastVisited.
   */
  const updateBoardMeta = useCallback((boardId, meta) => {
    setRecentBoards(prev => {
      const updated = prev.map(b =>
        b.id === boardId
          ? {
            ...b,
            ...(meta.title !== undefined && { title: meta.title }),
            ...(meta.cardCount !== undefined && { cardCount: meta.cardCount })
          }
          : b
      );
      saveBoards(updated);
      return updated;
    });
  }, []);

  /**
   * Clear all recent boards.
   */
  const clearAll = useCallback(() => {
    saveBoards([]);
    setRecentBoards([]);
  }, []);

  return {
    recentBoards,
    addBoard,
    removeBoard,
    togglePin,
    updateBoardMeta,
    clearAll
  };
}
